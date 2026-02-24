# 🚀 How to Run SupplyChain.io

There are two ways to start the SupplyChain.io application on your local machine.

---

## Method 1: The One-Click Windows Method (Recommended)

Since this project has been fully configured for Windows, you can start the entire stack (Blockchain, Smart Contracts, Backend, and Frontend) all at once!

1. Open your File Explorer to the root folder (`c:\Users\govar\Downloads\supplychain\supplychain-main`).
2. Double-click the **`run_all.bat`** file.
3. This powerful script will automatically open 4 separate terminal windows for you.
   - Wait about 10 seconds for it to fully load the blockchain before it perfectly sequences everything else.
4. Once the windows stop loading text, open your browser and go to: **[http://localhost:5173](http://localhost:5173)**

---

## Method 2: The Manual "4 Terminal" Method (Mac/Linux/Troubleshooting)

If the `.bat` file doesn't work, you must open **4 separate Command Prompt (or VS Code Terminal) windows** in the main project folder.

### Terminal 1: Start the Local Blockchain
This spins up your local Ethereum node. Do not close this window!
```bash
cd smart-contracts
npx hardhat node
```

### Terminal 2: Deploy the Smart Contract
Upload your blockchain logic to the node running in Terminal 1.
```bash
cd smart-contracts
npx hardhat run scripts/deploy.js --network localhost
```
*(Wait until it prints: "SupplyChain deployed to: 0x...")*

### Terminal 3: Start the Backend Image Server
Starts the Node.js API that handles images and login JSON.
```bash
cd server
node index.js
```

### Terminal 4: Start the React Frontend UI
Boot up the sleek, animated React website.
```bash
cd client
npm run dev
```

Finally, open your browser and visit: **[http://localhost:5173](http://localhost:5173)**

---

## 🦊 Vital: MetaMask & Location Permissions

To actually use the dashboard successfully, you MUST configure two things in your browser:

1. **Location Tracking Is Mandatory:**
   - SupplyChain.io actively tracks the real-world GPS coordinates of products as they are transferred.
   - When you click "Get Location & Transfer", your browser will ask for Location Permission. **You must click "Allow"**, otherwise the transaction will be blocked.

2. **Connecting MetaMask to Localhost:**
   - You need the MetaMask browser extension.
   - Add a custom network: **RPC URL = `http://127.0.0.1:8545`** / **Chain ID = `31337`**.
   - Import "Account #0" from Terminal 1's output into MetaMask natively so you have fake ETH to pay for transactions.
