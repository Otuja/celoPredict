
import React, { useEffect, useState } from 'react';
import { Match, Prediction } from '../types';
import { getGlobalLeaderboard, LeaderboardEntry } from '../services/blockchain';
import { useBlockchain } from '../contexts/BlockchainContext';
import { Trophy, Medal, Crown, Loader2, RefreshCw } from 'lucide-react';

interface LeaderboardProps {
  myPredictions: {matchId: string, prediction: Prediction, matchData: Match}[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ myPredictions }) => {
  const { currentAccount } = useBlockchain();
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = async () => {
      setIsLoading(true);
      const data = await getGlobalLeaderboard();
      setLeaders(data);
      setIsLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  // Calculate local stats for "Your Stats" card
  const perfectWins = myPredictions.filter(p => 
    p.matchData.prizesDistributed && 
    p.prediction.homeScore === p.matchData.finalHomeScore && 
    p.prediction.awayScore === p.matchData.finalAwayScore
  ).length;

  const getRankIcon = (index: number) => {
      if (index === 0) return <Crown size={20} className="text-yellow-400 fill-yellow-400" />;
      if (index === 1) return <Medal size={20} className="text-gray-300 fill-gray-300" />;
      if (index === 2) return <Medal size={20} className="text-amber-600 fill-amber-600" />;
      return <span className="font-bold text-gray-500 text-sm">#{index + 1}</span>;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 pt-8 pb-32">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Leaderboard</h2>
        <button 
            onClick={fetchLeaderboard} 
            className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 active:rotate-180 transition-all"
        >
            <RefreshCw size={18} />
        </button>
      </div>
      
      {/* Personal Stats Card */}
      <div className="bg-[#1A1A1A] rounded-3xl p-6 border border-white/5 mb-6 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-32 h-32 bg-celo-green/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
         <h3 className="text-gray-400 text-xs font-bold mb-4 uppercase tracking-wider flex items-center gap-2">
            <Trophy size={14} className="text-celo-gold" /> Your Season Stats
         </h3>
         <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="bg-[#121212] p-4 rounded-2xl border border-gray-800 shadow-inner">
               <div className="text-3xl font-bold text-white mb-1 tracking-tight">{myPredictions.length}</div>
               <div className="text-[10px] uppercase font-bold text-gray-600">Predictions</div>
            </div>
            <div className="bg-[#121212] p-4 rounded-2xl border border-gray-800 shadow-inner">
               <div className="text-3xl font-bold text-celo-gold mb-1 tracking-tight">
                 {perfectWins}
               </div>
               <div className="text-[10px] uppercase font-bold text-gray-600">Perfect Wins</div>
            </div>
         </div>
      </div>

      {/* Global Leaderboard */}
      <div className="bg-[#1A1A1A] rounded-3xl p-6 border border-white/5 min-h-[300px]">
        <div className="flex items-center justify-between mb-6">
           <h3 className="text-white font-bold text-lg">Top Predictors</h3>
           <span className="text-[10px] font-bold bg-gray-800 px-2 py-1 rounded text-gray-400">LIVE</span>
        </div>
        
        {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-500">
                <Loader2 size={32} className="animate-spin text-celo-green" />
                <span className="text-xs">Crunching blockchain data...</span>
            </div>
        ) : leaders.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
                No winners yet. Be the first!
            </div>
        ) : (
            <div className="space-y-3">
            {leaders.map((player, i) => {
                const isMe = currentAccount && player.address.toLowerCase() === currentAccount.toLowerCase();
                
                return (
                    <div 
                        key={player.address} 
                        className={`flex items-center gap-4 p-3 rounded-2xl border transition-all
                            ${isMe ? 'bg-celo-green/10 border-celo-green/30' : 'bg-[#121212] border-gray-800 hover:border-gray-700'}
                        `}
                    >
                        <div className="w-8 flex justify-center shrink-0">
                            {getRankIcon(i)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <div className="text-sm font-bold text-white truncate font-mono">
                                    {isMe ? 'YOU' : `${player.address.slice(0, 6)}...${player.address.slice(-4)}`}
                                </div>
                                {isMe && <span className="w-2 h-2 bg-celo-green rounded-full animate-pulse" />}
                            </div>
                            <div className="text-[10px] text-gray-500 font-medium">
                                {player.wins} Wins • {player.totalPredictions} Bets
                            </div>
                        </div>
                        
                        <div className="text-right shrink-0">
                            <div className="text-celo-gold text-sm font-bold">
                                {player.totalWinnings.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-gray-600 font-bold">CELO</div>
                        </div>
                    </div>
                );
            })}
            </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
