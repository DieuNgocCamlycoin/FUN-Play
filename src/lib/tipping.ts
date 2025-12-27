import { ethers } from "ethers";
import { supabase } from "@/integrations/supabase/client";
import { getWalletClient } from "@wagmi/core";
import { wagmiConfig } from "@/lib/web3Config";

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

interface SendTipParams {
  toAddress: string;
  amount: number;
  tokenSymbol: string;
  tokenAddress: string;
  decimals: number;
  videoId?: string;
}

export const sendTip = async ({
  toAddress,
  amount,
  tokenSymbol,
  tokenAddress,
  decimals,
  videoId,
}: SendTipParams) => {
  // Get wallet client from wagmi instead of window.ethereum
  const walletClient = await getWalletClient(wagmiConfig);
  if (!walletClient) {
    throw new Error("Vui lòng kết nối ví để gửi tiền");
  }

  // Create ethers provider - use window.ethereum if available
  const provider = new ethers.BrowserProvider((window as any).ethereum || walletClient.transport);
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
