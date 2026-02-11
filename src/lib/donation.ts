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

  // Determine target chain based on token
  const targetChainId = isFunToken ? 97 : 56; // BSC Testnet for FUN, BSC Mainnet for others
  const chainConfig = isFunToken
    ? {
        chainId: "0x61",
        chainName: "BSC Testnet",
        nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
        rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
        blockExplorerUrls: ["https://testnet.bscscan.com"],
      }
    : {
        chainId: "0x38",
        chainName: "BSC Mainnet",
        nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
        rpcUrls: ["https://bsc-dataseed.binance.org/"],
        blockExplorerUrls: ["https://bscscan.com"],
      };

  // Switch to the correct chain
  try {
    await switchChain(wagmiConfig, { chainId: targetChainId });
  } catch (switchError: any) {
    console.warn(`[Donation] switchChain(${targetChainId}) failed, trying wallet_addEthereumChain:`, switchError.message);
    try {
      const transport = walletClient.transport as any;
      if (transport?.request) {
        await transport.request({
          method: "wallet_addEthereumChain",
          params: [chainConfig],
        });
      }
      await switchChain(wagmiConfig, { chainId: targetChainId });
    } catch (addError: any) {
      console.error("[Donation] addChain + switchChain failed:", addError);
      throw new Error(
        `Không thể chuyển sang ${chainConfig.chainName}. Vui lòng thêm mạng thủ công trong ví:\n` +
        `• RPC: ${chainConfig.rpcUrls[0]}\n` +
        `• Chain ID: ${targetChainId} • Symbol: ${chainConfig.nativeCurrency.symbol}\n` +
        `• Explorer: ${chainConfig.blockExplorerUrls[0]}`
      );
    }
  }

  // Re-fetch wallet client after chain switch
  walletClient = await getWalletClient(wagmiConfig);
  if (!walletClient) {
    throw new Error("Không thể kết nối ví sau khi chuyển mạng");
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
      // Pre-flight balance check for BNB
      const bnbBalance = await provider.getBalance(fromAddress);
      const needed = ethers.parseEther(amount.toString());
      if (bnbBalance < needed) {
        throw new Error(
          `Số dư không đủ. Ví ${fromAddress.slice(0,6)}...${fromAddress.slice(-4)} ` +
          `chỉ có ${parseFloat(ethers.formatEther(bnbBalance)).toFixed(6)} BNB, ` +
          `cần ${amount} BNB`
        );
      }

      const tx = await signer.sendTransaction({
        to: toAddress,
        value: needed,
      });
      txHash = tx.hash;
      await tx.wait();
    } else {
      if (tokenAddress === "0x") {
        throw new Error(`${tokenSymbol} contract address not configured. Please contact support.`);
      }

      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const amountInWei = ethers.parseUnits(amount.toString(), decimals);

      // Pre-flight balance check for ERC-20
      const tokenBalance = await tokenContract.balanceOf(fromAddress);
      if (tokenBalance < amountInWei) {
        throw new Error(
          `Số dư không đủ. Ví ${fromAddress.slice(0,6)}...${fromAddress.slice(-4)} ` +
          `chỉ có ${parseFloat(ethers.formatUnits(tokenBalance, decimals)).toFixed(4)} ${tokenSymbol}, ` +
          `cần ${amount} ${tokenSymbol}`
        );
      }

      const tx = await tokenContract.transfer(toAddress, amountInWei);
      txHash = tx.hash;
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

    // Create donation_transactions record for Celebration Card
    let donationTxId: string | null = null;
    let receiptPublicId: string | null = null;

    if (toUserId) {
      try {
        const { data: tokenInfo } = await supabase
          .from("donate_tokens")
          .select("id")
          .eq("symbol", tokenSymbol)
          .eq("is_enabled", true)
          .maybeSingle();

        if (tokenInfo) {
          const explorerUrl = isFunToken
            ? `https://testnet.bscscan.com/tx/${txHash}`
            : `https://bscscan.com/tx/${txHash}`;

          const { data: donationTx } = await supabase
            .from("donation_transactions")
            .insert({
              sender_id: user.id,
              receiver_id: toUserId,
              token_id: tokenInfo.id,
              amount: amount,
              status: "success",
              chain: isFunToken ? "bsc_testnet" : "bsc",
              tx_hash: txHash,
              explorer_url: explorerUrl,
              context_type: videoId ? "video" : "global",
              context_id: videoId || null,
            })
            .select("id, receipt_public_id")
            .single();

          donationTxId = donationTx?.id || null;
          receiptPublicId = donationTx?.receipt_public_id || null;
        }
      } catch (donationErr) {
        console.warn("[Donation] Failed to create donation_transactions record:", donationErr);
      }
    }

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
            donation_transaction_id: donationTxId,
            deep_link: receiptPublicId ? `/receipt/${receiptPublicId}` : null,
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
