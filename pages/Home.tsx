import React, { useMemo, useState, useEffect } from 'react';
import { Trophy, Clock, Coins, ChevronRight, CheckCircle2, Lock, Radio } from 'lucide-react';
import { Match, Prediction } from '../types';
import { formatCurrency, formatTimestamp } from '../services/blockchain';
import { useBlockchain } from '../contexts/BlockchainContext';

interface HomeProps {
  matches: Match[];
  myPredictions: {matchId: string, prediction: Prediction, matchData: Match}[];
  isLoading: boolean;
  onSelectMatch: (match: Match) => void;
}

const Home: React.FC<HomeProps> = ({ matches, myPredictions, isLoading, onSelectMatch }) => {
  const { userBalance, currentAccount } = useBlockchain();
  const [now, setNow] = useState(Date.now() / 1000);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now() / 1000), 5000); // Update every 5s for live indicators
    return () => clearInterval(interval);
  }, []);

  const sortedMatches = useMemo(() => {
    if (!matches.length) return [];

    const predictedIds = new Set(myPredictions.map(p => p.matchId));
    
    const unpredictedFuture: Match[] = [];
    const predicted: Match[] = [];
    const unpredictedPast: Match[] = [];

    matches.forEach(m => {
        const isPred = predictedIds.has(m.id);
        const isPast = Number(m.kickoffTime) <= now;

        if (isPred) {
            predicted.push(m);
        } else if (!isPast) {
            unpredictedFuture.push(m);
        } else {
            unpredictedPast.push(m);
        }
    });

    unpredictedFuture.sort((a, b) => Number(a.kickoffTime) - Number(b.kickoffTime));
    predicted.sort((a, b) => Number(a.kickoffTime) - Number(b.kickoffTime));
    unpredictedPast.sort((a, b) => Number(b.kickoffTime) - Number(a.kickoffTime));

    return [...unpredictedFuture, ...predicted, ...unpredictedPast];
  }, [matches, myPredictions, now]);

  const isPredicted = (matchId: string) => {
    return myPredictions.some(p => p.matchId === matchId);
  };

  const getPrediction = (matchId: string) => {
    return myPredictions.find(p => p.matchId === matchId)?.prediction;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 pt-2">
      <div className="flex items-center justify-between mb-6 px-4 pt-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Matches</h1>
            <p className="text-gray-400 text-sm font-medium">Predict scores & win CELO</p>
          </div>
          <div className="flex items-center gap-2">
             {currentAccount && (
               <div className="bg-[#1A1A1A] rounded-full px-4 py-1.5 flex items-center gap-2 border border-white/10">
                  <div className="w-2 h-2 bg-celo-green rounded-full animate-pulse" />
                  <span className="text-xs font-mono font-bold text-white">{parseFloat(userBalance).toFixed(2)} CELO</span>
               </div>
             )}
          </div>
      </div>

      <div className="px-4 space-y-4">
        {sortedMatches.length === 0 && !isLoading && (
           <div className="p-10 text-center border border-dashed border-gray-800 rounded-3xl mt-8 bg-[#1A1A1A]">
             <Trophy className="mx-auto text-gray-700 mb-4" size={48} />
             <p className="text-gray-500 font-medium">No active matches.</p>
           </div>
        )}

        {sortedMatches.map((match) => {
          const isClosed = now > Number(match.kickoffTime);
          const isLive = isClosed && !match.resultsSubmitted;
          const alreadyPredicted = isPredicted(match.id);
          const myPred = getPrediction(match.id);
          
          return (
            <div 
              key={match.id}
              onClick={() => !isClosed && !alreadyPredicted && onSelectMatch(match)}
              className={`bg-[#161616] border border-white/5 rounded-3xl p-5 relative overflow-hidden transition-all
                ${!isClosed && !alreadyPredicted ? 'active:scale-[0.98] hover:border-white/10' : ''}
                ${isClosed && !alreadyPredicted ? 'opacity-50 grayscale' : ''}
              `}
            >
                {/* Status Bar */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                        {isLive ? (
                          <div className="flex items-center gap-2 text-red-500 font-bold animate-pulse">
                            <Radio size={14} /> LIVE NOW
                          </div>
                        ) : (
                          <>
                            <Clock size={14} />
                            <span>{formatTimestamp(match.kickoffTime)}</span>
                          </>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-celo-gold text-xs font-bold bg-celo-gold/10 px-2.5 py-1 rounded-lg">
                        <Coins size={14} />
                        <span>{formatCurrency(match.prizePool)} Pool</span>
                    </div>
                </div>

                {/* Teams */}
                <div className="flex items-center justify-between mb-6">
                    {/* Home */}
                    <div className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-[#222] flex items-center justify-center text-lg font-bold text-white shadow-inner">
                            {match.homeTeam.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-white text-center">{match.homeTeam}</span>
                    </div>

                    {/* VS / Score */}
                    <div className="flex flex-col items-center px-4">
                        {alreadyPredicted && myPred ? (
                             <div className="flex flex-col items-center">
                                <span className="text-[10px] text-gray-500 font-bold uppercase mb-1">Your Pick</span>
                                <div className="text-2xl font-mono font-bold text-celo-green tracking-widest bg-celo-green/10 px-3 py-1 rounded-lg border border-celo-green/20">
                                    {myPred.homeScore}-{myPred.awayScore}
                                </div>
                             </div>
                        ) : (
                            <span className="text-gray-700 text-sm font-black bg-gray-900 px-2 py-1 rounded">VS</span>
                        )}
                    </div>

                    {/* Away */}
                    <div className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-[#222] flex items-center justify-center text-lg font-bold text-white shadow-inner">
                            {match.awayTeam.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-white text-center">{match.awayTeam}</span>
                    </div>
                </div>

                {/* Footer Button */}
                <div className="mt-2">
                    {alreadyPredicted ? (
                         <button className="w-full py-3 bg-[#1A1A1A] border border-celo-green/30 rounded-xl flex items-center justify-center gap-2 text-celo-green text-sm font-bold">
                             <CheckCircle2 size={16} />
                             <span>Open Bet</span>
                         </button>
                    ) : isClosed ? (
                        <button className="w-full py-3 bg-gray-800/50 border border-white/5 rounded-xl flex items-center justify-center gap-2 text-gray-500 text-sm font-bold cursor-not-allowed">
                             <Lock size={16} />
                             <span>Prediction Closed</span>
                         </button>
                    ) : (
                        <button className="w-full py-3.5 bg-white text-black rounded-xl flex items-center justify-center gap-2 text-sm font-bold hover:bg-gray-200 transition-colors">
                             <span>Predict Score</span>
                             <ChevronRight size={16} className="text-gray-500" />
                         </button>
                    )}
                </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Home;