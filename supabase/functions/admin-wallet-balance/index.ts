import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ethers } from "https://esm.sh/ethers@6.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// CAMLY Token on BSC Mainnet
const CAMLY_TOKEN_ADDRESS = "0x0910320181889FEFde0bB1Ca63962B0A8882E413";
const BSC_RPC_URL = "https://bsc-dataseed1.binance.org";

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

serve(async (req) => {
  console.log("[Admin Wallet Balance] Request received");
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const privateKey = Deno.env.get('CAMLY_ADMIN_WALLET_PRIVATE_KEY');
    
    if (!privateKey) {
      console.error("[Admin Wallet Balance] Private key not configured");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Admin wallet not configured' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log("[Admin Wallet Balance] Connecting to BSC...");
    const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
    const wallet = new ethers.Wallet(privateKey, provider);
    const adminAddress = wallet.address;
    
    console.log(`[Admin Wallet Balance] Admin address: ${adminAddress}`);

    // Get BNB balance
    console.log("[Admin Wallet Balance] Fetching BNB balance...");
    const bnbBalanceWei = await provider.getBalance(adminAddress);
    const bnbBalance = ethers.formatEther(bnbBalanceWei);
    console.log(`[Admin Wallet Balance] BNB Balance: ${bnbBalance}`);

    // Get CAMLY token balance
    console.log("[Admin Wallet Balance] Fetching CAMLY balance...");
    const camlyContract = new ethers.Contract(CAMLY_TOKEN_ADDRESS, ERC20_ABI, provider);
    
    const [camlyBalanceRaw, decimals, symbol] = await Promise.all([
      camlyContract.balanceOf(adminAddress),
      camlyContract.decimals(),
      camlyContract.symbol()
    ]);
    
    const camlyBalance = ethers.formatUnits(camlyBalanceRaw, decimals);
    console.log(`[Admin Wallet Balance] CAMLY Balance: ${camlyBalance} ${symbol}`);
    console.log(`[Admin Wallet Balance] Decimals: ${decimals}`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          address: adminAddress,
          bnbBalance: parseFloat(bnbBalance),
          camlyBalance: parseFloat(camlyBalance),
          camlySymbol: symbol,
          camlyDecimals: Number(decimals)
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch wallet balance';
    console.error("[Admin Wallet Balance] Error:", errorMessage);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
