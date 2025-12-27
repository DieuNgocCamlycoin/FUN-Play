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

    // Check for unclaimed rewards
    const { data: unclaimedRewards, error: rewardsError } = await supabaseAdmin
      .from('reward_transactions')
      .select('id, amount')
      .eq('user_id', user.id)
      .eq('claimed', false)
      .eq('status', 'success');

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

    // Create claim request record
    const { data: claimRequest, error: claimError } = await supabaseAdmin
      .from('claim_requests')
      .insert({
        user_id: user.id,
        amount: totalAmount,
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
    const amountInWei = ethers.parseUnits(totalAmount.toString(), decimals);

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
    console.log(`Sending ${totalAmount} CAMLY to ${walletAddress}`);
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

    // Mark all rewards as claimed
    const rewardIds = unclaimedRewards.map(r => r.id);
    await supabaseAdmin
      .from('reward_transactions')
      .update({ 
        claimed: true, 
        claimed_at: new Date().toISOString(),
        claim_tx_hash: receipt.hash
      })
      .in('id', rewardIds);

    console.log(`Successfully claimed ${totalAmount} CAMLY for user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        amount: totalAmount,
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
