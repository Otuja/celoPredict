
# ⚽ CeloPredict

**The Mobile-First Prediction Market for Emerging Markets.**

![Celo Network](https://img.shields.io/badge/Network-Celo%20Sepolia-green)
![Status](https://img.shields.io/badge/Status-Hackathon%20Winning-orange)
![License](https://img.shields.io/badge/License-MIT-blue)
![PWA](https://img.shields.io/badge/PWA-MiniPay%20Ready-purple)

## 💡 The Pitch

Current betting platforms are centralized, opaque, and often inaccessible in emerging economies due to banking restrictions. **CeloPredict** solves this by bringing sports prediction on-chain, leveraging Celo's fast block times and low fees to create a transparent, trustless prediction market.

We built CeloPredict with a **"Mobile-First" philosophy**. It mimics the smooth UX of Web2 apps like *LiveScore* or *OneFootball*, but with the power of DeFi under the hood. It is designed to run seamlessly on low-bandwidth mobile devices and integrates directly with **Opera MiniPay**.

## 🚀 Key Features

### 1. 🧠 Smart Hybrid Wallet System (Innovation)
We solved the biggest UX hurdle in Web3: **Onboarding friction.**
*   **For Judges/Guests:** The app works *instantly* using a built-in "Dev Wallet". No install required.
*   **For Real Users:** Users can connect their own **MetaMask**, **Valora**, or **MiniPay** wallet to play with their own funds.
*   **For Admin:** The Admin Panel *always* uses the secure Owner Key in the background, ensuring demo presentations never fail due to "Not Owner" errors.

### 2. 📱 Native Mobile Experience
*   **PWA / MiniPay Ready**: Fully optimized `manifest.json` allows the app to be installed as a native app or run inside the Opera Mini crypto wallet.
*   **Glassmorphism UI**: High-end aesthetic with frosted glass effects, bottom navigation, and touch-optimized inputs.
*   **Social Viral Loops**: Integrated sharing features allow users to share their predictions on WhatsApp and Twitter/X directly from the app.

### 3. ⚡ Instant & Automated
*   **Gas-Less Feel**: Transactions are optimized for Celo's sub-second block times.
*   **Confetti Rewards**: Immediate visual feedback upon placing bets or claiming winnings.
*   **Auto-Settlement**: Winners are calculated automatically by the smart contract.

---

## 💻 Local Development / Installation

If you are a developer or judge cloning this repo to run locally, follow these steps:

### Prerequisites
*   Node.js (v18+)
*   npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/celo-predict.git
cd celo-predict
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
Create a `.env` file in the root directory. You can use the example provided:
```bash
cp .env.example .env
```
*Note: For the Hackathon Demo, the app includes a fallback "Dev Wallet" private key in the code so it works out-of-the-box. For production, ensure you set `VITE_IS_HACKATHON_MODE=false` in the .env file.*

### 4. Run the App
```bash
npm run dev
```
Open your browser to `http://localhost:5173`.

---

## 🎮 How to Demo (60-Second Walkthrough)

**Role: Judge / Admin**

1.  **Create a Match (Admin Tab)**:
    *   Go to the **Admin** tab. (You are auto-authenticated as Admin).
    *   Enter teams (e.g., "Real Madrid" vs "Barca").
    *   Click **+2 Min** to set the kickoff to 120 seconds from now.
    *   Click **Publish**.
2.  **Place a Bet (Home Tab)**:
    *   Go to **Home** and tap your new match.
    *   Enter a score (e.g., 2 - 1) and click **Place Bet**.
    *   *Note: You can bet using the built-in Dev Wallet OR connect your own wallet via the Wallet tab.*
3.  **Simulate Match End**:
    *   Wait 2 minutes for the match timer to hit 00:00.
    *   *Why? The contract forbids settling before the match starts.*
4.  **Settle Match (Admin Tab)**:
    *   Go back to **Admin** -> **Pending Results**.
    *   Wait for the "Ready to Settle" indicator.
    *   Enter the final score and click **Settle**.
5.  **Claim Winnings (Wallet Tab)**:
    *   Go to the **Wallet** tab.
    *   Click **Claim to Wallet** to withdraw your winnings.

---

## 🛠 Technical Architecture

*   **Frontend**: React 18, Tailwind CSS, Lucide Icons.
*   **Blockchain**: Celo Sepolia Testnet.
*   **Integration**: Ethers.js v6 with **Smart Signer Logic** (segregates Admin transactions from User transactions).
*   **Smart Contract**: Solidity (ERC20/Native logic) with platform fee withdrawal and emergency stops.

## 🔮 Future Roadmap

1.  **Chainlink Data Feeds**: Replace the Admin Oracle with **Chainlink Sports Data Feeds** for decentralized settlement.
2.  **cUSD Integration**: Transition from CELO to **cUSD** stablecoin to protect users from volatility.
3.  **Mainnet Launch**: Deploy to Celo Mainnet and list on the MiniPay dApp store.

---

## 🔗 Contract Details

*   **Network**: Celo Sepolia Testnet
*   **Chain ID**: `11142220`
*   **RPC URL**: `https://forno.celo-sepolia.celo-testnet.org`
*   **Contract Address**: `0x630fcEBE028f80C4420E5684ACab17b001ce4975`

---

*Built with 💚 for the Celo Hackathon.*
