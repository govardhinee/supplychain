import React, { useState, useContext, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BlockchainContext } from '../context/BlockchainContext';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const { contract, currentAccount, currentUser, getLocation } = useContext(BlockchainContext);

    // manufacturer form
    const [formData, setFormData] = useState({ name: '', batchId: '' });
    // raw material supply form
    const [supplyData, setSupplyData] = useState({ name: '', quantity: '', certificate: '', manufacturerAddress: '' });
    const [certificateFile, setCertificateFile] = useState(null);

    // State for Transfer
    const [transferData, setTransferData] = useState({ productId: '', nextRole: '', customAddress: '' });

    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(null);
    const [generatedQR, setGeneratedQR] = useState(null);
    const [createdProductId, setCreatedProductId] = useState(null);

    // Inventory State
    const [myInventory, setMyInventory] = useState([]);
    const [isInventoryLoading, setIsInventoryLoading] = useState(false);

    // Manufacturer Stock State
    const [manufacturerStock, setManufacturerStock] = useState([]);
    const [selectedMaterials, setSelectedMaterials] = useState([]); // [{ id, quantity }]

    // --- Helpers ---
    const handleTransferChange = (e) => setTransferData({ ...transferData, [e.target.name]: e.target.value });
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleSupplyChange = (e) => setSupplyData({ ...supplyData, [e.target.name]: e.target.value });
    const handleImageChange = (e) => setImage(e.target.files[0]);

    // STRICT SUPPLY CHAIN FLOW
    const supplyChainFlow = {
        'Raw Material Supplier': 'Manufacturer',
        'Manufacturer': 'Warehouse',
        'Warehouse': 'Supplier',
        'Supplier': 'Retailer',
        'Retailer': 'End User'
    };

    // Pre-defined addresses for the demo
    const roleWallets = {
        'Raw Material Supplier': '0xcd3b766cCdD6Ae721141F452C550Ca635964ce71',
        'Manufacturer': '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
        'Warehouse': '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        'Supplier': '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
        'Retailer': '0x90f79bf6eb2c4f870365e785982e1f101e93b906'
    };

    const isWalletMismatch = currentUser && currentAccount &&
        roleWallets[currentUser.role] &&
        currentAccount.toLowerCase() !== roleWallets[currentUser.role].toLowerCase();

    const statusMap = ["Created", "In Transit", "In Warehouse", "Delivered"];
    const formatId = (id) => String(id).padStart(4, '0');

    // --- Fetch Inventory ---
    const fetchInventory = async () => {
        if (!contract || !currentAccount) return;
        setIsInventoryLoading(true);
        try {
            const count = await contract.productCount();
            const items = [];
            for (let i = Number(count); i >= 1; i--) {
                const p = await contract.getProduct(i);
                if (p.currentOwner.toLowerCase() === currentAccount.toLowerCase()) {
                    items.push({
                        id: p.id.toString(),
                        name: p.name,
                        batchId: p.batchId,
                        image: p.ipfsHash,
                        status: p.status
                    });
                }
            }
            setMyInventory(items);
        } catch (error) {
            console.error("Error fetching inventory:", error);
        } finally {
            setIsInventoryLoading(false);
        }
    };

    // --- Fetch Manufacturer Stock ---
    const fetchStock = async () => {
        if (!contract || !currentAccount || currentUser.role !== 'Manufacturer') return;
        try {
            const rmCount = await contract.rawMaterialCount();
            const stock = [];
            for (let i = 1; i <= Number(rmCount); i++) {
                const balance = await contract.getCheckStock(currentAccount, i);
                if (Number(balance) > 0) {
                    const material = await contract.getRawMaterial(i);
                    stock.push({
                        id: i,
                        name: material.name,
                        balance: Number(balance)
                    });
                }
            }
            setManufacturerStock(stock);
        } catch (error) {
            console.error("Error fetching stock:", error);
        }
    };

    useEffect(() => {
        fetchInventory();
        if (currentUser?.role === 'Manufacturer') {
            fetchStock();
        }
    }, [contract, currentAccount, currentUser]);

    // --- Actions ---

    const uploadImage = async () => {
        if (!image) return null;
        const data = new FormData();
        data.append('image', image);
        try {
            const response = await fetch('http://localhost:5001/api/upload', { method: 'POST', body: data });
            const res = await response.json();
            return res.imageUrl;
        } catch (error) {
            console.error("Upload error:", error);
            return null;
        }
    };

    const uploadCertificate = async () => {
        if (!certificateFile) return null;
        const data = new FormData();
        data.append('image', certificateFile); // Using same endpoint/field 'image' for simplicity as server accepts it
        try {
            const response = await fetch('http://localhost:5001/api/upload', { method: 'POST', body: data });
            const result = await response.json();
            return result.imageUrl;
        } catch (error) {
            console.error("Certificate Upload error:", error);
            return null;
        }
    };

    const handleSupplyMaterial = async (e) => {
        e.preventDefault();
        if (!contract) return alert("Contract not loaded");
        try {
            setLoading(true);
            const { name, quantity, certificate, manufacturerAddress } = supplyData;

            // Use predefined manufacturer address if input is empty/not provided, or generic handler
            const target = manufacturerAddress || roleWallets['Manufacturer'];

            // Handle Certificate Upload
            let finalCertificate = certificate;
            if (certificateFile) {
                const uploadedUrl = await uploadCertificate();
                if (uploadedUrl) {
                    finalCertificate = uploadedUrl;
                }
            }

            // Get Location
            const { lat, long } = await getLocation();

            const tx = await contract.supplyRawMaterial(target, name, parseInt(quantity), finalCertificate, lat, long);
            await tx.wait();

            setLoading(false);
            alert("Raw Material Supplied Successfully!");
            setSupplyData({ name: '', quantity: '', certificate: '', manufacturerAddress: '' });
            setCertificateFile(null);
        } catch (error) {
            console.error(error);
            setLoading(false);
            alert(error.message);
        }
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        if (!contract) return alert("Contract not loaded");

        try {
            setLoading(true);

            // Get Location
            const location = await getLocation();

            let ipfsHash = "No Image";
            if (image) {
                ipfsHash = await uploadImage();
            }

            const { name, batchId } = formData;

            const materialIds = selectedMaterials.map(m => m.id);
            const quantities = selectedMaterials.map(m => m.quantity);

            const tx = await contract.createProduct(
                name,
                batchId,
                ipfsHash,
                materialIds,
                quantities,
                location.lat,
                location.long
            );
            await tx.wait();

            // Get the new ID
            const count = await contract.productCount();
            const newId = count.toString();
            setCreatedProductId(newId);

            const qrPayload = JSON.stringify({ id: newId, name, batchId });
            setGeneratedQR(qrPayload);

            setLoading(false);
            alert("Product Created! ID: " + newId);
            fetchInventory();
            fetchStock(); // Update stock
            setFormData({ name: '', batchId: '' });
            setSelectedMaterials([]);
            setImage(null);
        } catch (error) {
            console.error(error);
            setLoading(false);
            alert(error.message);
        }
    };

    const handleTransferProduct = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);

            // Get Location
            const location = await getLocation();

            const { productId } = transferData;

            // Enforce Flow
            const nextRole = supplyChainFlow[currentUser.role];
            if (!nextRole) return alert("Your role cannot transfer products.");

            let targetAddress = roleWallets[nextRole];

            if (nextRole === 'End User') {
                if (!transferData.customAddress) {
                    setLoading(false);
                    return alert("Please enter the Buyer's Wallet Address for End User transfer.");
                }
                targetAddress = transferData.customAddress;
            }

            let statusInt = 0;
            if (nextRole === 'Warehouse') statusInt = 2;
            else if (nextRole === 'End User') statusInt = 3;
            else statusInt = 1;

            if (!targetAddress) return alert("System Error: No wallet found for " + nextRole);

            const tx = await contract.transferProduct(productId, targetAddress, statusInt, location.lat, location.long);
            await tx.wait();

            setLoading(false);
            alert(`Transferred to ${nextRole} Successfully!`);
            fetchInventory();
            setTransferData({ productId: '', nextRole: '', customAddress: '' });
        } catch (error) {
            console.error(error);
            setLoading(false);
            alert(error.message);
        }
    };

    const selectItemForTransfer = (id) => {
        setTransferData({ ...transferData, productId: id });
        document.getElementById('transfer-section')?.scrollIntoView({ behavior: 'smooth' });
    };

    const downloadQR = (elementId, filename) => {
        const svg = document.getElementById(elementId);
        if (!svg) {
            console.error("QR Code element not found:", elementId);
            return;
        }
        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Material Selection Helper
    const toggleMaterial = (stockItem) => {
        const existing = selectedMaterials.find(m => m.id === stockItem.id);
        if (existing) {
            setSelectedMaterials(selectedMaterials.filter(m => m.id !== stockItem.id));
        } else {
            setSelectedMaterials([...selectedMaterials, { id: stockItem.id, quantity: 1 }]); // Default qty 1
        }
    };

    const updateMaterialQuantity = (id, qty) => {
        setSelectedMaterials(selectedMaterials.map(m => m.id === id ? { ...m, quantity: parseInt(qty) } : m));
    };

    if (!currentUser) return <div style={{ paddingTop: '120px', textAlign: 'center' }}><h2>Please Login</h2></div>;

    const nextDestination = supplyChainFlow[currentUser.role];

    return (
        <div style={{ paddingTop: '120px', paddingBottom: '50px', maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>

            <header style={{ marginBottom: '4rem' }}>
                <motion.h2
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '1rem' }}
                >
                    {currentUser.role} Dashboard
                </motion.h2>

                {isWalletMismatch && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.5)',
                            padding: '1rem 1.5rem',
                            borderRadius: '12px',
                            color: '#ef4444',
                            marginBottom: '2rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                        }}
                    >
                        <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                        <div>
                            <strong style={{ display: 'block' }}>Wallet Mismatch Detected</strong>
                            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                Your connected wallet (<strong>{currentAccount.substring(0, 10)}...</strong>) does not match the expected address for the <strong>{currentUser.role}</strong> role.
                                Please switch accounts in MetaMask to <strong>{roleWallets[currentUser.role].substring(0, 10)}...</strong> to perform actions.
                            </span>
                        </div>
                    </motion.div>
                )}

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div className="modern-card" style={{ padding: '1rem 2rem', display: 'inline-block' }}>
                        User: <span style={{ fontWeight: 'bold' }}>{currentUser.username}</span>
                    </div>
                </div>

            </header>

            {/* RAW MATERIAL SUPPLIER SECTION */}
            {currentUser.role === 'Raw Material Supplier' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="modern-card"
                    style={{ padding: '2rem', marginBottom: '4rem' }}
                >
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Supply Raw Materials</h3>
                    <form onSubmit={handleSupplyMaterial} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Material Name</label>
                            <input type="text" name="name" value={supplyData.name} onChange={handleSupplyChange} className="modern-input" required placeholder="e.g. Cotton, Steel" />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Quantity</label>
                            <input type="number" name="quantity" value={supplyData.quantity} onChange={handleSupplyChange} className="modern-input" required placeholder="e.g. 100" />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Certificate (Text or File)</label>
                            <input type="text" name="certificate" value={supplyData.certificate} onChange={handleSupplyChange} className="modern-input" placeholder="Enter text/link OR upload file below" />
                            <div style={{ marginTop: '0.5rem', border: '1px dashed rgba(255,255,255,0.2)', padding: '0.5rem' }}>
                                <input
                                    type="file"
                                    accept=".pdf,image/*"
                                    onChange={(e) => setCertificateFile(e.target.files[0])}
                                    style={{ width: '100%', color: '#94a3b8' }}
                                />
                            </div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Manufacturer Address (Optional)</label>
                            <input type="text" name="manufacturerAddress" value={supplyData.manufacturerAddress} onChange={handleSupplyChange} className="modern-input" placeholder={roleWallets['Manufacturer']} />
                            <small style={{ color: '#94a3b8' }}>Default: {roleWallets['Manufacturer']}</small>
                        </div>
                        <button type="submit" disabled={loading} className="btn-modern" style={{ gridColumn: '1 / -1' }}>
                            {loading ? 'Processing (with Location)...' : 'Supply Material'}
                        </button>
                    </form>
                </motion.div>
            )}

            {/* MANUFACTURER CREATE SECTION */}
            {currentUser.role === 'Manufacturer' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginBottom: '4rem' }}>
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="modern-card" style={{ padding: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Create New Product</h3>
                        <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Material Selection */}
                            <div style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                                <h4 style={{ margin: '0 0 1rem 0' }}>Select Raw Materials ({manufacturerStock.length} available)</h4>
                                {manufacturerStock.length === 0 ? (
                                    <p style={{ color: '#94a3b8' }}>No raw materials in stock. You can still create products, but raw material tracking will be empty.</p>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                                        {manufacturerStock.map(stock => {
                                            const isSelected = selectedMaterials.find(m => m.id === stock.id);
                                            return (
                                                <div key={stock.id} style={{
                                                    border: isSelected ? '1px solid var(--color-primary)' : '1px solid #334155',
                                                    padding: '0.5rem',
                                                    borderRadius: '8px',
                                                    background: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                                    cursor: 'pointer'
                                                }}>
                                                    <div onClick={() => toggleMaterial(stock)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <div style={{ width: '16px', height: '16px', border: '1px solid white', borderRadius: '4px', background: isSelected ? 'var(--color-primary)' : 'transparent' }}></div>
                                                        <span style={{ fontWeight: 'bold' }}>{stock.name}</span>
                                                        <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>(Avail: {stock.balance})</span>
                                                    </div>
                                                    {isSelected && (
                                                        <div style={{ marginTop: '0.5rem' }}>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={stock.balance}
                                                                value={isSelected.quantity}
                                                                onChange={(e) => updateMaterialQuantity(stock.id, e.target.value)}
                                                                style={{ width: '60px', padding: '4px', borderRadius: '4px', border: 'none' }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <input type="text" name="name" placeholder="Product Name" onChange={handleChange} className="modern-input" required value={formData.name} />
                            <input type="text" name="batchId" placeholder="Batch ID" onChange={handleChange} className="modern-input" required value={formData.batchId} />

                            <div className="file-upload-zone" style={{ border: '2px dashed rgba(255,255,255,0.2)', padding: '1rem', textAlign: 'center', cursor: 'pointer' }}>
                                <input type="file" accept="image/*" onChange={handleImageChange} required style={{ width: '100%' }} />
                            </div>

                            <button type="submit" disabled={loading} className="btn-modern">
                                {loading ? 'Creating (with Location)...' : 'Create Product'}
                            </button>
                        </form>
                    </motion.div>

                    {/* QR Result */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        {createdProductId ? (
                            <>
                                <h2 style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>Created!</h2>
                                <QRCodeSVG id="generated-qr-code" value={generatedQR} size={200} />
                                <p style={{ marginTop: '1rem' }}>ID: {formatId(createdProductId)}</p>
                                <button onClick={() => downloadQR('generated-qr-code', `product-${createdProductId}-qr.svg`)} className="btn-modern" style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                                    Download QR
                                </button>
                            </>
                        ) : (
                            <div style={{ opacity: 0.3 }}>
                                <div style={{ fontSize: '3rem' }}>📷</div>
                                <h3>QR Code will appear here</h3>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* INVENTORY & TRANSFER (Standard for all) */}
            {currentUser.role !== 'Raw Material Supplier' && (
                <>
                    <h3 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>My Inventory</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                        {myInventory.map(item => (
                            <motion.div key={item.id} className="modern-card" style={{ padding: '0', overflow: 'hidden' }}>
                                <div style={{ height: '200px', background: '#000' }}>
                                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ padding: '1.5rem' }}>
                                    <h4>{item.name}</h4>
                                    <p style={{ color: '#94a3b8' }}>ID: #{formatId(item.id)}</p>
                                    <p>Status: {statusMap[Number(item.status)]}</p>

                                    {/* Hidden QR for Download */}
                                    <div style={{ display: 'none' }}>
                                        <QRCodeSVG
                                            id={`qr-inventory-${item.id}`}
                                            value={JSON.stringify({ id: item.id, name: item.name, batchId: item.batchId })}
                                            size={200}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                        <button
                                            onClick={() => downloadQR(`qr-inventory-${item.id}`, `product-${item.id}-qr.svg`)}
                                            className="btn-modern"
                                            style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}
                                        >
                                            Download QR
                                        </button>
                                        {currentUser.role !== 'End User' && (
                                            <button onClick={() => selectItemForTransfer(item.id)} className="btn-modern" style={{ flex: 1, fontSize: '0.8rem', padding: '0.5rem' }}>Transfer</button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* TRANSFER SECTION */}
                    {currentUser.role !== 'End User' && (
                        <motion.div id="transfer-section" className="modern-card" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
                            <h3>Transfer Product</h3>
                            <form onSubmit={handleTransferProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <label>Product ID</label>
                                <input type="number" name="productId" value={transferData.productId} onChange={handleTransferChange} className="modern-input" required />

                                <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                                    Target: {nextDestination}
                                </div>

                                {nextDestination === 'End User' && (
                                    <input type="text" name="customAddress" placeholder="Buyer Wallet Address" value={transferData.customAddress} onChange={handleTransferChange} className="modern-input" required />
                                )}

                                <button type="submit" disabled={loading} className="btn-modern">
                                    {loading ? 'Processing (with Location)...' : 'Transfer'}
                                </button>
                            </form>
                        </motion.div>
                    )}
                </>
            )}
        </div>
    );
};

export default Dashboard;
