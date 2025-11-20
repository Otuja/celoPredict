
import React from 'react';
import { Home, ListChecks, Wallet, TrendingUp, Shield } from 'lucide-react';
import { PageView } from '../types';

interface BottomNavProps {
  activePage: PageView;
  setActivePage: (page: PageView) => void;
  hasUnclaimed: boolean;
}

const BottomNav: React.FC<BottomNavProps> = ({ activePage, setActivePage, hasUnclaimed }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#121212] border-t border-white/10 h-[80px] pb-4 px-2 flex justify-around items-center safe-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
      <button 
        onClick={() => setActivePage(PageView.HOME)}
        className={`flex flex-col items-center gap-1 w-16 transition-all ${activePage === PageView.HOME ? 'text-celo-green' : 'text-gray-500'}`}
      >
        <Home size={22} strokeWidth={activePage === PageView.HOME ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Home</span>
      </button>

      <button 
        onClick={() => setActivePage(PageView.MY_BETS)}
        className={`flex flex-col items-center gap-1 w-16 transition-all ${activePage === PageView.MY_BETS ? 'text-celo-green' : 'text-gray-500'}`}
      >
        <ListChecks size={22} strokeWidth={activePage === PageView.MY_BETS ? 2.5 : 2} />
        <span className="text-[10px] font-medium">My Bets</span>
      </button>

      <button 
        onClick={() => setActivePage(PageView.WALLET)}
        className={`flex flex-col items-center gap-1 w-16 transition-all ${activePage === PageView.WALLET ? 'text-celo-green' : 'text-gray-500'}`}
      >
        <div className="relative">
           <Wallet size={22} strokeWidth={activePage === PageView.WALLET ? 2.5 : 2} />
           {hasUnclaimed && <div className="absolute -top-1 -right-1 w-2 h-2 bg-celo-gold rounded-full border border-black animate-pulse" />}
        </div>
        <span className="text-[10px] font-medium">Wallet</span>
      </button>
      
      <button 
        onClick={() => setActivePage(PageView.LEADERBOARD)}
        className={`flex flex-col items-center gap-1 w-16 transition-all ${activePage === PageView.LEADERBOARD ? 'text-celo-green' : 'text-gray-500'}`}
      >
        <TrendingUp size={22} strokeWidth={activePage === PageView.LEADERBOARD ? 2.5 : 2} />
        <span className="text-[10px] font-medium">Rank</span>
      </button>

      <button 
        onClick={() => setActivePage(PageView.ADMIN)}
        className={`flex flex-col items-center gap-1 w-16 transition-all ${activePage === PageView.ADMIN ? 'text-celo-green' : 'text-gray-500'}`}
      >
        <Shield size={22} />
        <span className="text-[10px] font-medium">Admin</span>
      </button>
    </div>
  );
};

export default BottomNav;
