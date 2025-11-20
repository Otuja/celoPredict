
import React from 'react';
import { Wallet as WalletIcon, Award, Users, ExternalLink, Zap } from 'lucide-react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { formatCurrency } from '../services/blockchain';

interface WalletProps {
  userWinnings: string;
  onClaim: () => void;
}

const Wallet: React.FC<WalletProps> = ({ userWinnings, onClaim }) => {
  const { isConnected, currentAccount, userBalance, connectWallet, isConnecting } = useBlockchain();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 pt-8 pb-32">
      <h2 className="text-2xl font-bold text-white mb-6">My Wallet</h2>
      
      {!isConnected ? (
        <div className="bg-[#1A1A1A] rounded-3xl p-8 text-center border border-white/5">
           <WalletIcon size={48} className="mx-auto text-gray-600 mb-4" />
           <p className="text-gray-400 mb-6">Connecting to Celo Network...</p>
           <button 
             onClick={() => connectWallet()}
             disabled={isConnecting}
             className="w-full py-4 bg-celo-green text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50"
           >
             {isConnecting ? "Connecting..." : "Retry Connection"}
           </button>
        </div>
      ) : (
        <div className="space-y-4">
           {/* Balance Card */}
           <div className={`rounded-3xl p-6 text-black relative overflow-hidden shadow-lg bg-gradient-to-br from-celo-green to-emerald-800 shadow-celo-green/20`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <div className="text-sm font-bold opacity-70 mb-1">Total Balance</div>
                    <div className="text-[10px] font-bold bg-black/20 px-2 py-1 rounded text-white flex items-center gap-1">
                        <Zap size={10} className="text-celo-gold" /> DEV WALLET
                    </div>
                </div>
                <div className="text-4xl font-bold tracking-tight mb-4">{parseFloat(userBalance).toFixed(2)} <span className="text-lg">CELO</span></div>
                <div className="flex items-center gap-2 text-xs font-medium bg-black/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                  <div className={`w-2 h-2 rounded-full animate-pulse bg-green-900`}></div>
                  Celo Sepolia Testnet
                </div>
              </div>
           </div>

           {/* Winnings Card */}
           <div className="bg-[#1A1A1A] rounded-3xl p-6 border border-gray-800">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-full bg-celo-gold/20 flex items-center justify-center text-celo-gold">
                    <Award size={20} />
                 </div>
                 <div>
                    <div className="text-gray-400 text-xs font-medium">Unclaimed Winnings</div>
                    <div className="text-white font-bold text-xl">{formatCurrency(userWinnings)} CELO</div>
                 </div>
              </div>
              
              <button 
                onClick={onClaim}
                disabled={Number(userWinnings) <= 0}
                className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
              >
                {Number(userWinnings) > 0 ? "Claim to Wallet" : "No Winnings to Claim"}
              </button>
           </div>

           {/* Address */}
           <div className="bg-[#121212] rounded-2xl p-4 flex items-center justify-between border border-gray-800">
              <span className="text-gray-500 text-sm">Account</span>
              <span className="text-gray-300 text-xs font-mono bg-gray-900 px-2 py-1 rounded flex items-center gap-2">
                {currentAccount?.slice(0,6)}...{currentAccount?.slice(-4)}
                <button onClick={() => {navigator.clipboard.writeText(currentAccount || ""); alert("Copied!")}}>
                  <Users size={12} className="text-gray-500 hover:text-white" />
                </button>
              </span>
           </div>

           {/* Faucet Link */}
           <a 
             href="https://faucet.celo.org/" 
             target="_blank" 
             rel="noreferrer"
             className="block bg-[#1A1A1A] rounded-2xl p-4 border border-gray-800 hover:bg-gray-800 transition-colors"
           >
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
                        <ExternalLink size={14} className="text-celo-green" />
                     </div>
                     <div className="text-sm text-gray-300">Need Testnet Funds?</div>
                  </div>
                  <div className="text-xs font-bold text-celo-green">Go to Faucet &rarr;</div>
              </div>
           </a>
        </div>
      )}
    </div>
  );
};

export default Wallet;
