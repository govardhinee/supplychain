import fs from "fs";
import hre from "hardhat";
import path from "path";

async function main() {
    const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
    const supplyChain = await SupplyChain.deploy();

    await supplyChain.waitForDeployment();

    const address = await supplyChain.getAddress();
    console.log("SupplyChain deployed to:", address);

    // Automatically update the frontend constants.js file
    const constantsPath = path.join(process.cwd(), "../client/src/utils/constants.js");
    let constantsFile = fs.readFileSync(constantsPath, "utf8");
    constantsFile = constantsFile.replace(
        /export const contractAddress = '.*';/,
        `export const contractAddress = '${address}';`
    );
    fs.writeFileSync(constantsPath, constantsFile);
    console.log("✅ Successfully updated contractAddress in client/src/utils/constants.js");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
