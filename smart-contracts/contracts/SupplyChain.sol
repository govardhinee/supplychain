// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract SupplyChain {
    enum Status { Created, InTransit, InWarehouse, Delivered }

    struct Product {
        uint256 id;
        string name;
        string batchId;
        address currentOwner;
        Status status;
        uint256 timestamp;
        string ipfsHash; 
    }
    
    // New: Struct to store history
    struct History {
        address owner;
        Status status;
        uint256 timestamp;
    }

    mapping(uint256 => Product) public products;
    mapping(uint256 => History[]) public productHistory; // Map ID to History Array
    uint256 public productCount;

    event ProductCreated(uint256 id, string name, address owner);
    event ProductTransferred(uint256 id, address from, address to, Status status);

    function createProduct(string memory _name, string memory _batchId, string memory _ipfsHash) public returns (uint256) {
        productCount++;
        products[productCount] = Product(productCount, _name, _batchId, msg.sender, Status.Created, block.timestamp, _ipfsHash);
        
        // Add initial history
        productHistory[productCount].push(History(msg.sender, Status.Created, block.timestamp));
        
        emit ProductCreated(productCount, _name, msg.sender);
        return productCount;
    }

    function transferProduct(uint256 _id, address _newOwner, Status _status) public {
        require(_id > 0 && _id <= productCount, "Invalid product ID");
        require(products[_id].currentOwner == msg.sender, "Not the owner");
        
        address previousOwner = products[_id].currentOwner;
        products[_id].currentOwner = _newOwner;
        products[_id].status = _status;
        products[_id].timestamp = block.timestamp;
        
        // Add to history
        productHistory[_id].push(History(_newOwner, _status, block.timestamp));
        
        emit ProductTransferred(_id, previousOwner, _newOwner, _status);
    }
    
    function getProduct(uint256 _id) public view returns (Product memory) {
        return products[_id];
    }
    
    function getHistory(uint256 _id) public view returns (History[] memory) {
        return productHistory[_id];
    }
}
