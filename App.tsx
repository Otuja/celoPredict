
import React, { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { CheckCircle2, X, Wallet as WalletIcon, PartyPopper, HelpCircle, ScrollText, Info, AlertTriangle, LogOut, Zap } from 'lucide-react';
import { ENTRY_FEE_DISPLAY } from './constants';
import { getContract, getReadOnlyContract, formatCurrency, getContractBalance } from './services/blockchain';
import { Match, Prediction, PageView, TxStatus } from './types';
import { BlockchainProvider, useBlockchain } from './contexts/BlockchainContext';

// Pages
import Home from './pages/Home';
import Wallet from './pages/Wallet';
import MyBets from './pages/MyBets';
import Leaderboard from './pages/Leaderboard';
import Admin from './pages/Admin';
import BottomNav from './components/BottomNav';

// Declare confetti global
declare var confetti: any;

// --- Header Component ---
const CeloLogo = () => (
  <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
    <circle cx="10" cy="12" r="5" stroke="#35D07F" strokeWidth="3"/>
    <circle cx="22" cy="12" r="5" stroke="#FBCC5C" strokeWidth="3"/>
    <circle cx="16" cy="22" r="5" stroke="#58D9F8" strokeWidth="3"/>
  </svg>
);

const Header = ({ onOpenHelp }: { onOpenHelp: () => void }) => {
  const { isConnected, isDevWallet } = useBlockchain();
  return (
    <header className="sticky top-0 z-40 w-full bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-800/40 rounded-xl flex items-center justify-center border border-white/5 shadow-inner">
               <CeloLogo />
            </div>
            <div className="flex flex-col justify-center">
               <h1 className="text-lg font-bold text-white leading-none tracking-tight flex items-center gap-1">
                 Celo<span className="text-celo-green">Predict</span>
               </h1>
               <span className="text-[10px] font-medium text-gray-500 tracking-wide uppercase">Sepolia Market</span>
            </div>
         </div>
         
         <div className="flex items-center gap-2">
            <button onClick={onOpenHelp} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
               <HelpCircle size={18} />
            </button>
            
            {isConnected && isDevWallet && (
                <div className="flex items-center gap-1.5 bg-yellow-900/20 border border-yellow-900/30 px-2 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-celo-gold animate-pulse" />
                    <span className="text-[10px] font-bold text-celo-gold">Dev Wallet</span>
                </div>
            )}
            {isConnected && !isDevWallet && (
                <div className="flex items-center gap-1.5 bg-celo-green/20 border border-celo-green/30 px-2 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-celo-green animate-pulse" />
                    <span className="text-[10px] font-bold text-celo-green">Connected</span>
                </div>
            )}
         </div>
      </div>
    </header>
  );
};

// --- Toast Notification Component ---
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-top-4 fade-in duration-300 max-w-[90%] w-auto whitespace-nowrap
      ${type === 'success' ? 'bg-green-900/80 border-celo-green/30 text-white' : 'bg-red-900/80 border-red-500/30 text-white'}`}>
      {type === 'success' ? <CheckCircle2 size={18} className="text-celo-green" /> : <AlertTriangle size={18} className="text-red-400" />}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { currentAccount, userBalance, refreshData } = useBlockchain();

  // State
  const [matches, setMatches] = useState<Match[]>([]);
  const [myPredictions, setMyPredictions] = useState<{matchId: string, prediction: Prediction, matchData: Match}[]>([]);
  const [userWinnings, setUserWinnings] = useState<string>("0");
  const [platformFees, setPlatformFees] = useState<string>("0");
  const [activePage, setActivePage] = useState<PageView>(PageView.HOME);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<TxStatus>(TxStatus.IDLE);
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [showHelp, setShowHelp] = useState<boolean>(false);
  
  // Toast State
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Betting Form
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [predictHome, setPredictHome] = useState<string>("");
  const [predictAway, setPredictAway] = useState<string>("");

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
  };

  const fetchData = useCallback(async (showLoading = false) => {
    if(showLoading) setIsLoading(true);
    try {
      const contract = getReadOnlyContract();
      
      // 1. Fetch Matches
      const activeMatchesRaw = await contract.getActiveMatches();
      const formattedMatches: Match[] = activeMatchesRaw.map((m: any) => ({
        id: m.id.toString(),
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        kickoffTime: m.kickoffTime.toString(),
        prizePool: m.prizePool.toString(),
        resultsSubmitted: m.resultsSubmitted,
        finalHomeScore: Number(m.finalHomeScore),
        finalAwayScore: Number(m.finalAwayScore),
        prizesDistributed: m.prizesDistributed
      }));
      
      formattedMatches.sort((a, b) => Number(a.kickoffTime) - Number(b.kickoffTime));
      setMatches(formattedMatches);

      // 2. Contract Balance (TVL)
      const balance = await getContractBalance();
      setPlatformFees(balance);

      // 3. User Specific Data
      if (currentAccount) {
        const userPreds = await contract.getUserPredictions(currentAccount);
        const matchIds = userPreds[0];
        const predData = userPreds[1];
        
        const combined = [];
        
        for (let i = 0; i < matchIds.length; i++) {
          const mId = matchIds[i].toString();
          let matchData = formattedMatches.find(m => m.id === mId);
          
          if (!matchData) {
             // Fetch historical if not in active
             try {
                 const m = await contract.getMatch(matchIds[i]);
                 matchData = {
                    id: m.id.toString(),
                    homeTeam: m.homeTeam,
                    awayTeam: m.awayTeam,
                    kickoffTime: m.kickoffTime.toString(),
                    prizePool: m.prizePool.toString(),
                    resultsSubmitted: m.resultsSubmitted,
                    finalHomeScore: Number(m.finalHomeScore),
                    finalAwayScore: Number(m.finalAwayScore),
                    prizesDistributed: m.prizesDistributed
                 };
             } catch(e) { continue; }
          }

          if(matchData) {
              combined.push({
                matchId: mId,
                prediction: {
                  predictor: predData[i].predictor,
                  homeScore: Number(predData[i].homeScore),
                  awayScore: Number(predData[i].awayScore),
                  amount: predData[i].amount.toString(),
                  timestamp: predData[i].timestamp.toString()
                },
                matchData: matchData
              });
          }
        }
        // Sort by newest
        combined.sort((a, b) => Number(b.prediction.timestamp) - Number(a.prediction.timestamp));
        setMyPredictions(combined);

        // Winnings
        const winnings = await contract.userWinnings(currentAccount);
        setUserWinnings(winnings.toString());
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      if(showLoading) setIsLoading(false);
    }
  }, [currentAccount]);

  // Initial Fetch
  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  // Auto-Refresh (Live Data)
  useEffect(() => {
    const interval = setInterval(() => {
       fetchData(false);
       refreshData();
    }, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchData, refreshData]);

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
      confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
  }

  // --- USER ACTIONS (Uses Browser Wallet if available, else Dev Wallet) ---

  const handlePredict = async () => {
    if (!selectedMatch) return;
    if (predictHome === "" || predictAway === "") return;

    setTxStatus(TxStatus.PENDING);
    setStatusMsg("Submitting Prediction...");
    
    try {
      // USER ACTION: getContract(false) -> Checks User Wallet First
      const contract = await getContract(false);
      const entryFee = ethers.parseEther("0.5");
      
      // Check if already predicted locally first
      const hasPredicted = myPredictions.some(p => p.matchId === selectedMatch.id);
      if (hasPredicted) {
          throw new Error("You have already predicted this match!");
      }
      
      // High gas limit to ensure it works on testnet
      const tx = await contract.predictMatch(
        selectedMatch.id,
        parseInt(predictHome),
        parseInt(predictAway),
        { 
            value: entryFee,
            gasLimit: 600000 // Explicit gas limit
        }
      );
      setStatusMsg("Confirming on Celo...");
      await tx.wait();
      
      setTxStatus(TxStatus.SUCCESS);
      setStatusMsg("Prediction Placed!");
      showToast("Prediction Successful!", "success");
      triggerConfetti();
      
      setTimeout(() => {
          setTxStatus(TxStatus.IDLE);
          setSelectedMatch(null);
          setPredictHome("");
          setPredictAway("");
          fetchData(true);
          refreshData();
          setActivePage(PageView.MY_BETS);
      }, 2500);
    } catch (error: any) {
      console.error(error);
      setTxStatus(TxStatus.ERROR);
      
      let msg = error.reason || error.message || "Transaction Failed";
      if (msg.includes("execution reverted")) msg = "Execution Reverted: Match likely closed or already predicted.";
      if (msg.includes("Already predicted")) msg = "You have already predicted this match.";
      if (msg.includes("user rejected")) msg = "User rejected the transaction.";
      
      setStatusMsg(msg);
      showToast("Prediction Failed", "error");
    }
  };

  const handleClaim = async () => {
    if (!currentAccount) return;
    setTxStatus(TxStatus.PENDING);
    setStatusMsg("Claiming Winnings...");
    
    try {
      // USER ACTION: getContract(false) -> Checks User Wallet First
      const contract = await getContract(false);
      const tx = await contract.claimWinnings({ gasLimit: 300000 });
      await tx.wait();
      setTxStatus(TxStatus.SUCCESS);
      setStatusMsg("Winnings Claimed!");
      showToast("Winnings Claimed!", "success");
      triggerConfetti();
      fetchData(true);
      refreshData();
      setTimeout(() => setTxStatus(TxStatus.IDLE), 2500);
    } catch (error: any) {
      setTxStatus(TxStatus.ERROR);
      setStatusMsg(error.reason || "Claim Failed");
      showToast("Claim Failed", "error");
    }
  };

  // --- ADMIN ACTIONS (ALWAYS USE PRIVATE KEY) ---

  const handleCreateMatch = async (home: string, away: string, kickoff: string) => {
    setTxStatus(TxStatus.PENDING);
    setStatusMsg("Creating Match...");
    try {
      // ADMIN ACTION: getContract(true) -> Forces Admin Signer
      const contract = await getContract(true);
      const kickoffUnix = Math.floor(new Date(kickoff).getTime() / 1000);
      const tx = await contract.createMatch(home, away, kickoffUnix, { gasLimit: 800000 });
      await tx.wait();
      setTxStatus(TxStatus.SUCCESS);
      setStatusMsg("Match Created!");
      showToast("Match Created Successfully", "success");
      fetchData(true);
      setTimeout(() => setTxStatus(TxStatus.IDLE), 2000);
    } catch (e: any) {
      setTxStatus(TxStatus.ERROR);
      setStatusMsg(e.reason || "Failed to create match. Are you the owner?");
      showToast("Create Match Failed", "error");
    }
  };

  const handleSettleMatch = async (id: string, home: string, away: string) => {
    if(home === "" || away === "") return;
    setTxStatus(TxStatus.PENDING);
    setStatusMsg("Submitting Result...");
    try {
      // ADMIN ACTION: getContract(true) -> Forces Admin Signer
      const contract = await getContract(true);
      const tx = await contract.submitResult(id, parseInt(home), parseInt(away), { gasLimit: 800000 });
      await tx.wait();
      setTxStatus(TxStatus.SUCCESS);
      setStatusMsg("Match Settled!");
      showToast("Match Settled Successfully", "success");
      fetchData(true);
      setTimeout(() => setTxStatus(TxStatus.IDLE), 2000);
    } catch (e: any) {
      setTxStatus(TxStatus.ERROR);
      let msg = e.reason || "Settlement Failed";
      if (e.message.includes("execution reverted")) msg = "Reverted: Match might not be started yet.";
      setStatusMsg(msg);
      showToast("Settlement Failed", "error");
    }
  };

  const handleWithdrawFees = async () => {
    setTxStatus(TxStatus.PENDING);
    setStatusMsg("Withdrawing Funds...");
    try {
      // ADMIN ACTION: getContract(true) -> Forces Admin Signer
      const contract = await getContract(true);
      const tx = await contract.withdrawPlatformFees({ gasLimit: 500000 });
      await tx.wait();
      setTxStatus(TxStatus.SUCCESS);
      setStatusMsg("Funds Withdrawn to Admin Wallet!");
      showToast("Funds Withdrawn", "success");
      fetchData(true);
      setTimeout(() => setTxStatus(TxStatus.IDLE), 2000);
    } catch (e: any) {
      console.error(e);
      setTxStatus(TxStatus.ERROR);
      let msg = "Withdrawal Failed";
      if (e.reason) msg = e.reason;
      else if (e.message && e.message.includes("Ownable")) msg = "Failed: Caller is not the owner";
      
      setStatusMsg(msg);
      showToast("Withdrawal Failed", "error");
    }
  };

  // --- Global Modals ---

  const StatusOverlay = () => {
    if (txStatus === TxStatus.IDLE) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-lg p-6 animate-in fade-in duration-200">
        <div className="w-full max-w-xs bg-black/80 border border-white/10 rounded-[32px] p-8 flex flex-col items-center text-center shadow-2xl transform transition-all scale-100">
          {txStatus === TxStatus.PENDING && (
            <div className="mb-6 relative">
              <div className="w-20 h-20 border-4 border-gray-800 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-celo-green rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
            </div>
          )}
          {txStatus === TxStatus.SUCCESS && (
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-[bounce_1s_infinite]">
               <PartyPopper className="text-celo-green" size={40} />
            </div>
          )}
          {txStatus === TxStatus.ERROR && <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6"><X className="text-red-500" size={40} /></div>}
          
          <h3 className="text-xl font-bold mb-2 text-white">
            {txStatus === TxStatus.PENDING ? "Processing..." : txStatus === TxStatus.SUCCESS ? "Awesome!" : "Error"}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-full break-words">{statusMsg}</p>
          
          {txStatus !== TxStatus.PENDING && (
            <button 
              onClick={() => setTxStatus(TxStatus.IDLE)}
              className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition shadow-lg"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  };

  const HelpModal = () => {
    if (!showHelp) return null;
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowHelp(false)}>
         <div className="bg-[#1A1A1A] rounded-3xl p-6 border border-white/10 max-w-sm w-full shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-full bg-celo-green/20 flex items-center justify-center text-celo-green">
                  <ScrollText size={20} />
               </div>
               <h3 className="text-xl font-bold text-white">App Guide</h3>
            </div>
            
            <div className="mb-6 border-b border-gray-800 pb-6">
              <h4 className="text-celo-green text-xs font-bold uppercase tracking-wider mb-3">For Judges & Testing</h4>
              <div className="space-y-3">
                 <div className="flex gap-3 items-start">
                    <span className="w-5 h-5 rounded bg-celo-green/20 text-celo-green flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                    <p className="text-gray-300 text-xs leading-relaxed">Go to the <strong>Admin</strong> tab. You are auto-logged in as Admin.</p>
                 </div>
                 <div className="flex gap-3 items-start">
                    <span className="w-5 h-5 rounded bg-celo-green/20 text-celo-green flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                    <p className="text-gray-300 text-xs leading-relaxed">Create a Match. Click <strong>"+2 Min"</strong> (Recommended) to ensure you have enough time to place a bet.</p>
                 </div>
                 <div className="flex gap-3 items-start">
                    <span className="w-5 h-5 rounded bg-celo-green/20 text-celo-green flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                    <p className="text-gray-300 text-xs leading-relaxed">Quickly go to <strong>Home</strong> and place a bet before time runs out.</p>
                 </div>
                 <div className="flex gap-3 items-start">
                    <span className="w-5 h-5 rounded bg-celo-green/20 text-celo-green flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">4</span>
                    <p className="text-gray-300 text-xs leading-relaxed">Wait for match start (2 mins). Return to <strong>Admin</strong>, enter scores, and click <strong>Settle</strong>.</p>
                 </div>
              </div>
            </div>

            <div>
              <h4 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">General Rules</h4>
              <div className="space-y-3">
                 <div className="flex gap-3">
                    <span className="w-5 h-5 rounded bg-gray-800 text-gray-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
                    <p className="text-gray-500 text-xs">Predict the <strong>exact final score</strong>.</p>
                 </div>
                 <div className="flex gap-3">
                    <span className="w-5 h-5 rounded bg-gray-800 text-gray-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
                    <p className="text-gray-500 text-xs">Entry Fee is fixed at <strong>0.5 CELO</strong>.</p>
                 </div>
                 <div className="flex gap-3">
                    <span className="w-5 h-5 rounded bg-gray-800 text-gray-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</span>
                    <p className="text-gray-500 text-xs">Winners split the pot evenly. If no one wins, pot carries over.</p>
                 </div>
              </div>
            </div>
            
            <button onClick={() => setShowHelp(false)} className="w-full mt-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200">Close Guide</button>
         </div>
      </div>
    )
  }

  const BettingSheet = () => {
    if (!selectedMatch) return null;
    
    const existingPrediction = myPredictions.find(p => p.matchId === selectedMatch.id);
    const currentPool = parseFloat(ethers.formatEther(selectedMatch.prizePool));
    const entryFee = 0.5; 
    const projectedPool = (currentPool + entryFee).toFixed(2);
    
    return (
      <div className="fixed inset-0 z-[60] flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedMatch(null)} />
        <div className="relative bg-black/80 backdrop-blur-xl rounded-t-[32px] border-t border-white/10 p-6 animate-in slide-in-from-bottom duration-300 safe-bottom shadow-2xl">
          <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-8 opacity-50" />
          <div className="text-center mb-8">
            <h3 className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">Make Your Prediction</h3>
            <div className="text-3xl font-black text-white tracking-tight">
               {selectedMatch.homeTeam} <span className="text-gray-600 text-xl mx-2 font-light">vs</span> {selectedMatch.awayTeam}
            </div>
          </div>

          {existingPrediction ? (
             <div className="bg-celo-green/10 border border-celo-green/20 rounded-3xl p-6 text-center mb-6 backdrop-blur-sm">
                <CheckCircle2 className="mx-auto text-celo-green mb-3" size={32} />
                <h4 className="text-celo-green font-bold text-lg mb-1">Prediction Placed</h4>
                <p className="text-gray-400 text-sm">You predicted {existingPrediction.prediction.homeScore} - {existingPrediction.prediction.awayScore}</p>
             </div>
          ) : (
            <>
              <div className="flex justify-center items-center gap-6 mb-8">
                 <div className="flex flex-col items-center gap-2">
                    <input 
                      type="number" 
                      placeholder="0"
                      value={predictHome}
                      onChange={(e) => setPredictHome(e.target.value)}
                      className="w-20 h-24 text-center text-5xl font-bold bg-white/5 rounded-2xl border border-white/10 focus:border-celo-green focus:bg-white/10 focus:ring-2 focus:ring-celo-green/20 outline-none text-white placeholder-gray-700 transition-all"
                    />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Home</span>
                 </div>
                 <span className="text-gray-600 text-3xl font-light opacity-50">:</span>
                 <div className="flex flex-col items-center gap-2">
                    <input 
                      type="number" 
                      placeholder="0"
                      value={predictAway}
                      onChange={(e) => setPredictAway(e.target.value)}
                      className="w-20 h-24 text-center text-5xl font-bold bg-white/5 rounded-2xl border border-white/10 focus:border-celo-green focus:bg-white/10 focus:ring-2 focus:ring-celo-green/20 outline-none text-white placeholder-gray-700 transition-all"
                    />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Away</span>
                 </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/5 backdrop-blur-md">
                 <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400 font-medium">Entry Fee</span>
                    <span className="text-white font-bold">{ENTRY_FEE_DISPLAY}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-gray-400 font-medium">Est. Prize Pool</span>
                    <span className="text-celo-gold font-bold shadow-glow">~{projectedPool} CELO</span>
                 </div>
              </div>

              <button 
                onClick={handlePredict}
                className="w-full py-4 bg-gradient-to-r from-celo-green to-emerald-500 text-black font-bold text-lg rounded-2xl hover:brightness-110 transition-all shadow-[0_0_20px_rgba(53,208,127,0.3)] mb-2 transform active:scale-[0.98]"
              >
                Place Bet
              </button>
            </>
          )}
          <button onClick={() => setSelectedMatch(null)} className="w-full py-3 text-gray-500 font-medium text-sm hover:text-white transition-colors">Cancel</button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-celo-green/30 pb-safe relative overflow-hidden">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-celo-green/5 rounded-full blur-[120px] pointer-events-none" />
      
      <Header onOpenHelp={() => setShowHelp(true)} />
      <StatusOverlay />
      <HelpModal />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <BettingSheet />
      
      <main className="max-w-md mx-auto min-h-screen relative z-10">
        {activePage === PageView.HOME && <Home matches={matches} myPredictions={myPredictions} isLoading={isLoading} onSelectMatch={setSelectedMatch} />}
        {activePage === PageView.WALLET && <Wallet userWinnings={userWinnings} onClaim={handleClaim} />}
        {activePage === PageView.MY_BETS && <MyBets myPredictions={myPredictions} onNavigateHome={() => setActivePage(PageView.HOME)} />}
        {activePage === PageView.LEADERBOARD && <Leaderboard myPredictions={myPredictions} />}
        {activePage === PageView.ADMIN && <Admin matches={matches} onCreateMatch={handleCreateMatch} onSettleMatch={handleSettleMatch} onWithdrawFees={handleWithdrawFees} platformFees={platformFees} />}
      </main>
      
      <BottomNav activePage={activePage} setActivePage={setActivePage} hasUnclaimed={Number(userWinnings) > 0} />
    </div>
  );
};

const App: React.FC = () => (
  <BlockchainProvider>
    <AppContent />
  </BlockchainProvider>
);

export default App;
