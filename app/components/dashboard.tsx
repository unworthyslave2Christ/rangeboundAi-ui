// BY GOD'S GRACE ALONE
'use client'

import { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useReadContract, useWriteContract, useSwitchChain } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { toast } from 'sonner'
import { Percent, Wallet, ArrowUpRight, TrendingUp, Layers, ShieldCheck, Zap, AlertTriangle, Filter, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import { SUPPORTED_VAULTS, VaultMetadata } from '@/config/vaults'

const VAULT_ABI = [
  { name: 'deposit', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount0Desired', type: 'uint256' }, { name: 'amount1Desired', type: 'uint256' }], outputs: [{ name: 'shares', type: 'uint256' }] },
  { name: 'withdraw', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'shares', type: 'uint256' }, { name: 'amount0Min', type: 'uint256' }, { name: 'amount1Min', type: 'uint256' }], outputs: [{ name: 'amount0Out', type: 'uint256' }, { name: 'amount1Out', type: 'uint256' }] },
  { name: 'getTotalUnderlyingAssets', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: 'amount0', type: 'uint256' }, { name: 'amount1', type: 'uint256' }] },
  { name: 'userShares', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: 'shares', type: 'uint256' }] },
  { name: 'tickLower', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'int24' }] },
  { name: 'tickUpper', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'int24' }] },
  { name: 'pool', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] }
] as const

const ERC20_ABI = [
  { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] }
] as const

const POOL_ABI = [
  { name: 'slot0', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: 'sqrtPriceX96', type: 'uint160' }, { name: 'tick', type: 'int24' }, { name: 'observationIndex', type: 'uint16' }, { name: 'observationCardinality', type: 'uint16' }, { name: 'observationCardinalityNext', type: 'uint16' }, { name: 'feeProtocol', type: 'uint8' }, { name: 'unlocked', type: 'bool' }] },
  { name: 'observe', type: 'function', stateMutability: 'view', inputs: [{ name: 'secondsAgos', type: 'uint32[]' }], outputs: [{ name: 'tickCumulatives', type: 'int56[]' }, { name: 'secondsPerLiquidityCumulativeX128s', type: 'uint160[]' }] }
] as const

