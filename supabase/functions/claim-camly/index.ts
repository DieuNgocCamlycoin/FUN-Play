import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CAMLY_TOKEN_ADDRESS = "0x0910320181889fefde0bb1ca63962b0a8882e413";
const BSC_RPC_URL = "https://bsc-dataseed.binance.org/";

const ERC20_TRANSFER_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
];

const jsonOk = (body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const jsonError = (msg: string) => jsonOk({ success: false, error: msg });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { walletAddress, claimAmount: requestedAmount } = body;

    if (!walletAddress || !walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return jsonError('Địa chỉ ví không hợp lệ. Vui lòng kiểm tra lại.');
    }

    // Fetch approved unclaimed rewards
    const { data: unclaimedRewards, error: rewardsError } = await supabaseAdmin
      .from('reward_transactions')
      .select('id, amount')
      .eq('user_id', user.id)
      .eq('claimed', false)
      .eq('status', 'success')
      .eq('approved', true);

    if (rewardsError) {
      return jsonError('Không thể tải phần thưởng. Vui lòng thử lại.');
    }

    if (!unclaimedRewards || unclaimedRewards.length === 0) {
      return jsonError('Không có phần thưởng để rút. Phần thưởng cần được admin duyệt trước.');
    }

    const totalAmount = unclaimedRewards.reduce((sum, r) => sum + Number(r.amount), 0);
    if (totalAmount <= 0) {
      return jsonError('Không có phần thưởng để rút.');
    }

    // Load config
    const { data: configData } = await supabaseAdmin
      .from('reward_config')
      .select('config_key, config_value')
      .in('config_key', ['MIN_CLAIM_AMOUNT', 'DAILY_CLAIM_LIMIT', 'MAX_CLAIM_PER_USER']);

    const config: Record<string, number> = { MIN_CLAIM_AMOUNT: 200000, DAILY_CLAIM_LIMIT: 500000, MAX_CLAIM_PER_USER: 500000 };
    configData?.forEach(c => { config[c.config_key] = Number(c.config_value); });

    if (totalAmount < config.MIN_CLAIM_AMOUNT) {
      return jsonError(`Cần ít nhất ${config.MIN_CLAIM_AMOUNT.toLocaleString()} CAMLY để rút. Bạn có ${totalAmount.toLocaleString()} CAMLY.`);
    }

    // Daily limit
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
      return jsonError(`Chúc mừng, bạn đã claim thành công! Bạn đã đạt giới hạn rút ${config.DAILY_CLAIM_LIMIT.toLocaleString()} CAMLY trong ngày. Vui lòng quay lại ngày mai để rút tiếp nhé!`);
    }

    let claimAmount = Math.min(totalAmount, remainingLimit);

    // Lifetime cap
    const { data: lifetimeClaims } = await supabaseAdmin
      .from('claim_requests')
      .select('amount')
      .eq('user_id', user.id)
      .eq('status', 'success');

    const lifetimeClaimed = lifetimeClaims?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
    const lifetimeRemaining = config.MAX_CLAIM_PER_USER - lifetimeClaimed;

    if (lifetimeRemaining <= 0) {
      return jsonError(`Bạn đã đạt giới hạn rút tổng ${config.MAX_CLAIM_PER_USER.toLocaleString()} CAMLY. Vui lòng chờ admin phê duyệt thêm.`);
    }

    claimAmount = Math.min(claimAmount, lifetimeRemaining);

    // Custom amount validation
    if (requestedAmount && typeof requestedAmount === 'number' && requestedAmount > 0) {
      if (requestedAmount < config.MIN_CLAIM_AMOUNT) {
        return jsonError(`Cần ít nhất ${config.MIN_CLAIM_AMOUNT.toLocaleString()} CAMLY để rút.`);
      }
      if (requestedAmount > claimAmount) {
        return jsonError(`Số lượng yêu cầu (${requestedAmount.toLocaleString()}) vượt quá giới hạn cho phép (${claimAmount.toLocaleString()} CAMLY).`);
      }
      claimAmount = requestedAmount;
    }

    // Auto-cleanup stuck pending claims (>2 min)
    await supabaseAdmin
      .from('claim_requests')
      .update({ status: 'failed', error_message: 'Auto-timeout after 2 minutes', processed_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .lt('created_at', new Date(Date.now() - 2 * 60 * 1000).toISOString());

    // Check for pending claims
    const { data: pendingClaims } = await supabaseAdmin
      .from('claim_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .limit(1);

    if (pendingClaims && pendingClaims.length > 0) {
      return jsonError('⏳ Bạn có yêu cầu claim đang xử lý. Vui lòng đợi hoàn tất.');
    }

    // Create claim request
    const { data: claimRequest, error: claimError } = await supabaseAdmin
      .from('claim_requests')
      .insert({ user_id: user.id, amount: claimAmount, wallet_address: walletAddress, status: 'pending' })
      .select()
      .single();

    if (claimError) {
      return jsonError('Không thể tạo yêu cầu claim. Vui lòng thử lại.');
    }

    // Get admin wallet private key
    const adminPrivateKey = Deno.env.get('CAMLY_ADMIN_WALLET_PRIVATE_KEY');
    if (!adminPrivateKey) {
      await supabaseAdmin.from('claim_requests').update({ status: 'failed', error_message: 'Admin wallet not configured' }).eq('id', claimRequest.id);
      return jsonError('Hệ thống chưa được cấu hình. Vui lòng liên hệ admin.');
    }

    const { ethers } = await import("https://esm.sh/ethers@6.9.0");
    const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
    const adminWallet = new ethers.Wallet(adminPrivateKey, provider);
    const camlyContract = new ethers.Contract(CAMLY_TOKEN_ADDRESS, ERC20_TRANSFER_ABI, adminWallet);
    const amountInWei = ethers.parseUnits(claimAmount.toString(), 3);

    // Check balance
    const adminBalance = await camlyContract.balanceOf(adminWallet.address);
    if (adminBalance < amountInWei) {
      await supabaseAdmin.from('claim_requests').update({ status: 'failed', error_message: 'Insufficient CAMLY balance', processed_at: new Date().toISOString() }).eq('id', claimRequest.id);
      return jsonError('💰 Bể thưởng tạm thời hết. Vui lòng chờ admin nạp thêm.');
    }

    // Send tokens
    const tx = await camlyContract.transfer(walletAddress, amountInWei);
    const receipt = await tx.wait();

    // Update claim request to success
    await supabaseAdmin.from('claim_requests').update({ status: 'success', tx_hash: receipt.hash, processed_at: new Date().toISOString() }).eq('id', claimRequest.id);

    // Mark rewards as claimed (strict matching)
    const sorted = [...unclaimedRewards].sort((a, b) => Number(a.amount) - Number(b.amount));
    let cumulative = 0;
    const idsToMark: string[] = [];
    for (const r of sorted) {
      const amt = Number(r.amount);
      if (cumulative + amt <= claimAmount) {
        idsToMark.push(r.id);
        cumulative += amt;
      }
      if (cumulative >= claimAmount) break;
    }

    for (let i = 0; i < idsToMark.length; i += 100) {
      const chunk = idsToMark.slice(i, i + 100);
      await supabaseAdmin.from('reward_transactions').update({ claimed: true, claimed_at: new Date().toISOString(), claim_tx_hash: receipt.hash }).in('id', chunk);
    }

    // Update approved_reward remainder
    await supabaseAdmin.from('profiles').update({ approved_reward: totalAmount - claimAmount }).eq('id', user.id);

    // Record daily claim
    await supabaseAdmin.from('daily_claim_records').upsert({
      user_id: user.id, date: today,
      total_claimed: todayClaimed + claimAmount,
      claim_count: (dailyClaim?.claim_count || 0) + 1
    }, { onConflict: 'user_id,date' });

    // Fire-and-forget: post-transaction tasks
    const TREASURER_ID = 'f0f0f0f0-0000-0000-0000-000000000001';
    const bscscanUrl = `https://bscscan.com/tx/${receipt.hash}`;

    (async () => {
      try {
        const { data: camlyToken } = await supabaseAdmin.from('donate_tokens').select('id').eq('symbol', 'CAMLY').limit(1).maybeSingle();
        let donationTxId: string | null = null;
        let receiptPublicId: string | null = null;

        if (camlyToken?.id) {
          const { data: donationTx } = await supabaseAdmin.from('donation_transactions').insert({
            sender_id: TREASURER_ID, receiver_id: user.id, token_id: camlyToken.id, amount: claimAmount,
            chain: 'bsc', tx_hash: receipt.hash, explorer_url: bscscanUrl, status: 'success', context_type: 'claim',
            message: `🎉 Claim thành công ${claimAmount.toLocaleString()} CAMLY!`,
            metadata: { theme: 'celebration', background: '/images/celebration-bg/celebration-1.png', claim_request_id: claimRequest.id },
          }).select('id, receipt_public_id').single();
          donationTxId = donationTx?.id || null;
          receiptPublicId = donationTx?.receipt_public_id || null;
        }

        const { data: existingChat } = await supabaseAdmin.from('user_chats').select('id')
          .or(`and(user1_id.eq.${TREASURER_ID},user2_id.eq.${user.id}),and(user1_id.eq.${user.id},user2_id.eq.${TREASURER_ID})`)
          .limit(1).maybeSingle();

        let chatId = existingChat?.id;
        if (!chatId) {
          const [u1, u2] = [TREASURER_ID, user.id].sort();
          const { data: newChat } = await supabaseAdmin.from('user_chats').insert({ user1_id: u1, user2_id: u2 }).select('id').single();
          chatId = newChat?.id;
        }

        if (chatId) {
          const deepLink = receiptPublicId ? `/receipt/${receiptPublicId}` : `/receipt/claim-${claimRequest.id}`;
          await supabaseAdmin.from('chat_messages').insert({
            chat_id: chatId, sender_id: TREASURER_ID, message_type: 'donation',
            content: `🎉 Bạn vừa claim thành công ${claimAmount.toLocaleString()} CAMLY!\n\n💰 Số lượng: ${claimAmount.toLocaleString()} CAMLY\n📦 Tx: ${receipt.hash.slice(0, 10)}...${receipt.hash.slice(-8)}\n\nXem chi tiết giao dịch trên BSCScan.`,
            deep_link: deepLink, donation_transaction_id: donationTxId,
          });
          await supabaseAdmin.from('user_chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId);
        }

        const notifLink = receiptPublicId ? `/receipt/${receiptPublicId}` : bscscanUrl;
        await supabaseAdmin.from('notifications').insert({
          user_id: user.id, type: 'claim_success', title: '🎉 Claim CAMLY thành công!',
          message: `Bạn đã claim thành công ${claimAmount.toLocaleString()} CAMLY vào ví ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
          link: notifLink, actor_id: TREASURER_ID, action_type: 'share_celebration',
          metadata: { transaction_id: donationTxId, receipt_public_id: receiptPublicId, amount: claimAmount, token_symbol: 'CAMLY', theme: 'celebration' },
        });
      } catch (bgError) {
        console.error('Background post-claim error (non-fatal):', bgError);
      }
    })();

    return jsonOk({ success: true, amount: claimAmount, txHash: receipt.hash, message: 'CAMLY tokens sent successfully!' });

  } catch (error: unknown) {
    console.error('Claim error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Claim failed';

    try {
      const adminClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      let userId: string | undefined;
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const tempAuth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
          global: { headers: { Authorization: authHeader } }
        });
        const { data: { user: u } } = await tempAuth.auth.getUser();
        userId = u?.id;
      }
      if (userId) {
        await adminClient.from('claim_requests').update({ status: 'failed', error_message: errorMessage, processed_at: new Date().toISOString() }).eq('user_id', userId).eq('status', 'pending');
      }
    } catch (cleanupError) {
      console.error('Cleanup failed:', cleanupError);
    }

    return jsonError(errorMessage);
  }
});
