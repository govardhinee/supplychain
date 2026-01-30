---
description: How to upload this project to GitHub
---

Follow these steps to upload your project to GitHub.

### 1. Initialize Git Locally
Open your terminal in the project root (`/Users/dworak/Major`).

```bash
git init
```

### 2. Stage and Commit Files
We have already created a `.gitignore` file for you, so it is safe to add everything.

```bash
git add .
git commit -m "Initial commit of Blockchain Supply Chain Tracker"
```

### 3. Create a Repository on GitHub
1.  Go to [github.com/new](https://github.com/new).
2.  **Repository name**: e.g., `blockchain-supply-chain`.
3.  **Visibility**: Public or Private (your choice).
4.  **Do NOT** initialize with a README, .gitignore, or License (we already have them locally).
5.  Click **Create repository**.

### 4. Link and Push
Copy the HTTPS or SSH URL from the page you just landed on (e.g., `https://github.com/your-username/blockchain-supply-chain.git`).

Run these commands in your terminal, replacing `YOUR_URL` with the one you copied:

```bash
git branch -M main
git remote add origin YOUR_URL
git push -u origin main
```

### 5. Done!
Refresh your GitHub page, and you should see your code live.
