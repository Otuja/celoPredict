
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserBalance, getSigner } from '../services/blockchain';

interface BlockchainContextType {
  currentAccount: string | null;
  userBalance: string;
  isConnected: boolean;
  isConnecting: boolean;
  isDemoMode: boolean;
  connectWallet: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const BlockchainContext = createContext<BlockchainContextType>({} as BlockchainContextType);

export const BlockchainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<string>("0.00");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(true);

  const refreshData = useCallback(async () => {
    if (currentAccount) {
      const balance = await getUserBalance(currentAccount);
      setUserBalance(balance);
    }
  }, [currentAccount]);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
        // Always use Hackathon Mode logic (Private Key)
        // This ensures stability for the demo
        setIsDemoMode(true);
        const signer = await getSigner();
        const address = await signer.getAddress();
        setCurrentAccount(address);
        const balance = await getUserBalance(address);
        setUserBalance(balance);
    } catch (error) {
        console.error("Failed to connect wallet", error);
    } finally {
        setIsConnecting(false);
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    connectWallet();
  }, []);

  // Polling for balance updates
  useEffect(() => {
    if(!currentAccount) return;
    const interval = setInterval(() => {
        refreshData();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentAccount, refreshData]);

  return (
    <BlockchainContext.Provider value={{
      currentAccount,
      userBalance,
      isConnected: !!currentAccount,
      isConnecting,
      isDemoMode,
      connectWallet,
      refreshData
    }}>
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = () => useContext(BlockchainContext);
