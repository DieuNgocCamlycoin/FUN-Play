import { ethers } from "ethers";
import { supabase } from "@/integrations/supabase/client";
import { getWalletClient, switchChain } from "@wagmi/core";
import { wagmiConfig } from "@/lib/web3Config";

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

interface SendDonationParams {
  toAddress: string;
  amount: number;
  tokenSymbol: string;
  tokenAddress: string;
  decimals: number;
  videoId?: string;
}

export const sendDonation = async ({
  toAddress,
  amount,
  tokenSymbol,
  tokenAddress,
  decimals,
  videoId,
}: SendDonationParams) => {
  // Get wallet client from wagmi instead of window.ethereum
  let walletClient = await getWalletClient(wagmiConfig);
  if (!walletClient) {
    throw new Error("Vui lòng kết nối ví để tặng");
  }

  // If sending FUN Money, switch to BSC Testnet first using wagmi (works on mobile + desktop)
  const FUN_MONEY_CONTRACT = "0x1aa8DE8B1E4465C6d729E8564893f8EF823a5ff2";
  const isFunToken = tokenAddress.toLowerCase() === FUN_MONEY_CONTRACT.toLowerCase();

  if (isFunToken) {
    try {
      await switchChain(wagmiConfig, { chainId: 97 });
      // Re-fetch wallet client after chain switch
      walletClient = await getWalletClient(wagmiConfig);
      if (!walletClient) {
        throw new Error("Không thể kết nối ví sau khi chuyển mạng");
      }
    } catch (switchError: any) {
      console.error("[Donation] Failed to switch to BSC Testnet:", switchError);
      throw new Error("Vui lòng chuyển sang mạng BSC Testnet để gửi FUN");
    }
  }

  // Create ethers provider from walletClient transport (works with both injected & WalletConnect)
  const provider = new ethers.BrowserProvider(walletClient.transport as any);
  const signer = await provider.getSigner();
  const fromAddress = await signer.getAddress();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Look up recipient user ID from wallet address
  const { data: recipientProfile } = await supabase
    .from("profiles")
    .select("id")
    .ilike("wallet_address", toAddress)
    .single();

  const toUserId = recipientProfile?.id || null;

  let txHash: string;

  try {
    if (tokenAddress === "native") {
      // Send BNB
      const tx = await signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount.toString()),
      });
      txHash = tx.hash;
      
      // Wait for confirmation
      await tx.wait();
    } else {
      // Send ERC-20 token
      if (tokenAddress === "0x") {
        throw new Error(`${tokenSymbol} contract address not configured. Please contact support.`);
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const amountInWei = ethers.parseUnits(amount.toString(), decimals);

      const tx = await tokenContract.transfer(toAddress, amountInWei);
      txHash = tx.hash;
      
      // Wait for confirmation
      await tx.wait();
    }

    // Record transaction in database with to_user_id for notifications
    await supabase.from("wallet_transactions").insert({
      from_address: fromAddress,
      to_address: toAddress,
      from_user_id: user.id,
      to_user_id: toUserId,
      amount: amount,
      token_type: tokenSymbol,
      tx_hash: txHash,
      status: "completed",
      video_id: videoId || null,
    });

    // Send chat notification to receiver
    if (toUserId) {
      try {
        // Find existing chat or create new one
        const { data: existingChat } = await supabase
          .from("user_chats")
          .select("id")
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${toUserId}),and(user1_id.eq.${toUserId},user2_id.eq.${user.id})`)
          .maybeSingle();

        let chatId = existingChat?.id;

        if (!chatId) {
          const { data: newChat } = await supabase
            .from("user_chats")
            .insert({ user1_id: user.id, user2_id: toUserId })
            .select("id")
            .single();
          chatId = newChat?.id;
        }

        if (chatId) {
          await supabase.from("chat_messages").insert({
            chat_id: chatId,
            sender_id: user.id,
            message_type: "donation",
            content: `🎁 Bạn đã nhận được ${amount} ${tokenSymbol}!`,
          });
        }
      } catch (chatErr) {
        console.warn("[Donation] Failed to send chat notification:", chatErr);
      }
    }

    return { success: true, txHash };
  } catch (error: any) {
    // Record failed transaction
    if (txHash!) {
      await supabase.from("wallet_transactions").insert({
        from_address: fromAddress,
        to_address: toAddress,
        from_user_id: user.id,
        to_user_id: toUserId,
        amount: amount,
        token_type: tokenSymbol,
        tx_hash: txHash || "failed",
        status: "failed",
        video_id: videoId || null,
      });
    }

    throw new Error(error.message || "Transaction failed");
  }
};

export const getTransactionHistory = async (userId: string) => {
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("*")
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};
