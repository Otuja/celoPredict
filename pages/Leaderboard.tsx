
import React from 'react';
import { Match, Prediction } from '../types';

interface LeaderboardProps {
  myPredictions: {matchId: string, prediction: Prediction, matchData: Match}[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ myPredictions }) => {
  const perfectWins = myPredictions.filter(p => 
    p.matchData.prizesDistributed && 
    p.prediction.homeScore === p.matchData.finalHomeScore && 
    p.prediction.awayScore === p.matchData.finalAwayScore
  ).length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 pt-8 pb-32">
      <h2 className="text-2xl font-bold text-white mb-6">Leaderboard</h2>
      
      <div className="bg-[#1A1A1A] rounded-3xl p-6 border border-white/5 mb-6">
         <h3 className="text-gray-400 text-sm font-medium mb-4 uppercase tracking-wider">Your Stats</h3>
         <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#121212] p-4 rounded-2xl border border-gray-800">
               <div className="text-2xl font-bold text-white mb-1">{myPredictions.length}</div>
               <div className="text-xs text-gray-500">Total Predictions</div>
            </div>
            <div className="bg-[#121212] p-4 rounded-2xl border border-gray-800">
               <div className="text-2xl font-bold text-celo-gold mb-1">
                 {perfectWins}
               </div>
               <div className="text-xs text-gray-500">Perfect Wins</div>
            </div>
         </div>
      </div>

      <div className="bg-[#1A1A1A] rounded-3xl p-6 border border-white/5">
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-white font-bold">Top Players</h3>
           <span className="text-xs text-gray-500">This Season</span>
        </div>
        {/* Mock List for Hackathon Demo - In a real app this would come from the contract event logs */}
        <div className="space-y-4">
           {[1,2,3].map((i) => (
             <div key={i} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i===1 ? 'bg-celo-gold text-black' : 'bg-gray-800 text-gray-400'}`}>
                  {i}
                </div>
                <div className="flex-1">
                   <div className="h-2 w-24 bg-gray-800 rounded-full mb-1.5" />
                   <div className="h-2 w-16 bg-gray-800/50 rounded-full" />
                </div>
                <div className="text-right">
                   <div className="text-celo-green text-sm font-bold">--- CELO</div>
                </div>
             </div>
           ))}
           <p className="text-center text-xs text-gray-600 pt-4">Leaderboard updates daily</p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
