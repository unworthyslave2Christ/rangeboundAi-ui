// BY GOD'S GRACE ALONE
import { NextResponse } from 'next/server';
import { createPublicClient, http, parseAbi, formatUnits } from 'viem';
import { arbitrum, zksync } from 'viem/chains';



const SECURE_RPC_MAPPING: Record<number, string | undefined> = {
  42161: process.env.ARBITRUM_RPC_SECURE_URL,
  324: process.env.ZKSYNC_RPC_SECURE_URL,
  11155111: process.env.ETH_SEPOLIA_RPC_SECURE_URL
};



const MINIMAL_VAULT_ABI = parseAbi([
  'event AutoCLVault__FeesHarvested(uint256 tokensFrom0, uint256 tokensFrom1)',
  'function getTotalUnderlyingAssets() view returns (uint256 amount0, uint256 amount1)'
]);



// Fast memory node cache parameters mapping
let apyDataCache: Record<string, { apy: number; timestamp: number }> = {};
const CACHE_TTL = 3600000; // 1 Hour



export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vaultAddress = searchParams.get('vault') as `0x${string}`;
    const chainIdStr = searchParams.get('chainId');

    if (!vaultAddress || !chainIdStr) {
      return NextResponse.json({ error: 'Missing filter layout target inputs.' }, { status: 400 });
    }

    const chainId = parseInt(chainIdStr, 10);
    const cacheKey = `${chainId}-${vaultAddress.toLowerCase()}`;
    const now = Date.now();

    // 1. Evaluate Local Cache Match
    if (apyDataCache[cacheKey] && (now - apyDataCache[cacheKey].timestamp < CACHE_TTL)) {
      return NextResponse.json({ apy: apyDataCache[cacheKey].apy, source: 'cache_node' });
    }

    const targetRpc = SECURE_RPC_MAPPING[chainId];
    if (!targetRpc) {
      return NextResponse.json({ error: 'Chain target parameters unmapped or restricted.' }, { status: 400 });
    }

    // 2. Initialize Targeted Chain Public Client Node
    const publicClient = createPublicClient({
      chain: chainId === 42161 ? arbitrum : zksync,
      transport: http(targetRpc)
    });

    // 3. Query Past 7 Days Event Emission Data Logs
    const currentBlock = await publicClient.getBlockNumber();
    const startBlock = currentBlock - BigInt("50400") > BigInt("0") ? currentBlock - BigInt("50400") : BigInt("0");

    const harvestLogs = await publicClient.getContractEvents({
      address: vaultAddress,
      abi: MINIMAL_VAULT_ABI,
      eventName: 'AutoCLVault__FeesHarvested',
      fromBlock: startBlock,
      toBlock: currentBlock
    });

    // 4. Query Real-Time Vault Balance Configurations
    const totalAssets = await publicClient.readContract({
      address: vaultAddress,
      abi: MINIMAL_VAULT_ABI,
      functionName: 'getTotalUnderlyingAssets'
    }) as unknown as [bigint, bigint];

    // 5. Aggregate Yield Values
    let combinedHarvestValueUsd = 0;
    harvestLogs.forEach((log) => {
      const { tokensFrom0, tokensFrom1 } = log.args as unknown as { tokensFrom0: bigint; tokensFrom1: bigint };
      if (tokensFrom0 || tokensFrom1) {
        // Simplified value summation proxy modeling for development
        combinedHarvestValueUsd += parseFloat(formatUnits(tokensFrom0 || BigInt("0"), 6)) + (parseFloat(formatUnits(tokensFrom1 || BigInt("0"), 18)) * 3400);
      }
    });

    const currentAumUsd = parseFloat(formatUnits(totalAssets[0], 6)) + (parseFloat(formatUnits(totalAssets[1], 18)) * 3400);
    
    // 6. Extrapolate Annualized Compounded Index Rates (Weekly * 52)
    let computedApy = 0;
    if (currentAumUsd > 0) {
      const weeklyReturnRate = combinedHarvestValueUsd / currentAumUsd;
      computedApy = Math.min(weeklyReturnRate * 52 * 100, 1200); // 1200% hard ceiling guard
    }

    apyDataCache[cacheKey] = {
      apy: parseFloat(computedApy.toFixed(2)),
      timestamp: now
    };

    return NextResponse.json({ apy: apyDataCache[cacheKey].apy, source: 'chain_rpc_node' });
  } catch (error) {
    console.error('SaaS data processing exception:', error);
    return NextResponse.json({ error: 'Internal telemetry compilation failure.' }, { status: 500 });
  }
}
