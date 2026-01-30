import React, { useState, useContext, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BlockchainContext } from '../context/BlockchainContext';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const { contract, currentAccount, currentUser } = useContext(BlockchainContext);
    const [formData, setFormData] = useState({ name: '', batchId: '' });

    // State for Transfer
    const [transferData, setTransferData] = useState({ productId: '', nextRole: '', customAddress: '' });

    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(null);
    const [generatedQR, setGeneratedQR] = useState(null);
    const [createdProductId, setCreatedProductId] = useState(null);

    // Inventory State
    const [myInventory, setMyInventory] = useState([]);
    const [isInventoryLoading, setIsInventoryLoading] = useState(false);

    // --- Helpers ---
    const handleTransferChange = (e) => setTransferData({ ...transferData, [e.target.name]: e.target.value });
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleImageChange = (e) => setImage(e.target.files[0]);

    // STRICT SUPPLY CHAIN FLOW
    const supplyChainFlow = {
        'Manufacturer': 'Warehouse',
        'Warehouse': 'Supplier',
        'Supplier': 'Retailer',
        'Retailer': 'End User' // End User has no fixed role wallet, assumes custom input
    };

    // Pre-defined addresses for the demo
    const roleWallets = {
        'Warehouse': '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
        'Supplier': '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
        'Retailer': '0x90f79bf6eb2c4f870365e785982e1f101e93b906'
    };

    const statusMap = ["Created", "In Transit", "In Warehouse", "Delivered"];
    const formatId = (id) => String(id).padStart(4, '0');

    // --- Fetch Inventory ---
    const fetchInventory = async () => {
        if (!contract || !currentAccount) return;
        setIsInventoryLoading(true);
        try {
            const count = await contract.productCount();
            const items = [];
            // Iterate backwards to show newest first
            for (let i = Number(count); i >= 1; i--) {
                const p = await contract.getProduct(i);
                // Check case-insensitive address match
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

    useEffect(() => {
        fetchInventory();
    }, [contract, currentAccount]);

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
            console.error(error);
            return null;
        }
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        if (!contract) return alert("Contract not loaded");

        try {
            setLoading(true);
            let ipfsHash = "No Image";
            if (image) {
                ipfsHash = await uploadImage();
            }

            const { name, batchId } = formData;

            const tx = await contract.createProduct(name, batchId, ipfsHash);
            await tx.wait();

            // Get the new ID
            const count = await contract.productCount();
            const newId = count.toString();
            setCreatedProductId(newId);

            const qrPayload = JSON.stringify({ id: newId, name, batchId });
            setGeneratedQR(qrPayload);

            setLoading(false);
            alert("Product Created! ID: " + newId);
            fetchInventory(); // Refresh list
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
            const { productId } = transferData;

            // Enforce Flow
            const nextRole = supplyChainFlow[currentUser.role];
            if (!nextRole) return alert("Your role cannot transfer products.");

            let targetAddress = roleWallets[nextRole];

            // If selling to End User or if address not in hardcoded list, use custom input (optional feature, strictly enforcing demo flow first)
            if (nextRole === 'End User') {
                // For demo simplicity: Retailer -> End User, we might need a custom address input or just transfer to a dummy End User wallet
                // Let's ask for custom address if it's End User
                if (!transferData.customAddress) {
                    setLoading(false);
                    return alert("Please enter the Buyer's Wallet Address for End User transfer.");
                }
                targetAddress = transferData.customAddress;
            }

            let statusInt = 0;
            // Auto-set status based on destination
            if (nextRole === 'Warehouse') statusInt = 2; // In Warehouse
            if (nextRole === 'Supplier') statusInt = 1; // In Transit (back to supplier?) or maybe generic "In Possession"
            // Let's keep it simple: Warehouse=2, Delivered=3. Intermediate steps just Map to InTransit=1 or keep current.
            // Correct mapping per user request: Mfg -> Warehouse (Stat: In Warehouse). Warehouse -> Supplier (Stat: In Transit/Held). 
            if (nextRole === 'Warehouse') statusInt = 2;
            else if (nextRole === 'End User') statusInt = 3; // Delivered
            else statusInt = 1; // In Transit/Processing for others

            if (!targetAddress) return alert("System Error: No wallet found for " + nextRole);

            const tx = await contract.transferProduct(productId, targetAddress, statusInt);
            await tx.wait();

            setLoading(false);
            alert(`Transferred to ${nextRole} Successfully!`);
            fetchInventory(); // Refresh list (item should disappear)
            setTransferData({ productId: '', nextRole: '', customAddress: '' });
        } catch (error) {
            console.error(error);
            setLoading(false);
            alert(error.message);
        }
    };

    // Helper to select item from inventory to transfer
    const selectItemForTransfer = (id) => {
        setTransferData({ ...transferData, productId: id });
        // Scroll to transfer section
        document.getElementById('transfer-section').scrollIntoView({ behavior: 'smooth' });
    };

    if (!currentUser) return <div style={{ paddingTop: '120px', textAlign: 'center' }}><h2>Please Login</h2></div>;

    const nextDestination = supplyChainFlow[currentUser.role];
    const hasDeliveredItems = myInventory.some(item => statusMap[Number(item.status)] === 'Delivered');

    return (
        <div style={{ paddingTop: '120px', paddingBottom: '50px', maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>

            <header style={{ marginBottom: '3rem', marginTop: '0', paddingTop: '0' }}>
                <motion.h2 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ 
                        fontSize: '2.5rem', 
                        marginBottom: '1rem', 
                        marginTop: '0',
                        paddingTop: '0',
                        fontWeight: 700,
                        color: 'var(--color-text)'
                    }}
                >
                    {currentUser.role} Dashboard
                </motion.h2>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="modern-card"
                    style={{ 
                        padding: '1.25rem 1.5rem', 
                        display: 'inline-flex',
                        gap: '2rem',
                        alignItems: 'center'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>User:</span>
                        <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{currentUser.username}</span>
                    </div>
                    <div style={{ width: '1px', height: '24px', background: 'var(--color-border)' }}></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ color: 'var(--color-text-muted)' }}>Inventory:</span>
                        <span style={{ 
                            color: 'var(--color-primary)', 
                            fontWeight: 700,
                            fontSize: '1.125rem'
                        }}>{myInventory.length} Items</span>
                    </div>
                </motion.div>

                {currentUser.role === 'End User' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="modern-card"
                        style={{ marginTop: '1.5rem', padding: '1.25rem 1.5rem', maxWidth: '700px', marginLeft: 'auto', marginRight: 'auto' }}
                    >
                        <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                            As an <b>End User</b>, the products shown below are those that have been transferred to your wallet.
                            {hasDeliveredItems
                                ? ' Any item with status \"Delivered\" confirms the product has successfully reached you.'
                                : ' Once a product status becomes \"Delivered\", you can be sure it has reached you.'}
                        </p>
                    </motion.div>
                )}
                {/* Wallet Mismatch Warning */}
                {currentAccount && currentUser.walletAddress && currentAccount.toLowerCase() !== currentUser.walletAddress.toLowerCase() && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: 'rgba(239, 68, 68, 0.2)',
                            border: '1px solid #ef4444',
                            padding: '1rem',
                            borderRadius: '12px',
                            marginTop: '2rem',
                            color: '#fca5a5',
                            maxWidth: '600px',
                            marginLeft: 'auto',
                            marginRight: 'auto'
                        }}
                    >
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>⚠️ Wallet Mismatch Detected</h3>
                        <p>You are logged in as <b>{currentUser.role}</b> but connected to the wrong wallet.</p>
                        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '8px', marginTop: '0.5rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                            Current: {currentAccount}<br />
                            Expected: {currentUser.walletAddress}
                        </div>
                        <p style={{ marginTop: '0.5rem', fontWeight: 'bold' }}>Please switch accounts in MetaMask to see your inventory.</p>
                    </motion.div>
                )}
            </header>

            {/* CREATE SECTION (Manufacturer Only) */}
            {currentUser.role === 'Manufacturer' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>

                    {/* Form Column */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }} 
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="modern-card" 
                        style={{ padding: '2rem' }}
                    >
                        <h3 style={{ 
                            fontSize: '1.5rem', 
                            fontWeight: 700, 
                            marginBottom: '1.5rem',
                            color: 'var(--color-text)'
                        }}>
                            Create New Product
                        </h3>
                        <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ 
                                    color: 'var(--color-text-muted)', 
                                    fontSize: '0.875rem', 
                                    marginBottom: '0.5rem', 
                                    display: 'block',
                                    fontWeight: 500
                                }}>
                                    Product Name
                                </label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    placeholder="Enter product name" 
                                    onChange={handleChange} 
                                    className="modern-input" 
                                    required 
                                />
                            </div>
                            <div>
                                <label style={{ 
                                    color: 'var(--color-text-muted)', 
                                    fontSize: '0.875rem', 
                                    marginBottom: '0.5rem', 
                                    display: 'block',
                                    fontWeight: 500
                                }}>
                                    Batch Identifier
                                </label>
                                <input 
                                    type="text" 
                                    name="batchId" 
                                    placeholder="Enter batch ID" 
                                    onChange={handleChange} 
                                    className="modern-input" 
                                    required 
                                />
                            </div>
                            <div style={{ 
                                background: 'rgba(99, 102, 241, 0.1)', 
                                padding: '2rem', 
                                borderRadius: '16px', 
                                border: '2px dashed rgba(99, 102, 241, 0.3)', 
                                textAlign: 'center',
                                transition: 'all 0.3s',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
                                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)';
                                e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)';
                            }}
                            >
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📷</div>
                                <label style={{ display: 'block', marginBottom: '1rem', fontSize: '1rem', color: '#cbd5e1', fontWeight: 'bold' }}>Upload Product Image</label>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleImageChange} 
                                    required 
                                    style={{ 
                                        color: 'white', 
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        padding: '0.5rem'
                                    }} 
                                />
                            </div>
                            <button type="submit" disabled={loading} className="btn-modern" style={{ marginTop: '0.5rem', width: '100%' }}>
                                {loading ? 'Creating...' : 'Create Product'}
                            </button>
                        </form>
                    </motion.div>

                    {/* QR Result Column */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '500px' }}>
                        {createdProductId ? (
                            <>
                                <h2 style={{ color: 'var(--color-primary)', marginBottom: '1rem', fontSize: '2rem' }}>Ready for Transfer!</h2>
                                <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
                                    Product ID: <b style={{ color: 'white' }}>{formatId(createdProductId)}</b>
                                </p>
                                <div style={{ background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                                    <QRCodeSVG value={generatedQR} size={250} />
                                </div>
                            </>
                        ) : (
                            <div style={{ opacity: 0.3 }}>
                                <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>📷</div>
                                <h3>QR Code will appear here</h3>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {/* INVENTORY GRID */}
            <div style={{ marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <h3 style={{ 
                        fontSize: '1.75rem', 
                        fontWeight: 700,
                        color: 'var(--color-text)'
                    }}>
                        My Inventory
                    </h3>
                    {myInventory.length > 0 && (
                        <span className="badge badge-info">
                            {myInventory.length} {myInventory.length === 1 ? 'Item' : 'Items'}
                        </span>
                    )}
                </div>
            </div>

            {myInventory.length === 0 ? (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="modern-card" 
                    style={{ 
                        padding: '3rem', 
                        textAlign: 'center', 
                        maxWidth: '500px', 
                        margin: '0 auto' 
                    }}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.6 }}>📦</div>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', fontWeight: 500 }}>
                        No products in your inventory
                    </p>
                </motion.div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '3rem' }}>
                    {myInventory.map(item => (

                        <motion.div
                            layout
                            key={item.id}
                            className="modern-card"
                            whileHover={{ y: -4 }}
                            style={{ padding: '0', display: 'flex', gap: '0', overflow: 'hidden' }}
                        >
                            {/* Image Section - Fixed Width */}
                            <div style={{ width: '250px', minWidth: '250px', background: '#000', position: 'relative' }}>
                                <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', backdropFilter: 'blur(4px)' }}>
                                    Current Owner
                                </div>
                            </div>

                            {/* Content Section - Flex Grow */}
                            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div>
                                        <h4 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: 'white' }}>{item.name}</h4>
                                        <span style={{ fontSize: '0.9rem', color: '#94a3b8', display: 'block' }}>Batch: {item.batchId}</span>
                                        <span style={{ 
                                            marginTop: '0.25rem',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            fontSize: '0.8rem',
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '999px',
                                            background: 'rgba(15,23,42,0.7)',
                                            border: '1px solid rgba(148,163,184,0.4)',
                                            color: '#e5e7eb'
                                        }}>
                                            <span style={{ fontSize: '0.9rem' }}>
                                                {statusMap[Number(item.status)] === 'Delivered'
                                                    ? '✅'
                                                    : statusMap[Number(item.status)] === 'In Warehouse'
                                                    ? '📦'
                                                    : '🚚'}
                                            </span>
                                            <span>Status: {statusMap[Number(item.status)]}</span>
                                        </span>
                                    </div>
                                    <div style={{ 
                                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(168, 85, 247, 0.3))', 
                                        color: '#a5b4fc', 
                                        padding: '0.5rem 1rem', 
                                        borderRadius: '10px', 
                                        border: '1px solid rgba(99, 102, 241, 0.4)', 
                                        fontWeight: 700,
                                        fontSize: '0.9rem',
                                        boxShadow: '0 4px 15px rgba(99, 102, 241, 0.2)'
                                    }}>
                                        #{formatId(item.id)}
                                    </div>
                                </div>

                                <div style={{ marginTop: 'auto', display: 'flex', gap: '2rem', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{ background: 'white', padding: '5px', borderRadius: '8px' }}>
                                            <QRCodeSVG
                                                id={`qr-${item.id}`}
                                                value={JSON.stringify({ id: item.id, name: item.name, batchId: item.batchId })}
                                                size={60}
                                            />
                                        </div>
                                        <a href="#" className="text-gradient" style={{ fontSize: '0.9rem', fontWeight: 'bold' }} onClick={(e) => {
                                            e.preventDefault();
                                            const svg = document.getElementById(`qr-${item.id}`);
                                            const svgData = new XMLSerializer().serializeToString(svg);
                                            const canvas = document.createElement("canvas");
                                            const ctx = canvas.getContext("2d");
                                            const img = new Image();
                                            img.onload = () => {
                                                canvas.width = img.width;
                                                canvas.height = img.height;
                                                ctx.drawImage(img, 0, 0);
                                                const pngFile = canvas.toDataURL("image/png");
                                                const downloadLink = document.createElement("a");
                                                downloadLink.download = `Product-${item.id}-QR.png`;
                                                downloadLink.href = pngFile;
                                                downloadLink.click();
                                            };
                                            img.src = "data:image/svg+xml;base64," + btoa(svgData);
                                        }}>
                                            ⬇ QR
                                        </a>
                                    </div>

                                    {currentUser.role !== 'End User' && (
                                        <button
                                            onClick={() => selectItemForTransfer(item.id)}
                                            className="btn-modern"
                                            style={{ marginLeft: 'auto', padding: '0.75rem 1.5rem', fontSize: '0.875rem' }}
                                        >
                                            Transfer
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* TRANSFER SECTION (hidden for End User) */}
            {currentUser.role !== 'End User' && (
                <motion.div 
                    id="transfer-section" 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="modern-card" 
                    style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}
                >
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>
                        Transfer Product
                    </h3>


                    <form onSubmit={handleTransferProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Product ID</label>
                            <input type="number" name="productId" placeholder="Select from inventory above" value={transferData.productId} onChange={handleTransferChange} required className="input-premium" />
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Target Destination</label>
                            <div style={{ padding: '1.2rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', border: '1px solid var(--color-primary)', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '1.5rem' }}>📍</span> {nextDestination}
                            </div>
                        </div>

                        {nextDestination === 'End User' && (
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.9rem', color: '#cbd5e1' }}>Buyer Wallet Address</label>
                                <input type="text" name="customAddress" placeholder="e.g. 0x..." value={transferData.customAddress} onChange={handleTransferChange} required className="input-premium" />
                            </div>
                        )}

                        <button type="submit" disabled={loading} className="btn-modern" style={{ gridColumn: '1 / -1', width: '100%' }}>
                            {loading ? 'Processing...' : `Transfer to ${nextDestination}`}
                        </button>
                    </form>
                </motion.div>
            )}

        </div>
    );
};

export default Dashboard;
