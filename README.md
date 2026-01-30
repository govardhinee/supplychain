# 📦 Blockchain Supply Chain Tracker

A decentralized application (DApp) that ensures complete transparency in the supply chain lifecycle. By leveraging the Ethereum blockchain, this application allows Manufacturers, Warehouses, Suppliers, Retailers, and End Users to securely track products from creation to delivery.

---

## 🏗️ Project Architecture

Understanding how the pieces fit together:

1.  **Frontend (`/client`)**: A React.js website where users interact (Login, Dashboard, Tracking). It connects to your digital wallet (MetaMask).
2.  **Backend (`/server`)**: A Node.js server that handles user logins and uploads product images.
3.  **Blockchain (`/smart-contracts`)**: The "Brain" of the operation. A Solidity smart contract running on a local Ethereum network (Hardhat) that permanently records every product move.

**Tech Stack:**
*   **Web Framework**: React + Vite (Fast & Modern UI)
*   **Styling**: Pure CSS with Glassmorphism design
*   **Blockchain**: Hardhat (Local Ethereum Environment)
*   **Smart Contract Reference**: Solidity (Ethereum programming language)
*   **Database**: JSON-based local DB (for simpler setup without MongoDB)

---

## 🚀 Step-by-Step Setup Guide

Follow these instructions exactly to start the entire system on your local machine.

> **📄 CMD / New system?** See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for copy-paste CMD commands, clean-install fix for Hardhat `_assert.js` errors, and troubleshooting.

### 📋 Prerequisites
1.  **Node.js**: Download and install from [nodejs.org](https://nodejs.org/) (Version 16+ recommended).
2.  **MetaMask**: Install the [MetaMask browser extension](https://metamask.io/) for Chrome, Firefox, or Edge.

---

### Phase 1: Installation 🛠️

Open your terminal (Command Prompt/Terminal) in the project folder and run these commands to download the necessary "spare parts" for the code.

```bash
# 1. Install Global Dependencies
npm install

# 2. Install Smart Contract Tools
cd smart-contracts
npm install
cd ..

# 3. Install Server Dependencies
cd server
npm install
cd ..

# 4. Install Website Dependencies
cd client
npm install
cd ..
```

---

### Phase 2: Running the System (The 4 Terminal Method) 🖥️

You need to run 4 separate processes simultaneously. Open 4 separate terminal windows.

#### Terminal 1: The Blockchain Network ⛓️
This simulates the internet of the blockchain on your computer.
```bash
cd smart-contracts
npx hardhat node
```
*   **IMPORTANT**: Keep this running! You will see a list of "Accounts" with private keys. You will fake-money and identities from here.

#### Terminal 2: Deploy the Contract 🚀
This uploads your specific tracking rules (Smart Contract) to the network in Terminal 1.
```bash
cd smart-contracts
npx hardhat run scripts/deploy.js --network localhost
```
*   *Success Message:* `SupplyChain deployed to: 0x...`

#### Terminal 3: The Backend Server 🗄️
```bash
cd server
node index.js
```
*   *Success Message:* `Server running on port 5001`

#### Terminal 4: The Website (Frontend) 🌐
```bash
cd client
npm run dev
```
*   Click the link shown (usually `http://localhost:5173`) to open the app.

---

### Phase 3: Configuring MetaMask 🦊

To use the app, your browser needs to "talk" to your local blockchain (Terminal 1).

1.  **Connect to Localhost**:
    *   Open MetaMask Extension.
    *   Click the Network Dropdown (top left).
    *   Click **"Add network"** -> **"Add a network manually"**.
    *   **Network Name**: `Localhost Hardhat`
    *   **RPC URL**: `http://127.0.0.1:8545`
    *   **Chain ID**: `31337`
    *   **Currency Symbol**: `ETH`
    *   Click **Save**.

2.  **Import a Test Wallet**:
    *   Go to **Terminal 1**. Scroll to top.
    *   Copy the text next to **Account #0 Private Key**.
    *   In MetaMask, click the circle icon (top right) -> **Import Account**.
    *   Paste the key. This is now your "Manufacturer" wallet.
    *   *(Optional)* Repeat for Account #1 to use as "Warehouse" owner.

---

### 🎮 User Manual: The Life of a Product

The application enforces a strict supply chain flow:
**Manufacturer → Warehouse → Supplier → Retailer → End User**

#### 1. The Manufacturer (Creation)
1.  Login with: `manufacturer` / `pass`.
2.  Ensure MetaMask is connected to Account #0.
3.  Go to **Dashboard**.
4.  Enter "Nike Shoes", Batch "BATCH-001", and upload an image.
5.  Click **Create**.
6.  **Result**: A QR Code is generated, and the product is saved to the blockchain.

#### 2. The Transfer (Handover)
1.  In the Manufacturer Dashboard, scroll to "My Inventory".
2.  Click **Transfer Ownership** on your product.
3.  The system automatically targets the **Warehouse**.
4.  Click **Confirm Transfer** and approve the MetaMask popup.
5.  The product disappears from your inventory. It is now with the Warehouse.

#### 3. The Warehouse (Storage)
1.  Logout. Login with: `warehouse` / `pass`.
2.  **Switch MetaMask Account!** (Import Account #1 from Terminal 1 if needed, otherwise it will warn you of a wallet mismatch).
3.  You will see the product in your inventory!
4.  You can now transfer it to the **Supplier**.

#### 4. Tracking the Journey 🕵️‍♂️
1.  Go to the **Track Product** page (top menu).
2.  Enter the Product ID (e.g., `1`) or Scan the QR Code saved earlier.
3.  **View Timeline**: You will see the full history:
    *   🟢 **Manufacturer** (Created - Finished)
    *   🟢 **Warehouse** (In Warehouse - Finished)
    *   ⚪ **Supplier** (Pending)
    *   ⚪ **Retailer** (Pending)

---

### 📂 Folder Structure

*   **/smart-contracts**: Contains `SupplyChain.sol` (the logic) and deployment scripts.
*   **/client**: The React application.
    *   `/src/pages`: Returns the visual pages (Dashboard, Login, Track).
    *   `/src/context`: Handles the connection to the Blockchain.
*   **/server**:
    *   `/uploads`: Stores uploaded product images locally.
    *   `/data/db.json`: Stores user login info.

---

### ❓ Troubleshooting Common Issues

**1. "Nonce too high" Error in MetaMask**
*   **Cause**: You restarted Terminal 1 (The Blockchain) but MetaMask remembers the old history.
*   **Fix**: Open MetaMask -> Settings -> Advanced -> **Clear Activity Tab Data**.

**2. Product not showing / Infinite Loading**
*   **Fix**: Ensure Terminal 1 is running and you are connected to `Localhost 8545` network in MetaMask.

**3. "User Denied Transaction"**
*   **Fix**: You must click "Confirm" in the MetaMask popup window that appears when you click a button on the website.
