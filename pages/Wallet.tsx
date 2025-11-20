
import React from 'react';
import { Wallet as WalletIcon, Award, Users, ExternalLink, Zap, RefreshCw, Smartphone } from 'lucide-react';
import { useBlockchain } from '../contexts/BlockchainContext';
import { formatCurrency, isMiniPay } from '../services/blockchain';

interface WalletProps {
  userWinnings: string;
  onClaim: () => void;
}

const Wallet: React.FC<WalletProps> = ({ userWinnings, onClaim }) => {
  const { isConnected, currentAccount, userBalance, connectWallet, isConnecting, refreshData, isDevWallet } = useBlockchain();

  const isMiniPayActive = isMiniPay();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4 pt-8 pb-32">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">My Wallet</h2>
        <button 
            onClick={() => refreshData()} 
            className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 active:rotate-180 transition-all"
        >
            <RefreshCw size={18} />
        </button>
      </div>
      
      {!isConnected ? (
        <div className="bg-[#1A1A1A] rounded-3xl p-8 text-center border border-white/5">
           <WalletIcon size={48} className="mx-auto text-gray-600 mb-4" />
           <p className="text-gray-400 mb-6">Connecting to Celo Network...</p>
           <button 
             onClick={() => connectWallet(false)}
             disabled={isConnecting}
             className="w-full py-4 bg-celo-green text-black font-bold rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50"
           >
             Retry Connection
           </button>
        </div>
      ) : (
        <div className="space-y-4">
           {/* Balance Card */}
           <div className={`rounded-3xl p-6 text-black relative overflow-hidden shadow-lg ${isDevWallet ? 'bg-gradient-to-br from-celo-gold to-orange-600' : 'bg-gradient-to-br from-celo-green to-emerald-800'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start">
                    <div className="text-sm font-bold opacity-70 mb-1">Total Balance</div>
                    <div className="text-[10px] font-bold bg-black/20 px-2 py-1 rounded text-white flex items-center gap-1">
                        {isDevWallet ? (
                            <><Zap size={10} className="text-yellow-300" /> DEV WALLET</>
                        ) : isMiniPayActive ? (
                            <><Smartphone size={10} /> MINIPAY</>
                        ) : (
                            <><Smartphone size={10} /> PERSONAL WALLET</>
                        )}
                    </div>
                </div>
                <div className="text-4xl font-bold tracking-tight mb-4">{parseFloat(userBalance).toFixed(2)} <span className="text-lg">CELO</span></div>
                <div className="flex items-center gap-2 text-xs font-medium bg-black/10 w-fit px-3 py-1 rounded-full backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full animate-pulse bg-white"></div>
                  Celo Sepolia Testnet
                </div>
              </div>
           </div>
           
           {/* Switch Wallet Button */}
           {!isMiniPayActive && (
               isDevWallet ? (
                   <button 
                     onClick={() => connectWallet(true)}
                     className="w-full py-3 bg-[#1A1A1A] border border-celo-green/30 text-celo-green font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-celo-green/10 transition-all"
                   >
                      <Smartphone size={18} /> Connect Personal Wallet
                   </button>
               ) : (
                   <button 
                     onClick={() => connectWallet(false)}
                     className="w-full py-3 bg-[#1A1A1A] border border-gray-700 text-gray-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-all"
                   >
                      <Zap size={18} /> Switch to Dev Wallet
                   </button>
               )
           )}
           {isMiniPayActive && (
               <div className="w-full py-3 bg-gray-900 border border-gray-800 text-gray-500 font-bold rounded-xl flex items-center justify-center gap-2">
                   <Smartphone size={18} /> Connected with MiniPay
               </div>
           )}

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
        </div>
      )}
    </div>
  );
};

export default Wallet;
