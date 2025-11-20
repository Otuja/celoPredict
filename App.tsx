import React, { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { CheckCircle2, X, Wallet as WalletIcon, PartyPopper } from 'lucide-react';
import { ENTRY_FEE_DISPLAY } from './constants';
import { getContract, getReadOnlyContract, formatCurrency } from './services/blockchain';
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

const Header = () => {
  const { isConnected, connectWallet, isConnecting } = useBlockchain();
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
            {!isConnected ? (
                <button 
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="flex items-center gap-2 bg-celo-green text-black px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-400 transition-colors"
                >
                   <WalletIcon size={12} />
                   {isConnecting ? "..." : "Connect"}
                </button>
            ) : (
              <div className="flex items-center gap-1.5 bg-green-900/20 border border-green-900/30 px-2 py-1 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-celo-green shadow-[0_0_8px_rgba(53,208,127,0.6)] animate-pulse" />
                <span className="text-[10px] font-bold text-celo-green">Live</span>
              </div>
            )}
         </div>
      </div>
    </header>
  );
};

const AppContent: React.FC = () => {
  const { currentAccount, userBalance, refreshData, connectWallet } = useBlockchain();

  // State
  const [matches, setMatches] = useState<Match[]>([]);
  const [myPredictions, setMyPredictions] = useState<{matchId: string, prediction: Prediction, matchData: Match}[]>([]);
  const [userWinnings, setUserWinnings] = useState<string>("0");
  const [activePage, setActivePage] = useState<PageView>(PageView.HOME);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<TxStatus>(TxStatus.IDLE);
  const [statusMsg, setStatusMsg] = useState<string>("");

  // Betting Form
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [predictHome, setPredictHome] = useState<string>("");
  const [predictAway, setPredictAway] = useState<string>("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
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

      // 2. User Specific Data
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
      setIsLoading(false);
    }
  }, [currentAccount]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  // --- Contract Actions ---

  const handlePredict = async () => {
    if (!selectedMatch) return;
    // Auto-connect if missing
    if (!currentAccount) {
        await connectWallet();
    }
    if (predictHome === "" || predictAway === "") return;

    setTxStatus(TxStatus.PENDING);
    setStatusMsg("Submitting Prediction...");
    
    try {
      const contract = await getContract();
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
      triggerConfetti();
      
      setTimeout(() => {
          setTxStatus(TxStatus.IDLE);
          setSelectedMatch(null);
          setPredictHome("");
          setPredictAway("");
          fetchData();
          refreshData();
          setActivePage(PageView.MY_BETS);
      }, 2500);
    } catch (error: any) {
      console.error(error);
      setTxStatus(TxStatus.ERROR);
      
      let msg = error.reason || error.message || "Transaction Failed";
      if (msg.includes("execution reverted")) msg = "Execution Reverted: Match likely closed or already predicted.";
      if (msg.includes("Already predicted")) msg = "You have already predicted this match.";
      
      setStatusMsg(msg);
    }
  };

  const handleClaim = async () => {
    if (!currentAccount) return;
    setTxStatus(TxStatus.PENDING);
    setStatusMsg("Claiming Winnings...");
    
    try {
      const contract = await getContract();
      const tx = await contract.claimWinnings({ gasLimit: 300000 });
      await tx.wait();
      setTxStatus(TxStatus.SUCCESS);
      setStatusMsg("Winnings Claimed!");
      triggerConfetti();
      fetchData();
      refreshData();
      setTimeout(() => setTxStatus(TxStatus.IDLE), 2500);
    } catch (error: any) {
      setTxStatus(TxStatus.ERROR);
      setStatusMsg(error.reason || "Claim Failed");
    }
  };

  const handleCreateMatch = async (home: string, away: string, kickoff: string) => {
    setTxStatus(TxStatus.PENDING);
    setStatusMsg("Creating Match...");
    try {
      const contract = await getContract();
      const kickoffUnix = Math.floor(new Date(kickoff).getTime() / 1000);
      const tx = await contract.createMatch(home, away, kickoffUnix, { gasLimit: 800000 });
      await tx.wait();
      setTxStatus(TxStatus.SUCCESS);
      setStatusMsg("Match Created!");
      fetchData();
      setTimeout(() => setTxStatus(TxStatus.IDLE), 2000);
    } catch (e: any) {
      setTxStatus(TxStatus.ERROR);
      setStatusMsg(e.reason || "Failed to create match. Are you the owner?");
    }
  };

  const handleSettleMatch = async (id: string, home: string, away: string) => {
    if(home === "" || away === "") return;
    setTxStatus(TxStatus.PENDING);
    setStatusMsg("Submitting Result...");
    try {
      const contract = await getContract();
      const tx = await contract.submitResult(id, parseInt(home), parseInt(away), { gasLimit: 800000 });
      await tx.wait();
      setTxStatus(TxStatus.SUCCESS);
      setStatusMsg("Match Settled!");
      fetchData();
      setTimeout(() => setTxStatus(TxStatus.IDLE), 2000);
    } catch (e: any) {
      setTxStatus(TxStatus.ERROR);
      let msg = e.reason || "Settlement Failed";
      if (e.message.includes("execution reverted")) msg = "Reverted: Match might not be started yet.";
      setStatusMsg(msg);
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

  const BettingSheet = () => {
    if (!selectedMatch) return null;
    
    const existingPrediction = myPredictions.find(p => p.matchId === selectedMatch.id);
    
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
                    <span className="text-gray-400 font-medium">Potential Win</span>
                    <span className="text-celo-gold font-bold shadow-glow">~{formatCurrency(selectedMatch.prizePool)} CELO</span>
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
      
      <Header />
      <StatusOverlay />
      <BettingSheet />
      
      <main className="max-w-md mx-auto min-h-screen relative z-10">
        {activePage === PageView.HOME && <Home matches={matches} myPredictions={myPredictions} isLoading={isLoading} onSelectMatch={setSelectedMatch} />}
        {activePage === PageView.WALLET && <Wallet userWinnings={userWinnings} onClaim={handleClaim} />}
        {activePage === PageView.MY_BETS && <MyBets myPredictions={myPredictions} onNavigateHome={() => setActivePage(PageView.HOME)} />}
        {activePage === PageView.LEADERBOARD && <Leaderboard myPredictions={myPredictions} />}
        {activePage === PageView.ADMIN && <Admin matches={matches} onCreateMatch={handleCreateMatch} onSettleMatch={handleSettleMatch} />}
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