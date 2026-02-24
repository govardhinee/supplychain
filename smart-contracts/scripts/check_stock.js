import hre from "hardhat";

async function main() {
    const contractAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
    const manufacturerAddress = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";

    const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
    const contract = await SupplyChain.attach(contractAddress);

    const rmCount = await contract.rawMaterialCount();
    console.log("Total Raw Materials count:", rmCount.toString());

    for (let i = 1; i <= Number(rmCount); i++) {
        try {
            const balance = await contract.getCheckStock(manufacturerAddress, i);
            const material = await contract.getRawMaterial(i);
            console.log(`Material ${i}: ${material.name}, Balance for Manufacturer: ${balance.toString()}`);
        } catch (e) {
            console.log(`Error reading material ${i}:`, e.message);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