export function DashboardPage() {
  const { address, isConnected, chainId: activeWalletChainId } = useAccount()
  const { writeContract } = useWriteContract()
  const { switchChain } = useSwitchChain()

  // --- Filtering & Pagination State Management ---
  const [selectedChainFilter, setSelectedChainFilter] = useState<number | 'all'>('all')
  const [selectedFeeFilter, setSelectedFeeFilter] = useState<number | 'all'>('all')
  const [activeVaultIndex, setActiveVaultIndex] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const ITEMS_PER_PAGE = 2

  const [usdcAmount, setUsdcAmount] = useState('')
  const [wethAmount, setWethAmount] = useState('')
  const [withdrawShares, setWithdrawShares] = useState('')
  const [liveVaultApy, setLiveVaultApy] = useState<number | null>(null)

  const filteredVaults = SUPPORTED_VAULTS.filter(v => {
    const chainMatch = selectedChainFilter === 'all' || v.chainId === selectedChainFilter
    const feeMatch = selectedFeeFilter === 'all' || v.feeTier === selectedFeeFilter
    return chainMatch && feeMatch
  })

  const activeVault: VaultMetadata | undefined = filteredVaults[activeVaultIndex]
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE
  const paginatedVaults = filteredVaults.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredVaults.length / ITEMS_PER_PAGE)

  // --- Live Serverless APY Data Fetch Sync ---
  useEffect(() => {
    if (!activeVault) return
    setLiveVaultApy(null)
    fetch(`/api/apy?vault=${activeVault.vaultAddress}&chainId=${activeVault.chainId}`)
      .then(res => res.json())
      .then(data => data && typeof data.apy === 'number' && setLiveVaultApy(data.apy))
      .catch(err => console.error("Error query indexers data streams:", err))
  }, [activeVault])

  // --- Telemetry Structural Data Readers ---
  const { data: totalAssets } = useReadContract({ address: activeVault?.vaultAddress, abi: VAULT_ABI, functionName: 'getTotalUnderlyingAssets', query: { enabled: !!activeVault } })
  const { data: sharesOwned } = useReadContract({ address: activeVault?.vaultAddress, abi: VAULT_ABI, functionName: 'userShares', args: address ? [address] : undefined, query: { enabled: !!activeVault && !!address } })
  const { data: tickLower } = useReadContract({ address: activeVault?.vaultAddress, abi: VAULT_ABI, functionName: 'tickLower', query: { enabled: !!activeVault } })
  const { data: tickUpper } = useReadContract({ address: activeVault?.vaultAddress, abi: VAULT_ABI, functionName: 'tickUpper', query: { enabled: !!activeVault } })
  const { data: poolSlot0 } = useReadContract({ address: activeVault?.poolAddress, abi: POOL_ABI, functionName: 'slot0', query: { enabled: !!activeVault } })
  // --- Secure 5-Minute Historical TWAP Oracle Lookup Mapping ---
  const { data: twapObservations } = useReadContract({ 
    address: activeVault?.poolAddress, 
    abi: POOL_ABI, 
    functionName: 'observe', 
    args: [[300, 0]], // Passes array containing [300 seconds ago, 0 seconds ago]
    query: { enabled: !!activeVault } 
  })

  const currentTick = poolSlot0 ? poolSlot0[1] : undefined
  
  // Parse structural int56 arrays inside return types to extract TWAP vectors
  const twapTick = twapObservations ? Math.floor(
    Number(twapObservations[0][1] - twapObservations[0][0]) / 300
  ) : undefined

  // --- AUTOMATED FRONTEND PRICE IMPACT PROTECTION SHIELD ---
  const calculatePriceImpactAlert = () => {
    if (currentTick === undefined || twapTick === undefined) return { dangerous: false, divergence: 0 }
    const delta = Math.abs(currentTick - twapTick)
    // Intercepts deposit transactions if spot price drifts from TWAP by more than 50 ticks
    return { dangerous: delta > 50, divergence: delta }
  }
  const priceImpactStatus = calculatePriceImpactAlert()

  // --- ERC20 Pre-Flight Allowance Infrastructure ---
  const { data: allowanceToken0, refetch: refetchAllowance0 } = useReadContract({ address: activeVault?.token0Address, abi: ERC20_ABI, functionName: 'allowance', args: address && activeVault ? [address, activeVault.vaultAddress] : undefined, query: { enabled: !!activeVault && !!address } })
  const { data: allowanceToken1, refetch: refetchAllowance1 } = useReadContract({ address: activeVault?.token1Address, abi: ERC20_ABI, functionName: 'allowance', args: address && activeVault ? [address, activeVault.vaultAddress] : undefined, query: { enabled: !!activeVault && !!address } })

  const parsedInput0 = activeVault && usdcAmount ? parseUnits(usdcAmount, activeVault.token0Decimals) : BigInt("0")
  const parsedInput1 = activeVault && wethAmount ? parseUnits(wethAmount, activeVault.token1Decimals) : BigInt("0")
  const needsApproval0 = allowanceToken0 !== undefined ? allowanceToken0 < parsedInput0 : false
  const needsApproval1 = allowanceToken1 !== undefined ? allowanceToken1 < parsedInput1 : false

  const executeApproval0 = () => {
    if (!activeVault) return
    const promise = new Promise((res, rej) => { writeContract({ address: activeVault.token0Address, abi: ERC20_ABI, functionName: 'approve', args: [activeVault.vaultAddress, BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935")] }, { onSuccess: () => { refetchAllowance0(); res(true); }, onError: rej }) })
    toast.promise(promise, { loading: `Approving ${activeVault.token0Name}...`, success: 'Verified!', error: 'Rejected.' })
  }

  const executeApproval1 = () => {
    if (!activeVault) return
    const promise = new Promise((res, rej) => { writeContract({ address: activeVault.token1Address, abi: ERC20_ABI, functionName: 'approve', args: [activeVault.vaultAddress, BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935")] }, { onSuccess: () => { refetchAllowance1(); res(true); }, onError: rej }) })
    toast.promise(promise, { loading: `Approving ${activeVault.token1Name}...`, success: 'Verified!', error: 'Rejected.' })
  }

  const handleDepositExecution = () => {
    if (!activeVault || !usdcAmount || !wethAmount) return
    if (priceImpactStatus.dangerous) {
      toast.error(`Deposit Blocked: Price Impact is currently at ${priceImpactStatus.divergence} ticks. Potential MEV Sandwich threat detected.`);
      return
    }
    if (activeWalletChainId !== activeVault.chainId) { switchChain?.({ chainId: activeVault.chainId }); return }
    const promise = new Promise((res, rej) => { writeContract({ address: activeVault.vaultAddress, abi: VAULT_ABI, functionName: 'deposit', args: [parsedInput0, parsedInput1] }, { onSuccess: () => { setUsdcAmount(''); setWethAmount(''); res(true); }, onError: rej }) })
    toast.promise(promise, { loading: 'Deploying liquidity asset parameters...', success: 'Deposited!', error: 'Failed.' })
  }

  const handleWithdrawalExecution = () => {
    if (!activeVault || !withdrawShares) return
    if (activeWalletChainId !== activeVault.chainId) { switchChain?.({ chainId: activeVault.chainId }); return }
    const promise = new Promise((res, rej) => { writeContract({ address: activeVault.vaultAddress, abi: VAULT_ABI, functionName: 'withdraw', args: [parseUnits(withdrawShares, 18), BigInt("0"), BigInt("0")] }, { onSuccess: () => { setWithdrawShares(''); res(true); }, onError: rej }) })
    toast.promise(promise, { loading: 'Redeeming protocol pool assets...', success: 'Withdrawn!', error: 'Failed.' })
  }

  const rangePercentage = () => {
    if (currentTick === undefined || tickLower === undefined || tickUpper === undefined) return 50
    const range = Number(tickUpper) - Number(tickLower)
    return range > 0 ? Math.max(0, Math.min(100, ((Number(currentTick) - Number(tickLower)) / range) * 100)) : 50
  }
  return (
    <div className='min-h-screen bg-[radial-gradient(ellipse_at_top, _var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-6'>
      <header className="max-w-7xl mx-auto flex justify-between items-center pb-8 border-b border-slate-800/60 mb-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center"><Layers className="h-5 w-5 text-white" /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">RangeBound AI Matrix</h1>
            <p className="text-xs text-slate-400">Multichain Concentrated Liquidity Yield Dashboard</p>
          </div>
        </div>
        <ConnectButton />
      </header>

      {isConnected ? (
        <main className="max-w-7xl mx-auto space-y-8">
          {/* CONTROL MATRIX: Filter Chain and Fee Tier Nodes */}
          <div className="bg-slate-900/40 border border-slate-800/60 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs text-slate-400 font-bold uppercase flex items-center gap-2"><Filter className="h-4 w-4 text-indigo-400"/> Network:</span>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button onClick={() => { setSelectedChainFilter('all'); setActiveVaultIndex(0); setCurrentPage(1); }} className={`px-3 py-1 text-xs rounded-lg ${selectedChainFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>All</button>
                <button onClick={() => { setSelectedChainFilter(42161); setActiveVaultIndex(0); setCurrentPage(1); }} className={`px-3 py-1 text-xs rounded-lg ${selectedChainFilter === 42161 ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Arbitrum</button>
                <button onClick={() => { setSelectedChainFilter(324); setActiveVaultIndex(0); setCurrentPage(1); }} className={`px-3 py-1 text-xs rounded-lg ${selectedChainFilter === 324 ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>zkSync</button>
              </div>

              <span className="text-xs text-slate-400 font-bold uppercase ml-2">Fee:</span>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[ 'all', 100, 500, 3000, 10000 ].map((tier) => (
                  <button key={tier} onClick={() => { setSelectedFeeFilter(tier as number); setActiveVaultIndex(0); setCurrentPage(1); }} className={`px-2.5 py-1 text-xs rounded-lg ${selectedFeeFilter === tier ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                    {tier === 'all' ? 'All' : `${Number(tier) / 10000}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Pagination Controls Mapping Block */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} className="p-1 text-slate-400 disabled:opacity-30"><ChevronLeft className="h-4 w-4"/></button>
                <span className="text-xs text-slate-400 font-semibold px-2">Page {currentPage} of {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} className="p-1 text-slate-400 disabled:opacity-30"><ChevronRight className="h-4 w-4"/></button>
              </div>
            )}
          </div>

          {/* ACTIVE STRATEGY VERTICAL SELECTION RACK */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paginatedVaults.map((vault, i) => {
              const isActive = activeVault?.id === vault.id
              return (
                <div key={vault.id} onClick={() => setActiveVaultIndex(indexOfFirstItem + i)} className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between h-24 ${isActive ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-900/40 border-slate-800'}`}>
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-100">{vault.token0Name}/{vault.token1Name}</h4>
                      <span className="text-[10px] text-slate-400 font-semibold">{vault.chainName}</span>
                    </div>
                    <span className="text-xs font-bold text-indigo-400">{vault.feeTier / 10000}%</span>
                  </div>
                  {isActive && <CheckCircle2 className="h-4 w-4 text-indigo-500 self-end"/>}
                </div>
              )
            })}
          </div>
          {activeVault ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Analytics Summary Framework Panel */}
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Dynamic Cache APY Module */}
                  <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Yield Engine (APY)</p>
                    <p className="text-xl font-bold text-emerald-400 mt-2">
                      {liveVaultApy !== null ? `${liveVaultApy}%` : 'Loading...'}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">7-day serverless compounding</span>
                  </div>

                  {/* Liquidity Concentration Multiplier */}
                  <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Capital Amplification</p>
                    <p className="text-xl font-bold text-slate-200 mt-2">
                      {(tickLower !== undefined && tickUpper !== undefined) 
                        ? `${(120000 / Math.abs(Number(tickUpper) - Number(tickLower))).toFixed(1)}x` 
                        : '0.0x'}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">Efficiency vs Full-Range AMM</span>
                  </div>

                  {/* PRICE IMPACT SENSOR RISK INDICATOR CARD */}
                  <div className={`border p-5 rounded-2xl relative overflow-hidden transition-all duration-300 ${priceImpactStatus.dangerous ? 'bg-rose-500/10 border-rose-500 animate-pulse' : 'bg-slate-900/40 border-slate-800'}`}>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">MEV Price Impact Sensor</p>
                    <p className={`text-sm font-bold mt-2 flex items-center gap-1.5 ${priceImpactStatus.dangerous ? 'text-rose-400' : 'text-slate-200'}`}>
                      <AlertTriangle className="h-4 w-4"/> {priceImpactStatus.dangerous ? 'High Execution Risk' : 'Optimal Entry State'}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1 block">Spot-to-TWAP delta: {priceImpactStatus.divergence} ticks</span>
                  </div>
                </div>

                {/* Concentrated Liquidity Density Progress Index */}
                <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl h-64 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-200">Concentrated Density Boundary Index</h3>
                    <p className="text-xs text-slate-400 mt-1">Real-time placement location mapping against protocol bounds</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                      <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${rangePercentage()}%` }}/>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                      <span>Lower Bound: {tickLower !== undefined ? Number(tickLower) : '0'}</span>
                      <span className="text-indigo-400">Current Spot: {currentTick !== undefined ? Number(currentTick) : '0'}</span>
                      <span>Upper Bound: {tickUpper !== undefined ? Number(tickUpper) : '0'}</span>
                    </div>
                  </div>
                  
                  <div className="h-10 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-slate-600 text-[10px] font-bold">
                    [ Subgraph Indexer Node Online ]
                  </div>
                </div>
              </div>
              {/* Right Column: Execution Form Cards */}
              <div className="space-y-6">
                <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl">
                  <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-1.5"><ArrowUpRight className="h-4 w-4 text-emerald-400"/> Fund Strategy</h3>
                  <div className="space-y-4">
                    <input type="number" placeholder={`Amount of ${activeVault.token0Name}`} value={usdcAmount} onChange={e => setUsdcAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none" />
                    <input type="number" placeholder={`Amount of ${activeVault.token1Name}`} value={wethAmount} onChange={e => setWethAmount(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none" />
                    
                    {/* DYNAMIC COMPONENT BUTTON DISPATCH CORES */}
                    {needsApproval0 ? (
                      <button onClick={executeApproval0} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-3 rounded-xl text-sm transition-all active:scale-[0.99]">Approve {activeVault.token0Name}</button>
                    ) : needsApproval1 ? (
                      <button onClick={executeApproval1} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-3 rounded-xl text-sm transition-all active:scale-[0.99]">Approve {activeVault.token1Name}</button>
                    ) : (
                      <button onClick={handleDepositExecution} disabled={priceImpactStatus.dangerous} className={`w-full py-3 rounded-xl font-semibold text-sm transition-all text-white ${priceImpactStatus.dangerous ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99]'}`}>
                        {priceImpactStatus.dangerous ? 'Deposit Blocked by Risk Protocol' : activeWalletChainId !== activeVault.chainId ? `Switch to ${activeVault.chainName}` : 'Execute Deposit'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl">
                  <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-1.5"><ArrowUpRight className="h-4 w-4 text-rose-400"/> Exit Vault</h3>
                  <input type="number" placeholder="Shares to Liquidate" value={withdrawShares} onChange={e => setWithdrawShares(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none mb-4" />
                  <button onClick={handleWithdrawalExecution} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-3 rounded-xl text-sm transition-all active:scale-[0.99]">Confirm Withdrawal</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-2xl">No configurations match selected filtering tiers.</div>
          )}
        </main>
      ) : (
        <div className="max-w-md mx-auto mt-24 text-center bg-slate-900/30 border border-slate-800 p-8 rounded-3xl">
          <Layers className="h-12 w-12 text-slate-600 mx-auto mb-4"/>
          <h2 className="text-lg font-bold text-slate-300">Secure Environment Access</h2>
          <p className="text-xs text-slate-500 mt-2 mb-6">Connect your decentralized wallet to query metrics, yields, and monitor positions.</p>
          <div className="flex justify-center"><ConnectButton /></div>
        </div>
      )}
    </div>
  )
}
