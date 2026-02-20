const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChain", function () {
    let SupplyChain;
    let supplyChain;
    let owner, manufacturer, warehouse, supplier, retailer, rawMaterialSupplier, endUser;

    beforeEach(async function () {
        [owner, manufacturer, warehouse, supplier, retailer, rawMaterialSupplier, endUser] = await ethers.getSigners();

        const SupplyChainFactory = await ethers.getContractFactory("SupplyChain");
        supplyChain = await SupplyChainFactory.deploy();
        await supplyChain.waitForDeployment();
    });

    describe("Role Management", function () {
        it("Should assign roles correctly", async function () {
            await supplyChain.addManufacturer(manufacturer.address);
            const isManufacturer = await supplyChain.manufacturers(manufacturer.address);
            expect(isManufacturer).to.equal(true);

            await supplyChain.addRawMaterialSupplier(rawMaterialSupplier.address);
            const isRMS = await supplyChain.rawMaterialSuppliers(rawMaterialSupplier.address);
            expect(isRMS).to.equal(true);

            await supplyChain.addWarehouse(warehouse.address);
            expect(await supplyChain.warehouses(warehouse.address)).to.equal(true);

            await supplyChain.addSupplier(supplier.address);
            expect(await supplyChain.suppliers(supplier.address)).to.equal(true);

            await supplyChain.addRetailer(retailer.address);
            expect(await supplyChain.retailers(retailer.address)).to.equal(true);
        });
    });

    describe("Raw Material Flow", function () {
        beforeEach(async function () {
            await supplyChain.addManufacturer(manufacturer.address);
            await supplyChain.addRawMaterialSupplier(rawMaterialSupplier.address);
        });

        it("Should allow supplier to supply raw material", async function () {
            await expect(supplyChain.connect(rawMaterialSupplier).supplyRawMaterial(
                manufacturer.address,
                "Cotton",
                100,
                "GOTS-CERT-123",
                "51.5074",
                "-0.1278"
            )).to.emit(supplyChain, "RawMaterialSupplied")
                .withArgs(1, rawMaterialSupplier.address, manufacturer.address, "Cotton", 100, "51.5074", "-0.1278");

            // Check balance using getCheckStock
            const balance = await supplyChain.getCheckStock(manufacturer.address, 1);
            expect(balance).to.equal(100);

            // Check material details
            const material = await supplyChain.getRawMaterial(1);
            expect(material.name).to.equal("Cotton");
            expect(material.supplier).to.equal(rawMaterialSupplier.address);
        });
    });

    describe("Product Lifecycle", function () {
        beforeEach(async function () {
            // Setup roles
            await supplyChain.addManufacturer(manufacturer.address);
            await supplyChain.addRawMaterialSupplier(rawMaterialSupplier.address);
            await supplyChain.addWarehouse(warehouse.address);
            await supplyChain.addSupplier(supplier.address);
            await supplyChain.addRetailer(retailer.address);

            // Supply raw materials
            await supplyChain.connect(rawMaterialSupplier).supplyRawMaterial(manufacturer.address, "Cotton", 100, "Cert1", "40.7128", "-74.0060");
            await supplyChain.connect(rawMaterialSupplier).supplyRawMaterial(manufacturer.address, "Dye", 50, "Cert2", "34.0522", "-118.2437");
        });

        it("Should create product with raw materials and location", async function () {
            // Use materials: 10 Cotton (id 1), 5 Dye (id 2)
            await expect(supplyChain.connect(manufacturer).createProduct(
                "T-Shirt",
                "BATCH001",
                "ipfs://hash",
                [1, 2],
                [10, 5],
                "51.5074", // Lat
                "-0.1278"  // Long
            )).to.emit(supplyChain, "ProductCreated");

            // Check product details (ID starts at 1)
            const product = await supplyChain.getProduct(1);
            expect(product.name).to.equal("T-Shirt");
            expect(product.status).to.equal(0); // Status.Created

            // Check raw material usage
            const materialsUsed = await supplyChain.getProductRawMaterials(1);
            expect(materialsUsed.length).to.equal(2);
            expect(materialsUsed[0].quantity).to.equal(10);
            expect(materialsUsed[1].quantity).to.equal(5);

            // Check manufacturer balance deduction
            expect(await supplyChain.getCheckStock(manufacturer.address, 1)).to.equal(90);
            expect(await supplyChain.getCheckStock(manufacturer.address, 2)).to.equal(45);

            // Check Location History
            const history = await supplyChain.getHistory(1);
            expect(history.length).to.equal(1);
            expect(history[0].lat).to.equal("51.5074");
            expect(history[0].long).to.equal("-0.1278");
        });

        it("Should track product transfers with location", async function () {
            // Create product
            await supplyChain.connect(manufacturer).createProduct(
                "T-Shirt", "BATCH001", "ipfs://hash", [1], [10], "51.5", "-0.1"
            );

            // Transfer to Warehouse
            // Status enum: Created=0, InTransit=1, InWarehouse=2, Delivered=3, Sold=4 (Assuming Sold is added)
            await supplyChain.connect(manufacturer).transferProduct(1, warehouse.address, 2, "52.5", "-0.2");
            let product = await supplyChain.getProduct(1);
            expect(product.status).to.equal(2);

            let history = await supplyChain.getHistory(1);
            expect(history.length).to.equal(2);
            expect(history[1].lat).to.equal("52.5");

            // Transfer to Supplier (Distributor)
            await supplyChain.connect(warehouse).transferProduct(1, supplier.address, 1, "53.5", "-0.3");

            // Transfer to Retailer
            await supplyChain.connect(supplier).transferProduct(1, retailer.address, 2, "54.5", "-0.4");

            // Retailer sells to EndUser
            await supplyChain.connect(retailer).transferProduct(1, endUser.address, 4, "55.5", "-0.5");
            product = await supplyChain.getProduct(1);
            expect(product.status).to.equal(4); // Status.Sold
        });
    });
});
