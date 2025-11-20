
import React, { useMemo, useState, useEffect } from 'react';
import { Trophy, Timer, Coins, ChevronRight, CheckCircle2, Activity } from 'lucide-react';
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

  // Update time every minute to keep UI fresh
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now() / 1000), 60000);
    return () => clearInterval(interval);
  }, []);

  // Advanced Sorting Logic
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

    // 1. Actionable: Soonest kickoff first
    unpredictedFuture.sort((a, b) => Number(a.kickoffTime) - Number(b.kickoffTime));
    
    // 2. Predicted: Soonest kickoff first (easy to find active games)
    predicted.sort((a, b) => Number(a.kickoffTime) - Number(b.kickoffTime));

    // 3. Missed: Most recent past first
    unpredictedPast.sort((a, b) => Number(b.kickoffTime) - Number(a.kickoffTime));

    return [...unpredictedFuture, ...predicted, ...unpredictedPast];
  }, [matches, myPredictions, now]);

  const isPredicted = (matchId: string) => {
    return myPredictions.some(p => p.matchId === matchId);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32 pt-2">
      <div className="flex items-center justify-between mb-6 px-4 pt-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Upcoming</h1>
            <p className="text-gray-400 text-sm">Tap to predict & win</p>
          </div>
          <div className="flex items-center gap-2">
             {currentAccount && (
               <div className="bg-gray-800 rounded-full px-3 py-1 flex items-center gap-2 border border-gray-700">
                  <div className="w-2 h-2 bg-celo-green rounded-full animate-pulse" />
                  <span className="text-xs font-mono text-white">{parseFloat(userBalance).toFixed(2)} CELO</span>
               </div>
             )}
          </div>
      </div>

      <div className="px-4 space-y-4">
        {sortedMatches.length === 0 && !isLoading && (
           <div className="p-8 text-center border border-dashed border-gray-800 rounded-3xl mt-8">
             <Trophy className="mx-auto text-gray-700 mb-4" size={40} />
             <p className="text-gray-500">No matches found.</p>
           </div>
        )}

        {sortedMatches.map((match) => {
          const isClosed = now > Number(match.kickoffTime);
          const alreadyPredicted = isPredicted(match.id);
          
          return (
            <div 
              key={match.id}
              onClick={() => !isClosed && !alreadyPredicted && onSelectMatch(match)}
              className={`group relative rounded-3xl p-1 overflow-hidden transition-all 
                ${alreadyPredicted ? 'opacity-100 border border-celo-green/20' : isClosed ? 'opacity-60 grayscale' : 'active:scale-[0.98]'} 
                bg-[#1A1A1A]`}
            >
              {alreadyPredicted && <div className="absolute top-0 right-0 p-2"><div className="w-2 h-2 bg-celo-green rounded-full shadow-[0_0_10px_#35D07F]"></div></div>}
              
              <div className="bg-[#121212] rounded-[22px] p-5 border border-white/5 relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                   <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1 rounded-full">
                      <Timer size={12} className="text-gray-400" />
                      <span className="text-xs font-medium text-gray-300">{formatTimestamp(match.kickoffTime)}</span>
                   </div>
                   <div className="flex items-center gap-1 text-celo-gold text-xs font-bold">
                      <Coins size={14} />
                      <span>Pool: {formatCurrency(match.prizePool)}</span>
                   </div>
                </div>

                {/* Teams */}
                <div className="flex items-center justify-between gap-2">
                   <div className="flex-1 text-center">
                      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-lg font-bold mb-2 border ${alreadyPredicted ? 'bg-celo-green/10 border-celo-green/30 text-celo-green' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                        {match.homeTeam.charAt(0)}
                      </div>
                      <div className="text-base font-bold text-white truncate">{match.homeTeam}</div>
                   </div>
                   
                   <div className="flex flex-col items-center">
                      <span className="text-gray-600 text-xs font-bold mb-1">VS</span>
                      <div className="w-8 h-[1px] bg-gray-700" />
                   </div>

                   <div className="flex-1 text-center">
                      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-lg font-bold mb-2 border ${alreadyPredicted ? 'bg-celo-green/10 border-celo-green/30 text-celo-green' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                        {match.awayTeam.charAt(0)}
                      </div>
                      <div className="text-base font-bold text-white truncate">{match.awayTeam}</div>
                   </div>
                </div>

                {/* CTA */}
                <div className="mt-6">
                  <button className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors
                    ${alreadyPredicted 
                        ? isClosed 
                            ? 'bg-celo-green/10 text-celo-green border border-celo-green/20' // Predicted & Started -> Open Bet
                            : 'bg-gray-800 text-gray-400 border border-gray-700' // Predicted & Waiting -> Prediction Placed
                        : isClosed 
                            ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed' // Missed
                            : 'bg-gray-800 text-celo-green group-active:bg-celo-green group-active:text-black' // Actionable
                    }`}
                  >
                    {alreadyPredicted ? (
                        isClosed ? (
                            <> <Activity size={16} className="animate-pulse" /> Open Bet </>
                        ) : (
                            <> <CheckCircle2 size={16} /> Prediction Placed </>
                        )
                    ) : isClosed ? (
                        "Prediction Closed" 
                    ) : (
                        <> Predict Score <ChevronRight size={16} /> </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Home;
