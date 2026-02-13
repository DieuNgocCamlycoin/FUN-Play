import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CAMLY Token Contract on BSC Mainnet
const CAMLY_TOKEN_ADDRESS = "0x0910320181889fefde0bb1ca63962b0a8882e413";
const BSC_RPC_URL = "https://bsc-dataseed.binance.org/";

// ERC20 Transfer ABI
const ERC20_TRANSFER_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

serve(async (req) => {
  console.log("=== CLAIM-CAMLY FUNCTION STARTED ===");
  console.log("Request method:", req.method);
  console.log("Timestamp:", new Date().toISOString());

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    console.log("Handling CORS preflight");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    console.log("Auth header present:", !!authHeader);
    
    if (!authHeader) {
      console.error("ERROR: No authorization header");
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    console.log("Supabase URL configured:", !!supabaseUrl);
    console.log("Service role key configured:", !!supabaseServiceKey);

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError) {
      console.error("Auth error:", authError.message);
    }
    
    if (!user) {
      console.error("ERROR: No user found from auth token");
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Authenticated user ID:", user.id);
    console.log("User email:", user.email);

    const body = await req.json();
    const { walletAddress } = body;
    console.log("Wallet address from request:", walletAddress);

    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return new Response(
        JSON.stringify({ error: 'Invalid wallet address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for unclaimed rewards - CHỈ LẤY NHỮNG REWARD ĐÃ ĐƯỢC ADMIN DUYỆT
    const { data: unclaimedRewards, error: rewardsError } = await supabaseAdmin
      .from('reward_transactions')
      .select('id, amount')
      .eq('user_id', user.id)
      .eq('claimed', false)
      .eq('status', 'success')
      .eq('approved', true); // CHỈ CLAIM ĐƯỢC KHI ĐÃ ĐƯỢC ADMIN DUYỆT

    if (rewardsError) {
      console.error('Error fetching rewards:', rewardsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch rewards' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!unclaimedRewards || unclaimedRewards.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No unclaimed rewards found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate total unclaimed amount
    const totalAmount = unclaimedRewards.reduce((sum, r) => sum + Number(r.amount), 0);
    console.log("Total unclaimed amount:", totalAmount, "CAMLY");
    console.log("Number of unclaimed rewards:", unclaimedRewards.length);

    if (totalAmount <= 0) {
      console.error("ERROR: No rewards to claim (amount <= 0)");
      return new Response(
        JSON.stringify({ error: 'No rewards to claim' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get claim config from database
    console.log("Fetching claim config...");
    const { data: configData } = await supabaseAdmin
      .from('reward_config')
      .select('config_key, config_value')
      .in('config_key', ['MIN_CLAIM_AMOUNT', 'DAILY_CLAIM_LIMIT', 'MAX_CLAIM_PER_USER']);

    const config: Record<string, number> = {
      MIN_CLAIM_AMOUNT: 200000,
      DAILY_CLAIM_LIMIT: 500000,
      MAX_CLAIM_PER_USER: 500000
    };

    configData?.forEach(c => {
      config[c.config_key] = Number(c.config_value);
    });
    console.log("Claim config:", config);

    // Check minimum claim amount
    if (totalAmount < config.MIN_CLAIM_AMOUNT) {
      console.log(`Total ${totalAmount} is less than minimum ${config.MIN_CLAIM_AMOUNT}`);
      return new Response(
        JSON.stringify({ 
          error: `Cần ít nhất ${config.MIN_CLAIM_AMOUNT.toLocaleString()} CAMLY để rút. Bạn có ${totalAmount.toLocaleString()} CAMLY.` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check daily claim limit
    const today = new Date().toISOString().split('T')[0];
    const { data: dailyClaim } = await supabaseAdmin
      .from('daily_claim_records')
      .select('total_claimed, claim_count')
      .eq('user_id', user.id)
      .eq('date', today)
      .single();

    const todayClaimed = Number(dailyClaim?.total_claimed) || 0;
    const remainingLimit = config.DAILY_CLAIM_LIMIT - todayClaimed;
    console.log(`Today claimed: ${todayClaimed}, Remaining limit: ${remainingLimit}`);

    if (remainingLimit <= 0) {
      return new Response(
        JSON.stringify({ error: `Bạn đã đạt giới hạn rút ${config.DAILY_CLAIM_LIMIT.toLocaleString()} CAMLY hôm nay. Vui lòng quay lại ngày mai!` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit claim amount to remaining daily limit
    let claimAmount = Math.min(totalAmount, remainingLimit);
    
    // Check MAX_CLAIM_PER_USER lifetime cap
    const { data: lifetimeClaims } = await supabaseAdmin
      .from('claim_requests')
      .select('amount')
      .eq('user_id', user.id)
      .eq('status', 'success');
    
    const lifetimeClaimed = lifetimeClaims?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
    const lifetimeRemaining = config.MAX_CLAIM_PER_USER - lifetimeClaimed;
    console.log(`Lifetime claimed: ${lifetimeClaimed}, MAX_CLAIM_PER_USER: ${config.MAX_CLAIM_PER_USER}, Remaining: ${lifetimeRemaining}`);
    
    if (lifetimeRemaining <= 0) {
      return new Response(
        JSON.stringify({ error: `Bạn đã đạt giới hạn rút tổng ${config.MAX_CLAIM_PER_USER.toLocaleString()} CAMLY. Vui lòng chờ admin phê duyệt thêm.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    claimAmount = Math.min(claimAmount, lifetimeRemaining);
    console.log(`Claim amount (after all limits): ${claimAmount} CAMLY`);

    // Auto-cleanup stuck pending claims (older than 5 minutes)
    console.log("Auto-cleaning stuck pending claims...");
    await supabaseAdmin
      .from('claim_requests')
      .update({ 
        status: 'failed', 
        error_message: 'Auto-timeout after 5 minutes',
        processed_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());

    // Check for pending claims (prevent double claiming)
    console.log("Checking for pending claims...");
    const { data: pendingClaims } = await supabaseAdmin
      .from('claim_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .limit(1);

    if (pendingClaims && pendingClaims.length > 0) {
      console.error("ERROR: User has pending claim:", pendingClaims[0].id);
      return new Response(
        JSON.stringify({ error: 'You have a pending claim. Please wait for it to complete.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("No pending claims, proceeding to create claim request...");

    // Create claim request record with clamped amount
    const { data: claimRequest, error: claimError } = await supabaseAdmin
      .from('claim_requests')
      .insert({
        user_id: user.id,
        amount: claimAmount,
        wallet_address: walletAddress,
        status: 'pending'
      })
      .select()
      .single();

    if (claimError) {
      console.error('Error creating claim request:', claimError);
      return new Response(
        JSON.stringify({ error: 'Failed to create claim request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get admin wallet private key
    const adminPrivateKey = Deno.env.get('CAMLY_ADMIN_WALLET_PRIVATE_KEY');
    if (!adminPrivateKey) {
      // Update claim request to failed
      await supabaseAdmin
        .from('claim_requests')
        .update({ status: 'failed', error_message: 'Admin wallet not configured' })
        .eq('id', claimRequest.id);

      return new Response(
        JSON.stringify({ error: 'Reward system not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Import ethers dynamically
    const { ethers } = await import("https://esm.sh/ethers@6.9.0");

    // Connect to BSC
    const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);

    // Create contract instance
    const camlyContract = new ethers.Contract(
      CAMLY_TOKEN_ADDRESS,
      ERC20_TRANSFER_ABI,
      adminWallet
    );

    // Get token decimals
    let decimals = 18;
    try {
      decimals = await camlyContract.decimals();
    } catch (e) {
      console.log('Using default 18 decimals');
    }

    // Convert amount to token units (CAMLY has 18 decimals typically)
    const amountInWei = ethers.parseUnits(claimAmount.toString(), decimals);

    // Check admin wallet balance
    const adminBalance = await camlyContract.balanceOf(adminWallet.address);
    if (adminBalance < amountInWei) {
      await supabaseAdmin
        .from('claim_requests')
        .update({ 
          status: 'failed', 
          error_message: 'Insufficient CAMLY balance in reward pool',
          processed_at: new Date().toISOString()
        })
        .eq('id', claimRequest.id);

      return new Response(
        JSON.stringify({ error: 'Reward pool temporarily unavailable. Please try again later.' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send CAMLY tokens
    console.log(`Sending ${claimAmount} CAMLY to ${walletAddress}`);
    const tx = await camlyContract.transfer(walletAddress, amountInWei);
    console.log('Transaction sent:', tx.hash);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.hash);

    // Update claim request to success
    await supabaseAdmin
      .from('claim_requests')
      .update({ 
        status: 'success', 
        tx_hash: receipt.hash,
        processed_at: new Date().toISOString()
      })
      .eq('id', claimRequest.id);

    // Mark rewards as claimed (only up to claimAmount)
    // We claim ALL approved rewards since we're limited by daily limit
    const rewardIds = unclaimedRewards.map(r => r.id);
    await supabaseAdmin
      .from('reward_transactions')
      .update({ 
        claimed: true, 
        claimed_at: new Date().toISOString(),
        claim_tx_hash: receipt.hash
      })
      .in('id', rewardIds);

    // Update daily claim records
    console.log("Updating daily claim records...");
    const currentClaimCount = dailyClaim?.claim_count || 0;
    await supabaseAdmin
      .from('daily_claim_records')
      .upsert({
        user_id: user.id,
        date: today,
        total_claimed: todayClaimed + claimAmount,
        claim_count: currentClaimCount + 1
      }, { onConflict: 'user_id,date' });

    // Reset approved_reward in profiles to 0 after successful claim
    console.log("Resetting approved_reward to 0...");
    await supabaseAdmin
      .from('profiles')
      .update({ approved_reward: 0 })
      .eq('id', user.id);

    console.log(`Successfully claimed ${claimAmount} CAMLY for user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        amount: claimAmount,
        txHash: receipt.hash,
        message: 'CAMLY tokens sent successfully!'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    console.error('Claim error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Claim failed';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
