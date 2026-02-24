# Unified Supply Chain Flowchart Prompt

**Copy and paste the text below into your AI tool (ChatGPT, Claude, etc.) to get a single, complete flowchart for the entire project.**

---

Please create a single, comprehensive **Mermaid flowchart** that represents the entire workflow of the **SupplyChain.io** application, combining user actions, backend API calls, and blockchain interactions.

**The Flow Logic:**

1.  **Start & Authentication:**
    *   User starts at **Landing Page** (`/`).
    *   User clicks **Login** (`/login`).
    *   **Action:** User submits credentials.
    *   **System:** Server (`POST /api/login`) validates against `db.json`.
    *   *Decision:*
        *   If Invalid: Show Error.
        *   If Valid: Redirect to **Dashboard** (`/dashboard`).

2.  **Dashboard Initialization:**
    *   On Dashboard load, app checks **MetaMask** connection.
    *   **Action:** User connects wallet.
    *   **System:** App initializes the `SupplyChain` smart contract.

3.  **Manufacturer Flow (Creation):**
    *   *Condition:* If User Role is **Manufacturer**.
    *   **Action:** User fills Product Form & Uploads Image.
    *   **System (Off-chain):** Image sent to Server (`POST /api/upload`) → returns `imageUrl`.
    *   **System (On-chain):** Wallet signs `createProduct(name, batch, image)` transaction.
    *   **Result:** Blockchain updates state; App generates **QR Code**.

4.  **Transfer Flow (The Supply Chain):**
    *   *Condition:* If User owns a product (Manufacturer, Warehouse, Supplier, Retailer).
    *   **Action:** User selects product from **Inventory** and clicks "Transfer".
    *   **Logic:** App determines next receiver (e.g., Manufacturer → Warehouse → Supplier → Retailer → End User).
    *   **Action:** User confirms transfer.
    *   **System (On-chain):** Wallet signs `transferProduct(id, newOwner, status)` transaction.
    *   **Result:** Product ownership changes on blockchain; Status updates (e.g., "In Warehouse", "People", "Delivered").

5.  **Tracking Flow (Public):**
    *   User (Logged in or not) goes to **Track Page** (`/track`).
    *   **Action:** User scans QR Code or enters Product ID.
    *   **System (On-chain):** App calls `getProduct(id)` and `getHistory(id)`.
    *   **Result:** Display full timeline of the product journey.

**Output Format:**
Please generate this as a `graph TD` (Top-Down) Mermaid diagram. Use subgraphs to distinguish between **Frontend (User)**, **Backend (Server)**, and **Blockchain**.
