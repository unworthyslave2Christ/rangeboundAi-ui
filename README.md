## RangeBound AI — Frontend Dashboard 📊🚀
Welcome to the frontend app for RangeBound AI! This is the user dashboard built to let liquidity providers track, filter, and deposit capital into our multi-chain automated concentrated liquidity vaults.
Instead of dealing with complex DeFi terminals, users get a clean, bird's-eye view of active pools across different chains and fee tiers.
------------------------------
## 🎥 Watch the Demo Video
(Click below to see the dashboard and automated rebalancing engine in action)
[](https://www.youtube.com/watch?v=dQw4w9WgXcQ)

⚠️ Note: This is a placeholder link. The official walkthrough video is currently in production!

------------------------------
## 🔗 Related Components
This dashboard is only one piece of the puzzle. Check out the backend automation component that keeps the vaults healthy:

* RangeBound AI Keeper Engine: The TypeScript daemon bot that monitors active pool ticks via TWAP oracles and executes cross-chain rebalances when ranges are violated.

------------------------------
## 🛠️ Key Dashboard Features

* Multi-Chain Filtering: Toggle view settings seamlessly between all supported networks (like Ethereum Sepolia testnet) to locate your vault allocations.
* Fee Tier Granularity: Filter available vaults instantly by their Uniswap pool fee structures (0.01%, 0.05%, 0.3%, or 1%).
* Active State Tracking: Visually highlights your currently selected vault card while blocking interactions during active deposit workflows to protect user states.
* Pagination Support: Built-in UI controls to comfortably navigate clean pages of active strategy vaults without cluttering your screen.

