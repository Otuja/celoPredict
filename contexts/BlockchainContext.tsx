
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUserBalance, getUserSigner, setWalletPreference } from '../services/blockchain';
import { ethers } from 'ethers';

interface BlockchainContextType {
  currentAccount: string | null;
  userBalance: string;
  isConnected: boolean;
  isConnecting: boolean;
  isDevWallet: boolean;
  connectWallet: (useReal?: boolean) => Promise<void>;
  refreshData: () => Promise<void>;
}

const BlockchainContext = createContext<BlockchainContextType>({} as BlockchainContextType);

export const BlockchainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [userBalance, setUserBalance] = useState<string>("0.00");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDevWallet, setIsDevWallet] = useState(true);

  const refreshData = useCallback(async () => {
    if (currentAccount) {
      const balance = await getUserBalance(currentAccount);
      setUserBalance(balance);
    }
  }, [currentAccount]);

  const connectWallet = async (useReal: boolean = false) => {
    setIsConnecting(true);
    try {
        // 1. Set Preference
        setWalletPreference(useReal);
        
        // 2. Get Signer (Will popup if useReal is true)
        const signer = await getUserSigner();
        const address = await signer.getAddress();
        
        // 3. Verify what we got
        const isBrowserSigner = signer.provider instanceof ethers.BrowserProvider;
        
        // If we asked for Real but got Dev (user rejected), update state
        const actuallyUsingReal = useReal && isBrowserSigner;
        
        setIsDevWallet(!actuallyUsingReal);
        setCurrentAccount(address);
        
        const balance = await getUserBalance(address);
        setUserBalance(balance);
    } catch (error) {
        console.error("Failed to connect wallet", error);
        // Fallback to dev if explicit connection failed
        if (useReal) connectWallet(false);
    } finally {
        setIsConnecting(false);
    }
  };

  // Auto-connect on mount (Silent Dev Mode)
  useEffect(() => {
    connectWallet(false);
  }, []);

  // Listen for account changes (Only relevant for Real Wallets)
  useEffect(() => {
     // @ts-ignore
     if (window.ethereum && !isDevWallet) {
         // @ts-ignore
         window.ethereum.on('accountsChanged', (accounts: string[]) => {
             if (accounts.length > 0) {
                 setCurrentAccount(accounts[0]);
                 refreshData();
             } else {
                 connectWallet(false); // Fallback to dev
             }
         });
         
         // @ts-ignore
         window.ethereum.on('chainChanged', () => {
             window.location.reload();
         });
     }
  }, [isDevWallet, refreshData]);

  // Polling
  useEffect(() => {
    if(!currentAccount) return;
    const interval = setInterval(() => refreshData(), 5000);
    return () => clearInterval(interval);
  }, [currentAccount, refreshData]);

  return (
    <BlockchainContext.Provider value={{
      currentAccount,
      userBalance,
      isConnected: !!currentAccount,
      isConnecting,
      isDevWallet,
      connectWallet,
      refreshData
    }}>
      {children}
    </BlockchainContext.Provider>
  );
};

export const useBlockchain = () => useContext(BlockchainContext);
