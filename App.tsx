
import React, { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { CheckCircle2, X, Wallet as WalletIcon } from 'lucide-react';
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
            gasLimit: 600000 // Explicit gas limit to prevent "gas required exceeds allowance" or estimation errors
        }
      );
      setStatusMsg("Confirming on Celo...");
      await tx.wait();
      
      setTxStatus(TxStatus.SUCCESS);
      setStatusMsg("Prediction Placed!");
      
      setTimeout(() => {
          setTxStatus(TxStatus.IDLE);
          setSelectedMatch(null);
          setPredictHome("");
          setPredictAway("");
          fetchData();
          refreshData();
          setActivePage(PageView.MY_BETS);
      }, 2000);
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
      fetchData();
      refreshData();
      setTimeout(() => setTxStatus(TxStatus.IDLE), 2000);
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
      // High gas limit for creation
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
      // High gas limit for settlement
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-in fade-in duration-200">
        <div className="w-full max-w-xs bg-[#1A1A1A] border border-gray-800 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl">
          {txStatus === TxStatus.PENDING && (
            <div className="mb-6 relative">
              <div className="w-20 h-20 border-4 border-gray-800 rounded-full"></div>
              <div className="w-20 h-20 border-4 border-celo-green rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
            </div>
          )}
          {txStatus === TxStatus.SUCCESS && <CheckCircle2 className="text-celo-green mb-6 animate-in zoom-in duration-300" size={72} />}
          {txStatus === TxStatus.ERROR && <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6"><X className="text-red-500" size={40} /></div>}
          
          <h3 className="text-xl font-bold mb-2 text-white">
            {txStatus === TxStatus.PENDING ? "Processing..." : txStatus === TxStatus.SUCCESS ? "Success!" : "Error"}
          </h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-full break-words">{statusMsg}</p>
          
          {txStatus !== TxStatus.PENDING && (
            <button 
              onClick={() => setTxStatus(TxStatus.IDLE)}
              className="w-full py-3 bg-gray-800 rounded-xl font-bold hover:bg-gray-700 transition text-white"
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
    
    // Check if already predicted
    const existingPrediction = myPredictions.find(p => p.matchId === selectedMatch.id);
    
    return (
      <div className="fixed inset-0 z-[60] flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setSelectedMatch(null)} />
        <div className="relative bg-[#1A1A1A] rounded-t-[32px] border-t border-gray-700 p-6 animate-in slide-in-from-bottom duration-300 safe-bottom shadow-2xl">
          <div className="w-12 h-1 bg-gray-600 rounded-full mx-auto mb-8 opacity-50" />
          <div className="text-center mb-8">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider font-bold mb-1">Make Your Prediction</h3>
            <div className="text-2xl font-bold text-white">
               {selectedMatch.homeTeam} <span className="text-gray-600 text-lg mx-1">vs</span> {selectedMatch.awayTeam}
            </div>
          </div>

          {existingPrediction ? (
             <div className="bg-celo-green/10 border border-celo-green/20 rounded-2xl p-6 text-center mb-6">
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
                      placeholder="-"
                      value={predictHome}
                      onChange={(e) => setPredictHome(e.target.value)}
                      className="w-20 h-20 text-center text-4xl font-bold bg-black rounded-2xl border border-gray-700 focus:border-celo-green focus:ring-2 focus:ring-celo-green/20 outline-none text-white placeholder-gray-700"
                    />
                    <span className="text-xs font-bold text-gray-500 uppercase">Home</span>
                 </div>
                 <span className="text-gray-600 text-2xl font-black">:</span>
                 <div className="flex flex-col items-center gap-2">
                    <input 
                      type="number" 
                      placeholder="-"
                      value={predictAway}
                      onChange={(e) => setPredictAway(e.target.value)}
                      className="w-20 h-20 text-center text-4xl font-bold bg-black rounded-2xl border border-gray-700 focus:border-celo-green focus:ring-2 focus:ring-celo-green/20 outline-none text-white placeholder-gray-700"
                    />
                    <span className="text-xs font-bold text-gray-500 uppercase">Away</span>
                 </div>
              </div>

              <div className="bg-gray-900 rounded-xl p-4 mb-6 border border-gray-800">
                 <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Entry Fee</span>
                    <span className="text-white font-bold">{ENTRY_FEE_DISPLAY}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Potential Win</span>
                    <span className="text-celo-gold font-bold">~{formatCurrency(selectedMatch.prizePool)} CELO</span>
                 </div>
              </div>

              <button 
                onClick={handlePredict}
                className="w-full py-4 bg-celo-green text-celo-darker font-bold text-lg rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-celo-green/20 mb-2 transform active:scale-[0.98]"
              >
                Place Bet
              </button>
            </>
          )}
          <button onClick={() => setSelectedMatch(null)} className="w-full py-3 text-gray-500 font-medium text-sm">Close</button>
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
