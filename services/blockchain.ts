
import { ethers } from 'ethers';
import { CONTRACT_ABI, CONTRACT_ADDRESS, RPC_URL, HACKATHON_PRIVATE_KEY } from '../constants';

// Global Provider for Read-Only access
const jsonProvider = new ethers.JsonRpcProvider(RPC_URL);

// --- 1. ADMIN SIGNER (ALWAYS PRIVATE KEY) ---
// This ensures Admin actions (Create, Settle) never fail,
// even if the user has connected a non-admin personal wallet.
export const getAdminSigner = () => {
    if (!HACKATHON_PRIVATE_KEY) throw new Error("No Admin Private Key found.");
    return new ethers.Wallet(HACKATHON_PRIVATE_KEY, jsonProvider);
};

// --- 2. USER SIGNER (HYBRID) ---
// Used for Betting and Claiming.
// Priority: Browser Wallet (MetaMask/MiniPay/Valora) -> Fallback: Dev Wallet (Private Key)
export const getUserSigner = async () => {
    // @ts-ignore
    const injectedProvider = window.ethereum || window.celo;

    // A. Try Browser Wallet (Real User)
    if (injectedProvider) {
        try {
            // Request account access
            const provider = new ethers.BrowserProvider(injectedProvider);
            // This triggers the popup in MetaMask/MiniPay
            const signer = await provider.getSigner(); 
            return signer;
        } catch (e) {
            console.warn("Browser wallet connection failed or rejected. Falling back to Dev Wallet.");
        }
    }

    // B. Fallback to Dev Wallet (Guest/Judge Mode)
    // If no wallet is installed, or user rejected connection, use the dev key
    return getAdminSigner();
};

// --- CONTRACT HELPERS ---

// getContract(true) -> Forces Admin Key (Create Match, Settle)
// getContract(false) -> Tries User Wallet first (Bet, Claim)
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
