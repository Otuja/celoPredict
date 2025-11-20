
// ==========================================
// CELOPREDICT - HACKATHON CONFIGURATION
// ==========================================

// ⚠️ SECURITY WARNING: 
// We are hardcoding the PRIVATE KEY here to ensure the Hackathon Demo works 
// perfectly without environment variable issues in the web preview.
// DO NOT commit this file with the real private key to a public GitHub repo 
// unless you intend to burn this wallet.

// 1. FORCE HACKATHON MODE (Bypasses MetaMask/Valora)
// set to TRUE for the Hackathon Demo so it works on all devices immediately
export const IS_HACKATHON_MODE = true;

// 2. YOUR PRIVATE KEY (Corresponds to 0x9af1...)
export const HACKATHON_PRIVATE_KEY = "5aa942a429572831ec4895a85a6c62225835a7edd97a961432a9968ec1b641e6";

// 3. SMART CONTRACT ADDRESS
export const CONTRACT_ADDRESS = "0x630fcEBE028f80C4420E5684ACab17b001ce4975";

// 4. ADMIN WALLET ADDRESS
export const ADMIN_ADDRESS = "0x9af10ad426d5d807f3309e1a3ca321332e2f54a5";

// ==========================================
// NETWORK CONFIGURATION
// ==========================================

export const CELO_CHAIN_ID = 11142220; 
export const RPC_URL = "https://forno.celo-sepolia.celo-testnet.org";
export const BLOCK_EXPLORER = "https://celo-sepolia.blockscout.com";

export const ENTRY_FEE_DISPLAY = "0.5 CELO";

// ==========================================
// CONTRACT ABI
// ==========================================
export const CONTRACT_ABI = [
  // Write functions
  "function createMatch(string _homeTeam, string _awayTeam, uint256 _kickoffTime) external",
  "function predictMatch(uint256 _matchId, uint8 _homeScore, uint8 _awayScore) external payable",
  "function submitResult(uint256 _matchId, uint8 _homeScore, uint8 _awayScore) external",
  "function claimWinnings() external",
  "function withdrawPlatformFees() external",
  
  // Read functions
  "function matches(uint256) external view returns (uint256 id, string homeTeam, string awayTeam, uint256 kickoffTime, uint256 prizePool, bool resultsSubmitted, uint8 finalHomeScore, uint8 finalAwayScore, bool prizesDistributed)",
  "function getActiveMatches() external view returns (tuple(uint256 id, string homeTeam, string awayTeam, uint256 kickoffTime, uint256 prizePool, bool resultsSubmitted, uint8 finalHomeScore, uint8 finalAwayScore, bool prizesDistributed)[])",
  "function getUserPredictions(address _user) external view returns (uint256[] memory matchIds, tuple(address predictor, uint8 homeScore, uint8 awayScore, uint256 amount, uint256 timestamp)[] memory predictions)",
  "function getMatch(uint256 _matchId) external view returns (tuple(uint256 id, string homeTeam, string awayTeam, uint256 kickoffTime, uint256 prizePool, bool resultsSubmitted, uint8 finalHomeScore, uint8 finalAwayScore, bool prizesDistributed))",
  "function getMatchPredictions(uint256 _matchId) external view returns (tuple(address predictor, uint8 homeScore, uint8 awayScore, uint256 amount, uint256 timestamp)[])",
  "function userWinnings(address) external view returns (uint256)",
  "function owner() external view returns (address)",
  
  // Events
  "event MatchCreated(uint256 indexed matchId, string homeTeam, string awayTeam, uint256 kickoffTime)",
  "event PredictionPlaced(uint256 indexed matchId, address indexed predictor, uint8 homeScore, uint8 awayScore, uint256 amount)",
  "event ResultsSubmitted(uint256 indexed matchId, uint8 homeScore, uint8 awayScore)",
  "event WinningsClaimed(address indexed user, uint256 amount)"
];
