const contractAddress = "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707";
const SupplyChain = await ethers.getContractFactory("SupplyChain");
const contract = await SupplyChain.attach(contractAddress);
const count = await contract.rawMaterialCount();
console.log("RAW_MATERIAL_COUNT=" + count.toString());
process.exit(0);
