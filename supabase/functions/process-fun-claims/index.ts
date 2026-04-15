/**
 * Process FUN Money Claims — Auto On-Chain (ERC20 Transfer)
 * 
 * Picks up all `approved` claim_requests with claim_type='fun_money',
 * transfers FUN tokens from admin wallet to user wallets on BSC Testnet,
 * and updates claim_requests with tx_hash + status='success'.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// BSC Testnet
const BSC_TESTNET_RPC = "https://data-seed-prebsc-1-s1.binance.org:8545/";
const FUN_TOKEN_CONTRACT = "0x39A1b047D5d143f8874888cfa1d30Fb2AE6F0CD6";

// Standard ERC20 ABI for transfer + balanceOf
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const minterPrivateKey = Deno.env.get("FUN_MINTER_PRIVATE_KEY");

    if (!minterPrivateKey) {
      return jsonResponse({ error: "FUN_MINTER_PRIVATE_KEY not configured" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const { ethers } = await import("https://esm.sh/ethers@6.13.4");

    // Parse optional body for specific IDs
    const body = await req.json().catch(() => ({}));
    const specificIds: string[] | undefined = body.ids;

    // Fetch approved fun_money claims
    let query = supabase
      .from("claim_requests")
      .select("*")
      .eq("status", "approved")
      .eq("claim_type", "fun_money")
      .order("created_at", { ascending: true })
      .limit(20);

    if (specificIds?.length) {
      query = supabase
        .from("claim_requests")
        .select("*")
        .in("id", specificIds)
        .eq("status", "approved")
        .eq("claim_type", "fun_money");
    }

    const { data: claims, error: fetchErr } = await query;

    if (fetchErr) {
      return jsonResponse({ error: `Fetch error: ${fetchErr.message}` }, 500);
    }

    if (!claims || claims.length === 0) {
      return jsonResponse({ message: "No approved FUN Money claims to process", processed: 0 });
    }

    // Setup provider and wallet
    const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
    const adminWallet = new ethers.Wallet(minterPrivateKey, provider);
    const funContract = new ethers.Contract(FUN_TOKEN_CONTRACT, ERC20_ABI, adminWallet);

    console.log(`Admin wallet: ${adminWallet.address}`);
    console.log(`Processing ${claims.length} FUN Money claims via ERC20 transfer...`);

    // Check FUN token decimals
    let decimals = 18;
    try {
      decimals = await funContract.decimals();
      console.log(`FUN decimals: ${decimals}`);
    } catch {
      console.log("Using default 18 decimals");
    }

    // Check admin wallet FUN balance
    const funBalance = await funContract.balanceOf(adminWallet.address);
    const totalNeeded = claims.reduce((sum, c) => sum + c.amount, 0);
    const totalNeededWei = ethers.parseUnits(totalNeeded.toString(), decimals);

    console.log(`FUN balance: ${ethers.formatUnits(funBalance, decimals)}`);
    console.log(`Total needed: ${totalNeeded} FUN`);

    if (funBalance < totalNeededWei) {
      return jsonResponse({
        error: `Insufficient FUN balance. Have: ${ethers.formatUnits(funBalance, decimals)}, Need: ${totalNeeded}`,
        wallet: adminWallet.address,
      }, 500);
    }

    // Check BNB for gas
    const bnbBalance = await provider.getBalance(adminWallet.address);
    const minGas = ethers.parseEther("0.005");
    if (bnbBalance < minGas) {
      return jsonResponse({
        error: `Low BNB for gas: ${ethers.formatEther(bnbBalance)} BNB`,
        wallet: adminWallet.address,
      }, 500);
    }

    const results: Array<{ id: string; user: string; amount: number; status: string; tx_hash?: string; error?: string }> = [];
    let success = 0;
    let failed = 0;

    // Process each claim sequentially (avoid nonce conflicts)
    for (const claim of claims) {
      try {
        console.log(`Processing claim ${claim.id}: ${claim.amount} FUN → ${claim.wallet_address}`);

        // Lock: mark as processing
        const { error: lockErr } = await supabase
          .from("claim_requests")
          .update({ status: "processing" })
          .eq("id", claim.id)
          .eq("status", "approved");

        if (lockErr) throw new Error(`Lock failed: ${lockErr.message}`);

        // Convert amount to wei
        const amountWei = ethers.parseUnits(claim.amount.toString(), decimals);

        // ERC20 transfer
        const tx = await funContract.transfer(claim.wallet_address, amountWei, {
          gasLimit: 100000n,
        });

        console.log(`TX sent: ${tx.hash}`);

        // Wait for confirmation
        const receipt = await tx.wait(1);
        console.log(`TX confirmed: ${receipt.hash} (block ${receipt.blockNumber})`);

        // Calculate gas fee
        let gasFee = 0;
        try {
          const gasUsed = receipt.gasUsed || 0n;
          const gasPrice = receipt.gasPrice || receipt.effectiveGasPrice || 0n;
          gasFee = Number(ethers.formatEther(gasUsed * gasPrice));
        } catch { /* ignore */ }

        // Update claim_request to success
        await supabase
          .from("claim_requests")
          .update({
            status: "success",
            tx_hash: receipt.hash,
            processed_at: new Date().toISOString(),
            gas_fee: gasFee,
          })
          .eq("id", claim.id);

        // Notify user
        await supabase.from("notifications").insert({
          user_id: claim.user_id,
          type: "system",
          title: "✅ FUN Money đã chuyển thành công!",
          message: `${claim.amount.toLocaleString()} FUN đã được gửi đến ví ${claim.wallet_address.slice(0, 6)}...${claim.wallet_address.slice(-4)}. TX: ${receipt.hash.slice(0, 10)}...`,
          link: `https://testnet.bscscan.com/tx/${receipt.hash}`,
        });

        results.push({
          id: claim.id,
          user: claim.user_id.slice(0, 8),
          amount: claim.amount,
          status: "success",
          tx_hash: receipt.hash,
        });
        success++;
      } catch (err: any) {
        console.error(`Claim ${claim.id} failed:`, err.message);
        const errorMsg = mapError(err.message || String(err));

        const isPermanent = err.message?.includes("insufficient") && err.message?.includes("FUN");
        await supabase
          .from("claim_requests")
          .update({
            status: isPermanent ? "failed" : "approved",
            error_message: errorMsg,
            processed_at: isPermanent ? new Date().toISOString() : null,
          })
          .eq("id", claim.id);

        results.push({
          id: claim.id,
          user: claim.user_id.slice(0, 8),
          amount: claim.amount,
          status: isPermanent ? "failed" : "retry",
          error: errorMsg,
        });
        failed++;
      }
    }

    // Admin summary notification
    if (success > 0) {
      const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      const totalFun = results.filter(r => r.status === "success").reduce((s, r) => s + r.amount, 0);
      if (admins?.length) {
        const notifications = admins.map((a: any) => ({
          user_id: a.user_id,
          type: "system",
          title: "📊 FUN Claims Processed",
          message: `${success}/${claims.length} claims thành công. Tổng: ${totalFun.toLocaleString()} FUN. ${failed > 0 ? `❌ ${failed} thất bại.` : ""}`,
        }));
        await supabase.from("notifications").insert(notifications);
      }
    }

    return jsonResponse({
      processed: claims.length,
      success,
      failed,
      results,
      admin_wallet: adminWallet.address,
      fun_balance: ethers.formatUnits(funBalance, decimals),
      bnb_balance: ethers.formatEther(bnbBalance),
    });
  } catch (err: any) {
    console.error("process-fun-claims error:", err);
    return jsonResponse({ error: err.message }, 500);
  }
});

function mapError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("insufficient funds")) return "Ví admin hết BNB gas. Liên hệ admin.";
  if (lower.includes("transfer amount exceeds balance")) return "Ví admin không đủ FUN tokens.";
  if (lower.includes("nonce")) return "Lỗi nonce — sẽ tự động thử lại.";
  if (lower.includes("reverted")) return "Contract từ chối giao dịch.";
  if (lower.includes("timeout") || lower.includes("timed out")) return "Mạng blockchain chậm. Thử lại sau.";
  if (lower.includes("network") || lower.includes("fetch failed")) return "Lỗi kết nối RPC. Thử lại sau.";
  return `Lỗi: ${raw.slice(0, 150)}`;
}
