import React from 'react';
import { PageView, Match, Prediction } from '../types';
import { formatTimestamp } from '../services/blockchain';
import { useBlockchain } from '../contexts/BlockchainContext';
import { Share2, Copy } from 'lucide-react';

interface MyBetsProps {
  myPredictions: {matchId: string, prediction: Prediction, matchData: Match}[];
  onNavigateHome: () => void;
}

const MyBets: React.FC<MyBetsProps> = ({ myPredictions, onNavigateHome }) => {
  const { isConnected } = useBlockchain();

  const handleShare = async (match: Match, prediction: Prediction) => {
      const text = `⚽ I predicted ${match.homeTeam} ${prediction.homeScore}-${prediction.awayScore} ${match.awayTeam} on CeloPredict! Can you beat my score? #Celo #CryptoBetting`;
      
      if (navigator.share) {
          try {
              await navigator.share({
                  title: 'CeloPredict Prediction',
                  text: text,
                  url: window.location.href
              });
          } catch (err) {
              console.log('Error sharing', err);
          }
      } else {
          navigator.clipboard.writeText(text);
          alert("Prediction copied to clipboard!");
      }
  };

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
         <div className="space-y-4">
           {myPredictions.map((item, idx) => {
              const isFinished = item.matchData.resultsSubmitted;
              const isWinner = isFinished && 
                               item.prediction.homeScore === item.matchData.finalHomeScore && 
                               item.prediction.awayScore === item.matchData.finalAwayScore;
              return (
                <div key={idx} className="bg-[#1A1A1A] border border-gray-800 rounded-3xl p-5 flex flex-col gap-4 relative overflow-hidden">
                   {/* Background accent */}
                   {isWinner && <div className="absolute top-0 right-0 w-24 h-24 bg-celo-gold/10 rounded-full blur-xl -mr-8 -mt-8 pointer-events-none"></div>}

                   <div className="flex justify-between items-start relative z-10">
                      <div className="flex items-center gap-2">
                         <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${isFinished ? 'bg-gray-800 text-gray-400' : 'bg-green-900/30 text-celo-green border border-green-900/50'}`}>
                            {isFinished ? "Settled" : "Open"}
                         </span>
                         <span className="text-xs text-gray-500 font-medium">{formatTimestamp(item.prediction.timestamp)}</span>
                      </div>
                      {isFinished && (
                         <div className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${isWinner ? 'text-celo-gold bg-yellow-900/10 border-yellow-900/30' : 'text-red-400 bg-red-900/10 border-red-900/30'}`}>
                            {isWinner ? "WON" : "LOST"}
                         </div>
                      )}
                   </div>

                   <div className="flex justify-between items-center px-1">
                      <div className="text-sm font-bold text-white truncate max-w-[40%]">{item.matchData.homeTeam}</div>
                      <div className="text-[10px] font-black text-gray-600 bg-gray-900 px-2 py-1 rounded-full">VS</div>
                      <div className="text-sm font-bold text-white truncate max-w-[40%] text-right">{item.matchData.awayTeam}</div>
                   </div>

                   <div className="bg-[#121212] rounded-2xl p-4 flex justify-between items-center border border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">Your Pick</span>
                        <div className="font-mono font-bold text-xl text-white tracking-widest">
                            {item.prediction.homeScore} - {item.prediction.awayScore}
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleShare(item.matchData, item.prediction)}
                        className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
                      >
                        <Share2 size={18} />
                      </button>
                   </div>
                   
                   {isFinished && (
                     <div className="flex justify-center text-xs font-medium text-gray-500 bg-gray-900/50 py-2 rounded-xl">
                        Official Result: <span className="text-white ml-2">{item.matchData.finalHomeScore} - {item.matchData.finalAwayScore}</span>
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