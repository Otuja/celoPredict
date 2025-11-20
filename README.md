
# ⚽ CeloPredict

**CeloPredict** is a mobile-first, decentralized soccer prediction market built on the **Celo Blockchain**. Users can predict exact match scores using native CELO tokens, compete on leaderboards, and win from the prize pool if their predictions are correct.

![Celo Network](https://img.shields.io/badge/Network-Celo%20Sepolia-green)
![Status](https://img.shields.io/badge/Status-Hackathon%20Demo-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🚀 Key Features

*   **Mobile-First Design**: A native-app-like experience with bottom navigation, touch-friendly inputs, and smooth transitions.
*   **On-Chain Betting**: All predictions, prize pools, and settlements happen on the Celo smart contract.
*   **Exact Score Prediction**: Users predict home and away scores (e.g., 2-1).
*   **Automated Settlements**: Admin oracle settles matches, and the smart contract calculates winners automatically.
*   **Instant Payouts**: Winners claim their share of the pot directly to their wallet.

## 📱 Hackathon Demo Mode

**⚠️ IMPORTANT FOR JUDGES & TESTERS**

To ensure a smooth testing experience without requiring MetaMask installation or configuration, this app is currently running in **Hackathon Mode**.

1.  **Auto-Login**: The app automatically connects using a pre-funded Testnet Admin Wallet.
2.  **Auto-Signing**: Transactions (Betting, Creating Matches) are signed automatically in the background.
3.  **Full Admin Access**: You have immediate access to the **Admin Panel** to Create Matches and Settle Results for demo purposes.

*To disable this for production, set `IS_HACKATHON_MODE = false` in `constants.ts`.*

## 🛠 Tech Stack

*   **Frontend**: React 18, Tailwind CSS, Lucide Icons.
*   **Blockchain**: Celo Sepolia Testnet.
*   **Integration**: Ethers.js v6.
*   **Smart Contract**: Solidity (ERC20/Native logic).

## 🔗 Contract Details

*   **Network**: Celo Sepolia Testnet
*   **Chain ID**: `11142220`
*   **RPC URL**: `https://forno.celo-sepolia.celo-testnet.org`
*   **Contract Address**: `0x630fcEBE028f80C4420E5684ACab17b001ce4975`

## 🏃‍♂️ How to Run Locally

1.  **Clone the repository**
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run the development server**:
    ```bash
    npm start
    ```
4.  Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 🎮 How to Demo (Walkthrough)

1.  **Create a Match (Admin)**:
    *   Go to the **Admin** tab.
    *   Enter "Real Madrid" vs "Barcelona".
    *   Click **+2 Min** to set a quick kickoff time.
    *   Click **Publish**.
2.  **Place a Bet**:
    *   Go to **Home**.
    *   Tap the new match.
    *   Enter a score (e.g., 2 - 1) and click **Place Bet**.
3.  **Simulate Match End**:
    *   Wait 2 minutes for the match time to pass.
4.  **Settle Match (Admin)**:
    *   Go back to **Admin**.
    *   Enter the final score in the "Pending Results" section.
    *   Click **Settle**.
5.  **Claim Winnings**:
    *   If you guessed correctly, go to the **Wallet** tab and click **Claim**.

## 📂 Project Structure

*   `/contracts`: Solidity smart contract source code.
*   `/pages`: Individual screens (Home, Wallet, Admin, etc.).
*   `/components`: Reusable UI components (BottomNav, Header).
*   `/contexts`: Global blockchain state management.
*   `/services`: Ethers.js interaction logic.

---

Built with 💚 for the Celo Hackathon.
