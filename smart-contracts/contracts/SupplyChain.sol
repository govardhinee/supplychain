// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SupplyChain {
    enum Status { Created, InTransit, InWarehouse, Delivered, Sold }

    struct Product {
        uint256 id;
        string name;
        string batchId;
        address currentOwner;
        Status status;
        uint256 timestamp;
        string ipfsHash;
    }

    struct History {
        address owner;
        Status status;
        uint256 timestamp;
        string lat;
        string long;
    }

    // Raw Material Logic
    struct RawMaterial {
        uint256 id;
        string name;
        address supplier;
        string certificateHash;
        string lat;
        string long;
    }

    struct RawMaterialUsed {
        uint256 materialId;
        uint256 quantity;
    }

    mapping(uint256 => Product) public products;
    mapping(uint256 => History[]) public productHistory;
    
    // Material Mappings
    mapping(uint256 => RawMaterial) public rawMaterials;
    mapping(address => mapping(uint256 => uint256)) public manufacturerRawMaterialBalance; // Manufacturer -> MaterialID -> Quantity
    mapping(uint256 => RawMaterialUsed[]) public productRawMaterials; // ProductID -> Materials Used

    // Roles (Simple address based for now, can be expanded)
    mapping(address => bool) public manufacturers;
    mapping(address => bool) public rawMaterialSuppliers;
    mapping(address => bool) public warehouses;
    mapping(address => bool) public suppliers;
    mapping(address => bool) public retailers;

    uint256 public productCount;
    uint256 public rawMaterialCount;

    event ProductCreated(uint256 id, string name, address owner);
    event ProductTransferred(uint256 id, address from, address to, Status status);
    event RawMaterialSupplied(uint256 id, address supplier, address manufacturer, string name, uint256 quantity, string lat, string long);
    event RoleGranted(string role, address account);

    // --- Role Management ---
    function addManufacturer(address _account) public { manufacturers[_account] = true; emit RoleGranted("Manufacturer", _account); }
    function addRawMaterialSupplier(address _account) public { rawMaterialSuppliers[_account] = true; emit RoleGranted("RawMaterialSupplier", _account); }
    function addWarehouse(address _account) public { warehouses[_account] = true; emit RoleGranted("Warehouse", _account); }
    function addSupplier(address _account) public { suppliers[_account] = true; emit RoleGranted("Supplier", _account); }
    function addRetailer(address _account) public { retailers[_account] = true; emit RoleGranted("Retailer", _account); }

    // --- Raw Material Functions ---
    function supplyRawMaterial(address _manufacturer, string memory _name, uint256 _quantity, string memory _certificate, string memory _lat, string memory _long) public {
        // require(rawMaterialSuppliers[msg.sender], "Not a Raw Material Supplier"); // Optional enforcement
        
        rawMaterialCount++;
        rawMaterials[rawMaterialCount] = RawMaterial(rawMaterialCount, _name, msg.sender, _certificate, _lat, _long);
        
        manufacturerRawMaterialBalance[_manufacturer][rawMaterialCount] += _quantity;
        
        emit RawMaterialSupplied(rawMaterialCount, msg.sender, _manufacturer, _name, _quantity, _lat, _long);
    }

    function getCheckStock(address _manufacturer, uint256 _materialId) public view returns (uint256) {
        return manufacturerRawMaterialBalance[_manufacturer][_materialId];
    }
    
    function getRawMaterial(uint256 _id) public view returns (RawMaterial memory) {
        return rawMaterials[_id];
    }
    
    function getProductRawMaterials(uint256 _productId) public view returns (RawMaterialUsed[] memory) {
        return productRawMaterials[_productId];
    }

    // --- Product Functions ---

    function createProduct(
        string memory _name, 
        string memory _batchId, 
        string memory _ipfsHash,
        uint256[] memory _materialIds, 
        uint256[] memory _quantities,
        string memory _lat,
        string memory _long
    ) public returns (uint256) {
        // require(manufacturers[msg.sender], "Not a Manufacturer");

        // Verify and Deduct Raw Materials
        require(_materialIds.length == _quantities.length, "Mismatched inputs");
        for(uint i=0; i<_materialIds.length; i++) {
             uint256 mId = _materialIds[i];
             uint256 qty = _quantities[i];
             require(manufacturerRawMaterialBalance[msg.sender][mId] >= qty, "Insufficient raw material balance");
             manufacturerRawMaterialBalance[msg.sender][mId] -= qty;
             
             // Record usage
             // Note: Can't push to storage array from memory directly in this way efficiently without loop
        }

        productCount++;
        products[productCount] = Product(productCount, _name, _batchId, msg.sender, Status.Created, block.timestamp, _ipfsHash);
        
        // Add History
        productHistory[productCount].push(History(msg.sender, Status.Created, block.timestamp, _lat, _long));
        
        // Add Raw Materials Used
        for(uint i=0; i<_materialIds.length; i++) {
            productRawMaterials[productCount].push(RawMaterialUsed(_materialIds[i], _quantities[i]));
        }

        emit ProductCreated(productCount, _name, msg.sender);
        return productCount;
    }

    function transferProduct(uint256 _id, address _newOwner, Status _status, string memory _lat, string memory _long) public {
        require(_id > 0 && _id <= productCount, "Invalid product ID");
        require(products[_id].currentOwner == msg.sender, "Not the owner");
        
        address previousOwner = products[_id].currentOwner;
        products[_id].currentOwner = _newOwner;
        products[_id].status = _status;
        products[_id].timestamp = block.timestamp;
        
        // Add to history
        productHistory[_id].push(History(_newOwner, _status, block.timestamp, _lat, _long));
        
        emit ProductTransferred(_id, previousOwner, _newOwner, _status);
    }
    
    function getProduct(uint256 _id) public view returns (Product memory) {
        return products[_id];
    }
    
    function getHistory(uint256 _id) public view returns (History[] memory) {
        return productHistory[_id];
    }
}
