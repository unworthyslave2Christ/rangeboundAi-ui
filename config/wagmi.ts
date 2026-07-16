// BY GOD'S GRACE ALONE
import {http, createConfig} from 'wagmi'
import {sepolia, arbitrum, zksync} from 'wagmi/chains'
import {getDefaultConfig} from '@rainbow-me/rainbowkit'

export const config = getDefaultConfig({
    appName: 'RangeBound AI',
    projectId: "8e788cfe657d3b619329851dae3180f0",
    chains: [sepolia, arbitrum, zksync],
    transports: {
        [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/8Obaxi8kPvAS8Re0fEgcl'),
        [arbitrum.id]: http('https://arbitrum-mainnet.core.chainstack.com/f2df28c14968505e88e0a5617a2ff112'),
        [zksync.id]: http('https://zksync.io')
    },
    ssr: true

})