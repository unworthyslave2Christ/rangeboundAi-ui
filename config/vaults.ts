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
  // --- ETH SEPOLIA VAULTS (ChainID: 11155111) ---

  
  // --- VAULT_ADDRESS_ETH_SEPOLIA_ONE_PERCENT_FEE_TIER  ---
  {
    id: "eth-sep-usdc-weth-10000",
    chainId: 11155111,
    chainName: "Eth Sepolia",
    token0Name: "USDC",
    token1Name: "WETH",
    token0Address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    token1Address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    token0Decimals: 6,
    token1Decimals: 18,
    feeTier: 10000, // 1%
    vaultAddress: "0xCe8196D62efe5A65Ee55F084Be5380aFF2F59cb3",
    poolAddress: "0x6418EEC70f50913ff0d756B48d32Ce7C02b47C47"
  },

  // --- VAULT_ADDRESS_ETH_SEPOLIA_POINT_THREE_PERCENT_FEE_TIER  ---
  {
    id: "eth-sep-usdc-weth-3000",
    chainId: 11155111,
    chainName: "Eth Sepolia",
    token0Name: "USDC",
    token1Name: "WETH",
    token0Address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    token1Address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    token0Decimals: 6,
    token1Decimals: 18,
    feeTier: 3000, // 0.3%
    vaultAddress: "0x1e20eCF8ac7dBB3fc6EFb44B9B21AF365a89F2ff",
    poolAddress: "0x6Ce0896eAE6D4BD668fDe41BB784548fb8F59b50"
  },

  // --- VAULT_ADDRESS_ETH_SEPOLIA_POINT_ZERO_FIVE_PERCENT_FEE_TIER  ---
  {
    id: "eth-sep-usdc-weth-10000",
    chainId: 11155111,
    chainName: "Eth Sepolia",
    token0Name: "USDC",
    token1Name: "WETH",
    token0Address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    token1Address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
    token0Decimals: 6,
    token1Decimals: 18,
    feeTier: 500, // 0.05%
    vaultAddress: "0xC3d7dBF007B00F386BFFa55821cD41ebDf59523b",
    poolAddress: "0x3289680dD4d6C10bb19b899729cda5eEF58AEfF1"
  },


  

]