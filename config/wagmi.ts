// BY GOD'S GRACE ALONE
import {http, createConfig} from 'wagmi'
import {sepolia} from 'wagmi/chains'
import {getDefaultConfig} from '@rainbow-me/rainbowkit'

export const config = getDefaultConfig({
    appName: 'RangeBound AI',
    projectId: "8e788cfe657d3b619329851dae3180f0",
    chains: [sepolia],
    transports: {
        [sepolia.id]: http('https://eth-sepolia.g.alchemy.com/v2/8Obaxi8kPvAS8Re0fEgcl'),
    },
    ssr: true
})