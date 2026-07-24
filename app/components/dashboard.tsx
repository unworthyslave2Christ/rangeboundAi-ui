// BY GOD'S GRACE ALONE
'use client'

import { useState, useEffect, useMemo } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useReadContract, useWriteContract, useSwitchChain } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { toast } from 'sonner'
import { Percent, Wallet, ArrowUpRight, TrendingUp, Layers, ShieldCheck, Zap, AlertTriangle, Filter, ChevronLeft, ChevronRight, CheckCircle2, Coins } from 'lucide-react'
import { SUPPORTED_VAULTS, VaultMetadata } from '@/config/vaults'

const VAULT_ABI = [
  { name: 'deposit', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'amount0Desired', type: 'uint256' }, { name: 'amount1Desired', type: 'uint256' }], outputs: [{ name: 'shares', type: 'uint256' }] },
  { name: 'withdraw', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'shares', type: 'uint256' }, { name: 'amount0Min', type: 'uint256' }, { name: 'amount1Min', type: 'uint256' }], outputs: [{ name: 'amount0Out', type: 'uint256' }, { name: 'amount1Out', type: 'uint256' }] },
  { name: 'getTotalUnderlyingAssets', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ name: 'amount0', type: 'uint256' }, { name: 'amount1', type: 'uint256' }] },
  { name: 'userShares', type: 'function', stateMutability: 'view', inputs: [{ name: 'user', type: 'address' }], outputs: [{ name: 'shares', type: 'uint256' }] },
  { name: 'totalVaultShares', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
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

  // Tracker for processing sequential pipeline operations safely
  const [executionPhase, setExecutionPhase] = useState<'IDLE' | 'APPROVING_T0' | 'APPROVING_T1' | 'DEPOSITING' | 'WITHDRAWING'>('IDLE')

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
    if (!activeVault) return setLiveVaultApy(null)
    fetch(`/api/apy?vault=${activeVault.vaultAddress}&chainId=${activeVault.chainId}`)
      .then(res => res.json())
      .then(data => data && typeof data.apy === 'number' && setLiveVaultApy(data.apy))
      .catch(err => console.error("Error querying APY analytics:", err))
  }, [activeVault])
  // --- Telemetry Structural Data Readers ---
  const { data: totalAssets } = useReadContract({ address: activeVault?.vaultAddress, abi: VAULT_ABI, functionName: 'getTotalUnderlyingAssets', query: { enabled: !!activeVault } })
  const { data: sharesOwned, refetch: refetchSharesOwned } = useReadContract({ address: activeVault?.vaultAddress, abi: VAULT_ABI, functionName: 'userShares', args: address ? [address] : undefined, query: { enabled: !!activeVault && !!address } })
  const { data: totalVaultShares, refetch: refetchTotalShares } = useReadContract({ address: activeVault?.vaultAddress, abi: VAULT_ABI, functionName: 'totalVaultShares', query: { enabled: !!activeVault } })
  const { data: tickLower } = useReadContract({ address: activeVault?.vaultAddress, abi: VAULT_ABI, functionName: 'tickLower', query: { enabled: !!activeVault } })
  const { data: tickUpper } = useReadContract({ address: activeVault?.vaultAddress, abi: VAULT_ABI, functionName: 'tickUpper', query: { enabled: !!activeVault } })
  const { data: poolSlot0 } = useReadContract({ address: activeVault?.poolAddress, abi: POOL_ABI, functionName: 'slot0', query: { enabled: !!activeVault } })
  const { data: twapObservations } = useReadContract({ address: activeVault?.poolAddress, abi: POOL_ABI, functionName: 'observe', args: [[300, 0]], query: { enabled: !!activeVault } })

  const currentTick = poolSlot0 ? poolSlot0[1] : undefined;
  const twapTick = twapObservations ? Math.floor(Number(twapObservations[0][1] - twapObservations[0][0]) / 300) : undefined;

  // --- AUTOMATED FRONTEND PRICE IMPACT PROTECTION SHIELD ---
  const calculatePriceImpactAlert = () => {
    if (currentTick === undefined || twapTick === undefined) return { dangerous: false, divergence: 0 };
    const delta = Math.abs(currentTick - twapTick);
    return { dangerous: delta > 50, divergence: delta };
  };
  const priceImpactStatus = calculatePriceImpactAlert();

  // --- ERC20 Pre-Flight Allowance Infrastructure ---
  const { data: allowanceToken0, refetch: refetchAllowance0 } = useReadContract({ address: activeVault?.token0Address, abi: ERC20_ABI, functionName: 'allowance', args: address && activeVault ? [address, activeVault.vaultAddress] : undefined, query: { enabled: !!activeVault && !!address } });
  const { data: allowanceToken1, refetch: refetchAllowance1 } = useReadContract({ address: address && activeVault ? activeVault.token1Address : undefined, abi: ERC20_ABI, functionName: 'allowance', args: address && activeVault ? [address, activeVault.vaultAddress] : undefined, query: { enabled: !!activeVault && !!address } });

  // Fixes absolute falsity by memoizing input evaluations to bypass stale render loops
  const parsedInput0 = useMemo(() => {
    if (!activeVault || !usdcAmount || isNaN(Number(usdcAmount)) || Number(usdcAmount) <= 0) return 0n;
    try { return parseUnits(usdcAmount, activeVault.token0Decimals); } catch { return 0n; }
  }, [usdcAmount, activeVault]);

  const parsedInput1 = useMemo(() => {
    if (!activeVault || !wethAmount || isNaN(Number(wethAmount)) || Number(wethAmount) <= 0) return 0n;
    try { return parseUnits(wethAmount, activeVault.token1Decimals); } catch { return 0n; }
  }, [wethAmount, activeVault]);

  const needsApproval0 = useMemo(() => {
    if (allowanceToken0 === undefined || parsedInput0 === 0n) return false;
    return allowanceToken0 < parsedInput0;
  }, [allowanceToken0, parsedInput0]);

  const needsApproval1 = useMemo(() => {
    if (allowanceToken1 === undefined || parsedInput1 === 0n) return false;
    return allowanceToken1 < parsedInput1;
  }, [allowanceToken1, parsedInput1]);

  const isDepositWorkflowActive = executionPhase === 'APPROVING_T0' || executionPhase === 'APPROVING_T1' || executionPhase === 'DEPOSITING';
  const isWithdrawButtonDisabled = isDepositWorkflowActive || executionPhase === 'WITHDRAWING';
  const executeApproval0 = async (): Promise<boolean> => {
    if (!activeVault || !needsApproval0) return true;
    setExecutionPhase('APPROVING_T0');
    return new Promise((resolve) => {
      writeContract({
        address: activeVault.token0Address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [activeVault.vaultAddress, parsedInput0] // Approves exactly the UI entry amount
      }, {
        onSuccess: async () => {
          await refetchAllowance0();
          resolve(true);
        },
        onError: (err) => {
          console.error(err);
          setExecutionPhase('IDLE');
          resolve(false);
        }
      });
    });
  };

  const executeApproval1 = async (): Promise<boolean> => {
    if (!activeVault || !needsApproval1) return true;
    setExecutionPhase('APPROVING_T1');
    return new Promise((resolve) => {
      writeContract({
        address: activeVault.token1Address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [activeVault.vaultAddress, parsedInput1] // Approves exactly the UI entry amount
      }, {
        onSuccess: async () => {
          await refetchAllowance1();
          resolve(true);
        },
        onError: (err) => {
          console.error(err);
          setExecutionPhase('IDLE');
          resolve(false);
        }
      });
    });
  };

  const handleDepositExecution = async () => {
    if (!activeVault || isDepositWorkflowActive) return;
    if (parsedInput0 === 0n && parsedInput1 === 0n) {
      toast.error("Please enter a valid asset amount.");
      return;
    }
    if (priceImpactStatus.dangerous) {
      toast.error(`Deposit Blocked: Price Impact risk limit reached.`);
      return;
    }
    if (activeWalletChainId !== activeVault.chainId) {
      switchChain?.({ chainId: activeVault.chainId });
      return;
    }

    // Pipeline Step 1: Sequential validation of Token 0
    if (needsApproval0) {
      const app0Promise = executeApproval0();
      toast.promise(app0Promise, { loading: `Approving ${activeVault.token0Name}...`, success: `${activeVault.token0Name} approved!`, error: 'Rejected.' });
      const success = await app0Promise;
      if (!success) return;
    }

    // Pipeline Step 2: Sequential validation of Token 1 (Automated chain step execution)
    if (needsApproval1) {
      const app1Promise = executeApproval1();
      toast.promise(app1Promise, { loading: `Approving ${activeVault.token1Name}...`, success: `${activeVault.token1Name} approved!`, error: 'Rejected.' });
      const success = await app1Promise;
      if (!success) return;
    }

    // Pipeline Step 3: Deployment step for final deposit
    setExecutionPhase('DEPOSITING');
    const depositPromise = new Promise((res, rej) => {
      writeContract({
        address: activeVault.vaultAddress,
        abi: VAULT_ABI,
        functionName: 'deposit',
        args: [parsedInput0, parsedInput1]
      }, {
        onSuccess: () => {
          setUsdcAmount('');
          setWethAmount('');
          setExecutionPhase('IDLE');
          refetchSharesOwned();
          refetchTotalShares();
          res(true);
        },
        onError: (err) => {
          setExecutionPhase('IDLE');
          rej(err);
        }
      });
    });

    toast.promise(depositPromise, { loading: 'Deploying liquidity asset parameters...', success: 'Deposited successfully!', error: 'Failed.' });
  };
  const handleWithdrawalExecution = () => {
    if (!activeVault || !withdrawShares || isWithdrawButtonDisabled) return;
    if (activeWalletChainId !== activeVault.chainId) {
      switchChain?.({ chainId: activeVault.chainId });
      return;
    }
    setExecutionPhase('WITHDRAWING');
    const promise = new Promise((res, rej) => {
      writeContract({
        address: activeVault.vaultAddress,
        abi: VAULT_ABI,
        functionName: 'withdraw',
        args: [parseUnits(withdrawShares, 18), BigInt("0"), BigInt("0")]
      }, {
        onSuccess: () => {
          setWithdrawShares('');
          setExecutionPhase('IDLE');
          refetchSharesOwned();
          refetchTotalShares();
          res(true);
        },
        onError: (err) => {
          setExecutionPhase('IDLE');
          rej(err);
        }
      });
    });
    toast.promise(promise, { loading: 'Redeeming protocol pool assets...', success: 'Withdrawn!', error: 'Failed.' });
  };

  const rangePercentage = () => {
    if (currentTick === undefined || tickLower === undefined || tickUpper === undefined) return 50;
    if (Number(currentTick) <= Number(tickLower)) return 0;
    if (Number(currentTick) >= Number(tickUpper)) return 100;
    const range = Number(tickUpper) - Number(tickLower);
    return range > 0 ? Math.max(0, Math.min(100, ((Number(currentTick) - Number(tickLower)) / range) * 100)) : 50;
  };

  const calculateRangeProximity = () => {
    if (currentTick === undefined || tickLower === undefined || tickUpper === undefined) {
      return { percentage: 50, label: 'Optimal Synchronization', color: 'text-slate-200' };
    }
    if (Number(currentTick) <= Number(tickLower) || Number(currentTick) >= Number(tickUpper)) {
      return { percentage: rangePercentage(), label: 'CRITICAL: OUT OF RANGE (Rebalancing Inbound)', color: 'text-rose-400' };
    }
    const totalRange = Number(tickUpper) - Number(tickLower);
    if (totalRange <= 0) return { percentage: 50, label: 'Optimal Synchronization', color: 'text-slate-200' };
    const positionOffset = Number(currentTick) - Number(tickLower);
    const percentage = (positionOffset / totalRange) * 100;
    let label = 'Centered Strategy';
    let color = 'text-slate-200';
    if (percentage < 15 || percentage > 85) {
      label = 'Asymmetric Drift (Trigger Near)';
      color = 'text-amber-400';
    }
    return { percentage, label, color };
  };

  const rangeMetrics = calculateRangeProximity();

  const calculateCapitalEfficiency = () => {
    if (tickLower === undefined || tickUpper === undefined || !activeVault) return '0.0x';
    const rangeWidth = Math.abs(Number(tickUpper) - Number(tickLower));
    if (rangeWidth === 0) return '1.0x';
    let spacing = 60;
    if (activeVault.feeTier === 100) spacing = 1;
    if (activeVault.feeTier === 500) spacing = 10;
    if (activeVault.feeTier === 3000) spacing = 60;
    if (activeVault.feeTier === 10000) spacing = 200;
    const normalizedWidth = rangeWidth / spacing;
    if (normalizedWidth === 0) return '1.0x';
    const multiplier = (1200 / normalizedWidth).toFixed(1);
    return `${multiplier}x`;
  };
  return (
    <div className='min-h-screen bg-[radial-gradient(ellipse_at_top, _var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black p-6'>
      <header className="max-w-7xl mx-auto flex justify-between items-center pb-8 border-b border-slate-800/60 mb-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20"><Layers className="h-5 w-5 text-white" /></div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">RangeBound AI Matrix</h1>
            <p className="text-xs text-slate-400">Multichain Concentrated Liquidity Yield Dashboard</p>
          </div>
        </div>
        <ConnectButton />
      </header>

      {isConnected ? (
        <main className="max-w-7xl mx-auto space-y-8">
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
                {['all', 100, 500, 3000, 10000].map((tier) => (
                  <button key={tier} onClick={() => { setSelectedFeeFilter(tier as number); setActiveVaultIndex(0); setCurrentPage(1); }} className={`px-2.5 py-1 text-xs rounded-lg ${selectedFeeFilter === tier ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>{tier === 'all' ? 'All' : `${Number(tier) / 10000}%`}</button>
                ))}
              </div>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} className="p-1 text-slate-400 disabled:opacity-30"><ChevronLeft className="h-4 w-4"/></button>
                <span className="text-xs text-slate-400 font-semibold px-2">Page {currentPage} of {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} className="p-1 text-slate-400 disabled:opacity-30"><ChevronRight className="h-4 w-4"/></button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {paginatedVaults.map((vault, i) => {
              const isActive = activeVault?.id === vault.id
              return (
                <div key={vault.id} onClick={() => !isDepositWorkflowActive && setActiveVaultIndex(indexOfFirstItem + i)} className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between h-24 ${isActive ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-900/40 border-slate-800'} ${isDepositWorkflowActive ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl relative overflow-hidden">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Strategy APY</p>
                    <p className="text-lg font-bold text-emerald-400 mt-1">{liveVaultApy !== null ? `${liveVaultApy}%` : 'Loading...'}</p>
                    <span className="text-[9px] text-slate-400 block mt-0.5">7-day compounded index</span>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Capital Mult.</p>
                    <p className="text-lg font-bold text-slate-200 mt-1">{calculateCapitalEfficiency()}</p>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Efficiency vs Full AMM</span>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl relative overflow-hidden">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Your Allocation</p>
                    <p className="text-lg font-bold text-indigo-400 mt-1">{sharesOwned ? `${parseFloat(formatUnits(sharesOwned, 18)).toFixed(2)}` : '0.00'}</p>
                    <span className="text-[9px] text-slate-400 block mt-0.5">User Vault Shares Owned</span>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Vault Pool</p>
                    <p className="text-lg font-bold text-slate-100 mt-1">{totalVaultShares ? `${parseFloat(formatUnits(totalVaultShares, 18)).toFixed(2)}` : '0.00'}</p>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Total Pool Shares Issued</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Vault Liquid Assets Under Management</p>
                    <p className="text-md font-bold text-slate-100 mt-2">
                      {totalAssets ? `${formatUnits(totalAssets[0], activeVault.token0Decimals)} ${activeVault.token0Name} / ${formatUnits(totalAssets[1], activeVault.token1Decimals)} ${activeVault.token1Name}` : '0.00 / 0.00'}
                    </p>
                  </div>
                  <div className={`border p-5 rounded-2xl relative overflow-hidden transition-all duration-300 ${priceImpactStatus.dangerous ? 'bg-rose-500/10 border-rose-500 animate-pulse' : 'bg-slate-900/40 border-slate-800'}`}>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">MEV Price Impact Sensor</p>
                    <p className={`text-sm font-bold mt-2 flex items-center gap-1.5 ${priceImpactStatus.dangerous ? 'text-rose-400' : 'text-slate-200'}`}><AlertTriangle className="h-4 w-4"/> {priceImpactStatus.dangerous ? 'High Execution Risk' : 'Optimal Entry State'}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">Spot-to-TWAP delta: {priceImpactStatus.divergence} ticks</span>
                  </div>
                </div>

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
                      {/* Fixed: Removed incorrect array index syntax from scalar parameter */}
                      <span className="text-indigo-400">Current Spot: {currentTick !== undefined ? Number(currentTick) : '0'}</span>
                      <span>Upper Bound: {tickUpper !== undefined ? Number(tickUpper) : '0'}</span>
                    </div>
                  </div>
                  <div className="h-10 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 flex items-center justify-center text-slate-600 text-[10px] font-bold">[ Subgraph Indexer Node Online ]</div>
                </div>
              </div>
              {/* Right Column: Execution Form Cards */}
              <div className="space-y-6">
                <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl">
                  <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-1.5"><ArrowUpRight className="h-4 w-4 text-emerald-400"/> Fund Strategy</h3>
                  <div className="space-y-4">
                    <input type="number" placeholder={`Amount of ${activeVault.token0Name}`} value={usdcAmount} onChange={e => setUsdcAmount(e.target.value)} disabled={isDepositWorkflowActive} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none disabled:opacity-40" />
                    <input type="number" placeholder={`Amount of ${activeVault.token1Name}`} value={wethAmount} onChange={e => setWethAmount(e.target.value)} disabled={isDepositWorkflowActive} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none disabled:opacity-40" />

                    <button 
                      onClick={handleDepositExecution} 
                      disabled={priceImpactStatus.dangerous || isDepositWorkflowActive || (parsedInput0 === 0n && parsedInput1 === 0n)} 
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition-all text-white ${
                        priceImpactStatus.dangerous || (parsedInput0 === 0n && parsedInput1 === 0n) ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] disabled:opacity-50'
                      }`}
                    >
                      {executionPhase === 'APPROVING_T0' && `Approving ${activeVault.token0Name}...`}
                      {executionPhase === 'APPROVING_T1' && `Approving ${activeVault.token1Name}...`}
                      {executionPhase === 'DEPOSITING' && 'Depositing Assets...'}
                      {executionPhase === 'IDLE' && (
                        priceImpactStatus.dangerous ? 'Deposit Blocked by Risk Protocol' : activeWalletChainId !== activeVault.chainId ? `Switch to ${activeVault.chainName}` : (needsApproval0 || needsApproval1) ? 'Approve & Deposit Assets' : 'Execute Deposit'
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl">
                  <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-1.5"><ArrowUpRight className="h-4 w-4 text-rose-400"/> Exit Vault</h3>
                  <input type="number" placeholder="Shares to Liquidate" value={withdrawShares} onChange={e => setWithdrawShares(e.target.value)} disabled={isWithdrawButtonDisabled} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none mb-4 disabled:opacity-40" />
                  <button 
                    onClick={handleWithdrawalExecution} 
                    disabled={isWithdrawButtonDisabled || !withdrawShares} 
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-3 rounded-xl text-sm transition-all active:scale-[0.99] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {executionPhase === 'WITHDRAWING' ? 'Confirming Withdrawal...' : 'Confirm Withdrawal'}
                  </button>
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
