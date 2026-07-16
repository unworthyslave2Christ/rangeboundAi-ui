export interface VaultMetadata {
  id: string;
  chainId: number;
  chainName: string;
  token0Name: string;
  token1Name: string;
  token0Address: `0x${string}`;
  token1Address: `0x${string}`;
  token0Decimals: number;
  token1Decimals: number;
  feeTier: number; // e.g. 100, 500, 3000, 10000
  vaultAddress: `0x${string}`;
  poolAddress: `0x${string}`;
}

export const SUPPORTED_VAULTS: VaultMetadata[] = [
  // --- ARBITRUM MAINNET VAULTS (ChainID: 42161) ---
  {
    id: "arb-usdc-weth-500",
    chainId: 42161,
    chainName: "Arbitrum",
    token0Name: "USDC",
    token1Name: "WETH",
    token0Address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    token1Address: "0x82aF49447D8a07e3bd95BD0d56f352415231daa1",
    token0Decimals: 6,
    token1Decimals: 18,
    feeTier: 500, // 0.05%
    vaultAddress: "0x1111111111111111111111111111111111111111", // Replace with real deployment
    poolAddress: "0xC31E54c7a869B9FcBEcc14363CF510d1c41fa443"
  },
  {
    id: "arb-usdc-weth-3000",
    chainId: 42161,
    chainName: "Arbitrum",
    token0Name: "USDC",
    token1Name: "WETH",
    token0Address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    token1Address: "0x82aF49447D8a07e3bd95BD0d56f352415231daa1",
    token0Decimals: 6,
    token1Decimals: 18,
    feeTier: 3000, // 0.30%
    vaultAddress: "0x2222222222222222222222222222222222222222",
    poolAddress: "0xC6962004f452bE9203591991D15f6b388e09E830"
  },
  // --- ZKSYNC ERA MAINNET VAULTS (ChainID: 324) ---
  {
    id: "zksync-usdt-weth-3000",
    chainId: 324,
    chainName: "zkSync",
    token0Name: "USDT",
    token1Name: "WETH",
    token0Address: "0x493257fD37EDB34324870ee84e8D2B400078B5Fa",
    token1Address: "0x5AEa0976754c30133c91087e102F83ca09b265d1",
    token0Decimals: 6,
    token1Decimals: 18,
    feeTier: 3000, // 0.30%
    vaultAddress: "0x3333333333333333333333333333333333333333",
    poolAddress: "0x4321432143214321432143214321432143214321"
  }
  // Add other variants matching 100 (0.01%) and 10000 (1.00%) fee tiers accordingly
];
