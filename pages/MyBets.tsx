
import React from 'react';
import { PageView, Match, Prediction } from '../types';
import { formatTimestamp } from '../services/blockchain';
import { useBlockchain } from '../contexts/BlockchainContext';

interface MyBetsProps {
  myPredictions: {matchId: string, prediction: Prediction, matchData: Match}[];
  onNavigateHome: () => void;
}

const MyBets: React.FC<MyBetsProps> = ({ myPredictions, onNavigateHome }) => {
  const { isConnected } = useBlockchain();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 pt-8 pb-32">
       <h2 className="text-2xl font-bold text-white mb-6">Prediction History</h2>
       
       {!isConnected ? (
         <div className="text-center text-gray-500 py-10">Connect wallet to see your history.</div>
       ) : myPredictions.length === 0 ? (
         <div className="bg-[#1A1A1A] rounded-3xl p-8 text-center border border-dashed border-gray-800">
           <p className="text-gray-400">You haven't made any predictions yet.</p>
           <button onClick={onNavigateHome} className="text-celo-green text-sm font-bold mt-4">Find a Match</button>
         </div>
       ) : (
         <div className="space-y-3">
           {myPredictions.map((item, idx) => {
              const isFinished = item.matchData.resultsSubmitted;
              const isWinner = isFinished && 
                               item.prediction.homeScore === item.matchData.finalHomeScore && 
                               item.prediction.awayScore === item.matchData.finalAwayScore;
              return (
                <div key={idx} className="bg-[#1A1A1A] border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
                   <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                         <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${isFinished ? 'bg-gray-800 text-gray-400' : 'bg-green-900/30 text-celo-green border border-green-900'}`}>
                            {isFinished ? "Settled" : "Open"}
                         </span>
                         <span className="text-xs text-gray-500">{formatTimestamp(item.prediction.timestamp)}</span>
                      </div>
                      {isFinished && (
                         <div className={`text-xs font-bold px-2 py-1 rounded ${isWinner ? 'text-celo-gold bg-yellow-900/20' : 'text-red-400 bg-red-900/10'}`}>
                            {isWinner ? "WON" : "LOST"}
                         </div>
                      )}
                   </div>

                   <div className="flex justify-between items-center px-2">
                      <div className="text-sm font-medium text-gray-300">{item.matchData.homeTeam}</div>
                      <div className="text-xs font-bold text-gray-600">vs</div>
                      <div className="text-sm font-medium text-gray-300">{item.matchData.awayTeam}</div>
                   </div>

                   <div className="bg-[#121212] rounded-xl p-3 flex justify-between items-center">
                      <div className="text-xs text-gray-500">Your Prediction</div>
                      <div className="font-mono font-bold text-lg text-white tracking-widest">
                        {item.prediction.homeScore} - {item.prediction.awayScore}
                      </div>
                   </div>
                   
                   {isFinished && (
                     <div className="flex justify-end text-xs text-gray-500">
                        Final Score: {item.matchData.finalHomeScore} - {item.matchData.finalAwayScore}
                     </div>
                   )}
                </div>
              );
           })}
         </div>
       )}
    </div>
  );
};

export default MyBets;
