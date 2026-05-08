# 🏛️ Blockchain Land Registry System

[![📖 Setup Guide](https://img.shields.io/badge/📖_Setup_Guide-Open_Guide-blue?style=for-the-badge)](https://Helion564.github.io/Blockchain-Land-Registry-System/docs/guide.html)

A completely decentralized, immutable, and transparent Blockchain-based Land Registry system built using Ethereum, Solidity, React.js, and Hardhat.

## 🚀 How to Run Locally

### Step 1: Start your Local Blockchain (Ganache)
1. Open the **Ganache** desktop application.
2. Click **"Quickstart (Ethereum)"**.
3. It will start a local blockchain on `http://127.0.0.1:7545` and show you 10 accounts with 100 ETH each. *(Leave this Ganache window open in the background).*

### Step 2: Deploy the Smart Contract
1. Open a **PowerShell** or **Command Prompt** window.
2. Navigate to the `blockchain` folder:
   \`\`\`bash
   cd blockchain
   \`\`\`
3. Run the deployment script targeting your Ganache network:
   \`\`\`bash
   npx hardhat run scripts/deploy.js --network ganache
   \`\`\`
   *(If successful, it will say "LandRegistry deployed" and copy the ABI files directly to your frontend folder).*

### Step 3: Start the React Frontend
1. Open a **new, second PowerShell** or **Command Prompt** window.
2. Navigate to the `frontend` folder:
   \`\`\`bash
   cd frontend
   \`\`\`
3. Start the Vite development server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Open `http://localhost:5173` in your browser.

### Step 4: Connect MetaMask
1. Open your browser and ensure the **MetaMask** extension is installed.
2. Add Ganache to MetaMask:
   - Click the network dropdown at the top of MetaMask -> **"Add network"** -> **"Add a network manually"**.
   - **Network Name:** Local Ganache
   - **New RPC URL:** `http://127.0.0.1:7545`
   - **Chain ID:** `1337`
   - **Currency symbol:** `ETH`
3. Import the Admin Account:
   - Go back to the **Ganache app**, and find the **first account** (Index 0).
   - Click the **Key icon (🔑)** on the right side of that row and copy the **Private Key**.
   - Go to MetaMask, click the Account dropdown at the top -> **"Import account"** -> paste the Private Key.
4. Go to your website (`http://localhost:5173`), click **"Connect MetaMask"**, and approve the connection. 

You're all set! You can now register and view land on the blockchain.
