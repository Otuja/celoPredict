
# ⚽ CeloPredict

**The Mobile-First Prediction Market for Emerging Markets.**

![Celo Network](https://img.shields.io/badge/Network-Celo%20Sepolia-green)
![Status](https://img.shields.io/badge/Status-Hackathon%20Demo-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

## 💡 The Pitch

Current betting platforms are centralized, opaque, and often inaccessible in emerging economies due to banking restrictions. **CeloPredict** solves this by bringing sports prediction on-chain, leveraging Celo's fast block times and low fees to create a transparent, trustless prediction market.

We built CeloPredict with a **"Mobile-First" philosophy**. It mimics the smooth UX of Web2 apps like *LiveScore* or *OneFootball*, but with the power of DeFi under the hood. It is designed to run seamlessly on low-bandwidth mobile devices, making it perfect for the Celo ecosystem's target audience.

## 🚀 Key Features

*   **📱 Native App Experience**: A bottom-navigation layout, glassmorphic UI, and touch-optimized inputs that feel like a native mobile app.
*   **⚡ Instant & Low Cost**: Built on Celo to ensure betting is affordable (cents, not dollars) and instant.
*   **💸 Automated Settlements**: Winners are calculated automatically by the smart contract—no human error in payouts.
*   **🤝 Social Viral Loops**: Integrated sharing features to allow users to challenge friends on WhatsApp and Twitter.

## 🔮 Future Roadmap (Post-Hackathon)

1.  **Chainlink Data Feeds**: We will replace the current Admin Oracle with **Chainlink Sports Data Feeds** to fully decentralize match settlements.
2.  **Opera MiniPay Integration**: We plan to optimize the manifest to run CeloPredict directly inside the **MiniPay** wallet for instant distribution to millions of users in Africa.
3.  **Stablecoin Support**: Transitioning the pot from CELO to **cUSD** to protect users from volatility.

---

## 📱 Hackathon Demo Mode

**⚠️ IMPORTANT FOR JUDGES**

To ensure a frictionless testing experience, this app is currently running in **Hackathon Mode**.

1.  **No Wallet Needed**: The app automatically connects using a pre-funded Testnet Admin Wallet.
2.  **Auto-Signing**: Transactions (Betting, Creating Matches) are signed automatically in the background—no MetaMask popups required.
3.  **Full Admin Access**: You have immediate access to the **Admin Console** to Create Matches and Settle Results to test the full lifecycle in minutes.

*To disable this for production, set `IS_HACKATHON_MODE = false` in `constants.ts`.*

---

## 🎮 How to Demo (60-Second Walkthrough)

1.  **Create a Match (Admin Tab)**:
    *   Go to the **Admin** tab.
    *   Enter teams (e.g., "Real Madrid" vs "Barca").
    *   Click **+1 Min** to set the kickoff to 60 seconds from now.
    *   Click **Publish**.
2.  **Place a Bet (Home Tab)**:
    *   Go to **Home** and tap your new match.
    *   Enter a score (e.g., 2 - 1) and click **Place Bet**.
    *   *Watch the confetti! 🎉*
3.  **Simulate Match End**:
    *   Wait 1 minute for the match timer to hit 00:00.
4.  **Settle Match (Admin Tab)**:
    *   Go back to **Admin** -> **Pending Results**.
    *   Wait for the "Ready to Settle" indicator.
    *   Enter the final score and click **Settle**.
5.  **Claim Winnings (Wallet Tab)**:
    *   If you guessed correctly, go to the **Wallet** tab.
    *   Click **Claim to Wallet**.

---

## 🛠 Tech Stack

*   **Frontend**: React 18, Tailwind CSS, Lucide Icons (Glassmorphism UI).
*   **Blockchain**: Celo Sepolia Testnet.
*   **Integration**: Ethers.js v6.
*   **Smart Contract**: Solidity (ERC20/Native logic).

## 🔗 Contract Details

*   **Network**: Celo Sepolia Testnet
*   **Chain ID**: `11142220`
*   **RPC URL**: `https://forno.celo-sepolia.celo-testnet.org`
*   **Contract Address**: `0x630fcEBE028f80C4420E5684ACab17b001ce4975`

---

*Built with 💚 for the Celo Hackathon.*
