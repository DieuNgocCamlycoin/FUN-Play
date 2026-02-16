import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
  console.log("=== CLAIM-CAMLY START ===", new Date().toISOString());
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    
    if (!user) {
      console.error("No authenticated user");
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }




    const body = await req.json();
    const { walletAddress, claimAmount: requestedAmount } = body;
    console.log("Claim request:", user.id, walletAddress, requestedAmount);

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
    console.log(`Unclaimed: ${totalAmount} CAMLY (${unclaimedRewards.length} rewards)`);

    if (totalAmount <= 0) {
      
      return new Response(
        JSON.stringify({ error: 'No rewards to claim' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get claim config from database
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
    

    // Check minimum claim amount
    if (totalAmount < config.MIN_CLAIM_AMOUNT) {
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
      .maybeSingle();

    const todayClaimed = Number(dailyClaim?.total_claimed) || 0;
    const remainingLimit = config.DAILY_CLAIM_LIMIT - todayClaimed;

    if (remainingLimit <= 0) {
      return new Response(
        JSON.stringify({ error: `Chúc mừng, bạn đã claim thành công! Bạn đã đạt giới hạn rút ${config.DAILY_CLAIM_LIMIT.toLocaleString()} CAMLY trong ngày. Vui lòng quay lại ngày mai để rút tiếp nhé!` }),
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
    
    
    if (lifetimeRemaining <= 0) {
      return new Response(
        JSON.stringify({ error: `Bạn đã đạt giới hạn rút tổng ${config.MAX_CLAIM_PER_USER.toLocaleString()} CAMLY. Vui lòng chờ admin phê duyệt thêm.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    claimAmount = Math.min(claimAmount, lifetimeRemaining);

    // Apply user-requested custom amount if provided
    if (requestedAmount && typeof requestedAmount === 'number' && requestedAmount > 0) {
      if (requestedAmount < config.MIN_CLAIM_AMOUNT) {
        return new Response(
          JSON.stringify({ error: `Cần ít nhất ${config.MIN_CLAIM_AMOUNT.toLocaleString()} CAMLY để rút.` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (requestedAmount > claimAmount) {
        return new Response(
          JSON.stringify({ error: `Số lượng yêu cầu (${requestedAmount.toLocaleString()}) vượt quá giới hạn cho phép (${claimAmount.toLocaleString()} CAMLY).` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      claimAmount = requestedAmount;
    }

    console.log(`Claim: ${claimAmount} CAMLY for ${user.id}`);

    // Auto-cleanup stuck pending claims (>2 min)
    const { data: cleanedUp } = await supabaseAdmin
      .from('claim_requests')
      .update({ 
        status: 'failed', 
        error_message: 'Auto-timeout after 2 minutes',
        processed_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 2 * 60 * 1000).toISOString())
      .select('id');
    
    if (cleanedUp && cleanedUp.length > 0) {
      console.log(`Cleaned ${cleanedUp.length} stuck claims`);
    }

    // Check for pending claims
    const { data: pendingClaims } = await supabaseAdmin
      .from('claim_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .limit(1);

    if (pendingClaims && pendingClaims.length > 0) {
      return new Response(
        JSON.stringify({ error: 'You have a pending claim. Please wait for it to complete.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    

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
    console.log('Tx sent:', tx.hash);

    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log('Tx confirmed:', receipt.hash);

    // Update claim request to success
    await supabaseAdmin
      .from('claim_requests')
      .update({ 
        status: 'success', 
        tx_hash: receipt.hash,
        processed_at: new Date().toISOString()
      })
      .eq('id', claimRequest.id);

    // Only mark rewards that fully fit within claimAmount (no over-marking)
    const sorted = [...unclaimedRewards].sort((a, b) => Number(a.amount) - Number(b.amount));
    let cumulative = 0;
    const idsToMark: string[] = [];
    for (const r of sorted) {
      const amt = Number(r.amount);
      if (cumulative + amt <= claimAmount) {
        idsToMark.push(r.id);
        cumulative += amt;
      }
      // Stop early if we've matched the claim amount exactly
      if (cumulative >= claimAmount) break;
    }
    
    // Batch update in chunks of 100
    for (let i = 0; i < idsToMark.length; i += 100) {
      const chunk = idsToMark.slice(i, i + 100);
      await supabaseAdmin
        .from('reward_transactions')
        .update({ 
          claimed: true, 
          claimed_at: new Date().toISOString(),
          claim_tx_hash: receipt.hash
        })
        .in('id', chunk);
    }

    // Set approved_reward to remainder (not 0)
    const remainderReward = totalAmount - claimAmount;
    await supabaseAdmin
      .from('profiles')
      .update({ approved_reward: remainderReward })
      .eq('id', user.id);

    // Record daily claim
    await supabaseAdmin
      .from('daily_claim_records')
      .upsert({
        user_id: user.id,
        date: today,
        total_claimed: todayClaimed + claimAmount,
        claim_count: (dailyClaim?.claim_count || 0) + 1
      }, { onConflict: 'user_id,date' });
    console.log(`SUCCESS: ${claimAmount} CAMLY claimed, tx: ${receipt.hash}`);

    // === FIRE-AND-FORGET: Post-transaction steps (non-blocking) ===
    const TREASURER_ID = 'f0f0f0f0-0000-0000-0000-000000000001';
    const bscscanUrl = `https://bscscan.com/tx/${receipt.hash}`;

    // Run donation record, chat message, and notification in background
    (async () => {
      try {
        // 1. Create donation transaction record
        const { data: camlyToken } = await supabaseAdmin
          .from('donate_tokens')
          .select('id')
          .eq('symbol', 'CAMLY')
          .limit(1)
          .maybeSingle();

        let donationTxId: string | null = null;
        let receiptPublicId: string | null = null;

        if (camlyToken?.id) {
          const { data: donationTx } = await supabaseAdmin
            .from('donation_transactions')
            .insert({
              sender_id: TREASURER_ID,
              receiver_id: user.id,
              token_id: camlyToken.id,
              amount: claimAmount,
              chain: 'bsc',
              tx_hash: receipt.hash,
              explorer_url: bscscanUrl,
              status: 'success',
              context_type: 'claim',
              message: `🎉 Claim thành công ${claimAmount.toLocaleString()} CAMLY!`,
              metadata: {
                theme: 'celebration',
                background: '/images/celebration-bg/celebration-1.png',
                claim_request_id: claimRequest.id,
              },
            })
            .select('id, receipt_public_id')
            .single();

          donationTxId = donationTx?.id || null;
          receiptPublicId = donationTx?.receipt_public_id || null;
        }

        // 2. Send chat message
        const { data: existingChat } = await supabaseAdmin
          .from('user_chats')
          .select('id')
          .or(`and(user1_id.eq.${TREASURER_ID},user2_id.eq.${user.id}),and(user1_id.eq.${user.id},user2_id.eq.${TREASURER_ID})`)
          .limit(1)
          .maybeSingle();

        let chatId = existingChat?.id;
        if (!chatId) {
          const [sortedUser1, sortedUser2] = [TREASURER_ID, user.id].sort();
          const { data: newChat } = await supabaseAdmin
            .from('user_chats')
            .insert({ user1_id: sortedUser1, user2_id: sortedUser2 })
            .select('id')
            .single();
          chatId = newChat?.id;
        }

        if (chatId) {
          const deepLink = receiptPublicId ? `/receipt/${receiptPublicId}` : `/receipt/claim-${claimRequest.id}`;
          await supabaseAdmin.from('chat_messages').insert({
            chat_id: chatId,
            sender_id: TREASURER_ID,
            message_type: 'donation',
            content: `🎉 Bạn vừa claim thành công ${claimAmount.toLocaleString()} CAMLY!\n\n💰 Số lượng: ${claimAmount.toLocaleString()} CAMLY\n📦 Tx: ${receipt.hash.slice(0, 10)}...${receipt.hash.slice(-8)}\n\nXem chi tiết giao dịch trên BSCScan.`,
            deep_link: deepLink,
            donation_transaction_id: donationTxId,
          });
          await supabaseAdmin.from('user_chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId);
        }

        // 3. Insert notification
        const notifLink = receiptPublicId ? `/receipt/${receiptPublicId}` : bscscanUrl;
        await supabaseAdmin.from('notifications').insert({
          user_id: user.id,
          type: 'claim_success',
          title: '🎉 Claim CAMLY thành công!',
          message: `Bạn đã claim thành công ${claimAmount.toLocaleString()} CAMLY vào ví ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
          link: notifLink,
          actor_id: TREASURER_ID,
          action_type: 'share_celebration',
          metadata: {
            transaction_id: donationTxId,
            receipt_public_id: receiptPublicId,
            amount: claimAmount,
            token_symbol: 'CAMLY',
            theme: 'celebration',
          },
        });
      } catch (bgError) {
        console.error('Background post-claim tasks error (non-fatal):', bgError);
      }
    })();

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
    
    // Update claim_request to failed so user can retry immediately
    try {
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      // Find the most recent pending claim for this error context
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
          global: { headers: { Authorization: authHeader } }
        });
        const { data: { user } } = await supabaseAuth.auth.getUser();
        if (user) {
          await supabaseAdmin
            .from('claim_requests')
            .update({ 
              status: 'failed', 
              error_message: errorMessage,
              processed_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .eq('status', 'pending');
          console.log('Updated pending claim_request to failed for user:', user.id);
        }
      }
    } catch (cleanupError) {
      console.error('Failed to cleanup claim_request:', cleanupError);
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
