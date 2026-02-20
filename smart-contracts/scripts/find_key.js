import { ethers } from "ethers";

const roles = {
    'Manufacturer': '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    'Warehouse': '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    'Supplier': '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
    'Retailer': '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
    'End User': '0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199',
    'Raw Material Supplier': '0xcd3b766cCdD6Ae721141F452C550Ca635964ce71'
};

async function main() {
    const mnemonic = "test test test test test test test test test test test junk";

    console.log("Finding keys for all roles...");

    const foundKeys = {};

    // Check first 20 accounts
    for (let i = 0; i < 20; i++) {
        const wallet = ethers.HDNodeWallet.fromPhrase(mnemonic, "", `m/44'/60'/0'/0/${i}`);

        for (const [role, address] of Object.entries(roles)) {
            if (wallet.address.toLowerCase() === address.toLowerCase()) {
                foundKeys[role] = wallet.privateKey;
                console.log(`Role: ${role}`);
                console.log(`Address: ${address}`);
                console.log(`Private Key: ${wallet.privateKey}`);
                console.log('---');
            }
        }
    }
}

main().catch(console.error);
