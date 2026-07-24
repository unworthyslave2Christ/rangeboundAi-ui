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
  // --- ARBITRUM SEPOLIA VAULTS (ChainID: 421614) ---

  //  address(autoCLVault) 10000
  // 0x9AaD71889a06FDCaEf6b13329eece88e0cf049E4
  // address(autoCLVault2) 3000
  // 0x2500232F7A258cE9b45d044a05583F51A838cDab
  // address(autoCLVault3) 500
  // 0x22dc516418Af0CCa4DAa369FF2BcDfC7a0CAD80E

  // address  constant RangeAI_USDC= 0x36BD22d795316C9FaE0e7E6193C3AdC6eC231B11;
  // address  constant RangeAI_WETH= 0x8B76E900079A028639A57f23AcD71eFD3a0598a4;

  // address public constant USDC_WETH_POOL_RANGE_AI_ARB_SEPOLIA_10000 = 0x5f43ab8e790956d1F522E3D5E0859eF53431e2EE;

  //   address public constant USDC_WETH_POOL_RANGE_AI_ARB_SEPOLIA_3000 = 0x35bC806FAC7b5B9104Ec9a4Cb72FA8D7764B4a09;
    
  //   address public constant USDC_WETH_POOL_RANGE_AI_ARB_SEPOLIA_500 = 0x171AAbAA17679e00F4b07D1b1D1180e62030fE5b;



  
  // --- VAULT_ADDRESS_ARBITRUM_SEPOLIA_ONE_PERCENT_FEE_TIER  ---
  {
    id: "arb-sep-usdc-weth-range-ai-10000",
    chainId: 421614,
    chainName: "Arbitrum Sepolia",
    token0Name: "USDC",
    token1Name: "WETH",
    token0Address: "0x36BD22d795316C9FaE0e7E6193C3AdC6eC231B11",
    token1Address: "0x8B76E900079A028639A57f23AcD71eFD3a0598a4",
    token0Decimals: 6,
    token1Decimals: 18,
    feeTier: 10000, // 1%
    vaultAddress: "0x9AaD71889a06FDCaEf6b13329eece88e0cf049E4",
    poolAddress: "0x5f43ab8e790956d1F522E3D5E0859eF53431e2EE"
  },


  // --- VAULT_ADDRESS_ARBITRUM_SEPOLIA_POINT_THREE_PERCENT_FEE_TIER  ---
  {
    id: "arb-sep-usdc-weth-range-ai-10000",
    chainId: 421614,
    chainName: "Arbitrum Sepolia",
    token0Name: "USDC",
    token1Name: "WETH",
    token0Address: "0x36BD22d795316C9FaE0e7E6193C3AdC6eC231B11",
    token1Address: "0x8B76E900079A028639A57f23AcD71eFD3a0598a4",
    token0Decimals: 6,
    token1Decimals: 18,
    feeTier: 10000, // 1%
    vaultAddress: "0x2500232F7A258cE9b45d044a05583F51A838cDab",
    poolAddress: "0x35bC806FAC7b5B9104Ec9a4Cb72FA8D7764B4a09"
  },


  // --- VAULT_ADDRESS_ARBITRUM_SEPOLIA_POINT_ZERO_FIVE_PERCENT_FEE_TIER  ---
  {
    id: "arb-sep-usdc-weth-range-ai-10000",
    chainId: 421614,
    chainName: "Arbitrum Sepolia",
    token0Name: "USDC",
    token1Name: "WETH",
    token0Address: "0x36BD22d795316C9FaE0e7E6193C3AdC6eC231B11",
    token1Address: "0x8B76E900079A028639A57f23AcD71eFD3a0598a4",
    token0Decimals: 6,
    token1Decimals: 18,
    feeTier: 10000, // 1%
    vaultAddress: "0x22dc516418Af0CCa4DAa369FF2BcDfC7a0CAD80E",
    poolAddress: "0x171AAbAA17679e00F4b07D1b1D1180e62030fE5b"
  },

  

]