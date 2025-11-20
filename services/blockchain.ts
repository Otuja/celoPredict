
import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS, RPC_URL, HACKATHON_PRIVATE_KEY } from '../constants';

// Global Provider for Read-Only access
const jsonProvider = new ethers.JsonRpcProvider(RPC_URL);

// State to track if user explicitly wants to use real wallet
let useRealWallet = false;

export const setWalletPreference = (enable: boolean) => {
    useRealWallet = enable;
};

// --- 1. ADMIN SIGNER (ALWAYS PRIVATE KEY) ---
// This ensures Admin actions (Create, Settle) never fail
export const getAdminSigner = () => {
    if (!HACKATHON_PRIVATE_KEY) throw new Error("No Admin Private Key found.");
    return new ethers.Wallet(HACKATHON_PRIVATE_KEY, jsonProvider);
};

// --- 2. USER SIGNER (HYBRID) ---
export const getUserSigner = async () => {
    // @ts-ignore
    const injectedProvider = window.ethereum || window.celo;

    // Only try browser wallet if user EXPLICITLY requested it AND it exists
    if (useRealWallet && injectedProvider) {
        try {
            const provider = new ethers.BrowserProvider(injectedProvider);
            const signer = await provider.getSigner(); 
            return signer;
        } catch (e) {
            console.warn("Browser wallet connection failed. Falling back to Dev Wallet.");
            useRealWallet = false; // Reset preference on failure
        }
    }

    // Default: Dev Wallet (Silent, no popup)
    return getAdminSigner();
};

// --- CONTRACT HELPERS ---
export const getContract = async (asAdmin: boolean = false) => {
  const signer = asAdmin ? getAdminSigner() : await getUserSigner();
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
};

export const getReadOnlyContract = () => {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, jsonProvider);
};

export const getUserBalance = async (address: string) => {
    try {
        const balance = await jsonProvider.getBalance(address);
        return ethers.formatEther(balance);
    } catch (e) {
        console.error("Error fetching balance", e);
        return "0.0";
    }
};

export const getContractBalance = async () => {
    try {
        const balance = await jsonProvider.getBalance(CONTRACT_ADDRESS);
        return ethers.formatEther(balance);
    } catch (e) {
        console.error("Error fetching contract balance", e);
        return "0.0";
    }
}

export const formatTimestamp = (timestamp: string | number) => {
  const date = new Date(Number(timestamp) * 1000);
  const now = new Date();
  const diff = Number(timestamp) * 1000 - now.getTime();
  
  if (diff > 0 && diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 0) return `Starts in ${hours}h ${minutes}m`;
      return `Starts in ${minutes}m`;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatCurrency = (wei: string) => {
  try {
    return parseFloat(ethers.formatEther(wei)).toFixed(2);
  } catch (e) {
    return "0.00";
  }
};
