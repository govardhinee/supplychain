import React, { useState, useEffect, useContext } from 'react';
import { BlockchainContext } from '../context/BlockchainContext';
import { motion } from 'framer-motion';

const Admin = () => {
    const { contract } = useContext(BlockchainContext);
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        created: 0,
        inTransit: 0,
        inWarehouse: 0,
        delivered: 0
    });
    const [contractError, setContractError] = useState('');
    const formatId = (id) => String(id).padStart(4, '0');

    const statusMap = ["Created", "In Transit", "In Warehouse", "Delivered"];
    
    const getRoleFromAddress = (addr) => {
        const lowerAddr = addr.toLowerCase();
        if (lowerAddr === '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266') return 'Manufacturer';
        if (lowerAddr === '0x70997970c51812dc3a010c7d01b50e0d17dc79c8') return 'Warehouse';
        if (lowerAddr === '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc') return 'Supplier';
        if (lowerAddr === '0x90f79bf6eb2c4f870365e785982e1f101e93b906') return 'Retailer';
        return 'End User';
    };

    const fetchAllProducts = async () => {
        if (!contract) {
            alert("Please connect wallet first");
            return;
        }

        setLoading(true);
        setContractError('');
        try {
            const count = await contract.productCount();
            const products = [];
            const statusCounts = {
                total: Number(count),
                created: 0,
                inTransit: 0,
                inWarehouse: 0,
                delivered: 0
            };

            // Fetch all products
            for (let i = 1; i <= Number(count); i++) {
                try {
                    const p = await contract.getProduct(i);
                    const statusIndex = Number(p.status);
                    const statusName = statusMap[statusIndex];
                    
                    // Count by status
                    if (statusIndex === 0) statusCounts.created++;
                    else if (statusIndex === 1) statusCounts.inTransit++;
                    else if (statusIndex === 2) statusCounts.inWarehouse++;
                    else if (statusIndex === 3) statusCounts.delivered++;

                    products.push({
                        id: p.id.toString(),
                        name: p.name,
                        batchId: p.batchId,
                        currentOwner: p.currentOwner,
                        ownerRole: getRoleFromAddress(p.currentOwner),
                        status: statusIndex,
                        statusName: statusName,
                        timestamp: new Date(Number(p.timestamp) * 1000).toLocaleString(),
                        image: p.ipfsHash
                    });
                } catch (err) {
                    console.error(`Error fetching product ${i}:`, err);
                }
            }

            // Sort by ID (newest first)
            products.sort((a, b) => Number(b.id) - Number(a.id));

            setAllProducts(products);
            setStats(statusCounts);
        } catch (error) {
            console.error("Error fetching products:", error);
            if (error.code === 'BAD_DATA') {
                setContractError(
                    "Unable to read products. Make sure your MetaMask network is set to Localhost 8545 and the SupplyChain contract is deployed on the running Hardhat node."
                );
            } else {
                setContractError("Error loading products: " + error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (contract) {
            fetchAllProducts();
        }
    }, [contract]);

    const getStatusBadgeClass = (status) => {
        switch(status) {
            case 0: return 'badge-info';
            case 1: return 'badge-warning';
            case 2: return 'badge-info';
            case 3: return 'badge-success';
            default: return 'badge-info';
        }
    };

    return (
        <div style={{ paddingTop: '120px', paddingBottom: '50px', maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
            <header style={{ marginBottom: '3rem' }}>
                <h1 style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 700,
                    marginBottom: '0.5rem',
                    color: 'var(--color-text)'
                }}>
                    Admin Dashboard
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>
                    View all registered products and their status
                </p>
            </header>

            {/* Statistics Cards */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '1.5rem',
                marginBottom: '3rem'
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="modern-card"
                    style={{ padding: '1.5rem', textAlign: 'center' }}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📦</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
                        {stats.total}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Total Products</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="modern-card"
                    style={{ padding: '1.5rem', textAlign: 'center' }}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✨</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
                        {stats.created}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Created</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="modern-card"
                    style={{ padding: '1.5rem', textAlign: 'center' }}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🚚</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-warning)', marginBottom: '0.25rem' }}>
                        {stats.inTransit}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>In Transit</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="modern-card"
                    style={{ padding: '1.5rem', textAlign: 'center' }}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
                        {stats.inWarehouse}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>In Warehouse</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="modern-card"
                    style={{ padding: '1.5rem', textAlign: 'center' }}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-success)', marginBottom: '0.25rem' }}>
                        {stats.delivered}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>Delivered</div>
                </motion.div>
            </div>

            {/* Actions */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text)' }}>
                    All Products ({allProducts.length})
                </h2>
                <button 
                    onClick={fetchAllProducts}
                    className="btn-modern"
                    disabled={loading}
                    style={{ padding: '0.75rem 1.5rem' }}
                >
                    {loading ? 'Loading...' : '🔄 Refresh'}
                </button>
            </div>

            {/* Products Table/List */}
            {contractError && (
                <div
                    className="modern-card"
                    style={{
                        padding: '1rem 1.25rem',
                        marginBottom: '1.5rem',
                        border: '1px solid rgba(248,113,113,0.6)',
                        background: 'rgba(127,29,29,0.3)',
                        color: '#fee2e2',
                        fontSize: '0.9rem'
                    }}
                >
                    {contractError}
                </div>
            )}

            {loading ? (
                <div className="modern-card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <div className="spinner" style={{ margin: '0 auto' }}></div>
                    <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>Loading products...</p>
                </div>
            ) : allProducts.length === 0 ? (
                <div className="modern-card" style={{ padding: '3rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.6 }}>📭</div>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>
                        No products registered yet
                    </p>
                </div>
            ) : (
                <div className="modern-card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ 
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    borderBottom: '2px solid var(--color-border)'
                                }}>
                                    <th style={{ 
                                        padding: '1rem', 
                                        textAlign: 'left', 
                                        fontWeight: 600,
                                        color: 'var(--color-text)',
                                        fontSize: '0.875rem'
                                    }}>ID</th>
                                    <th style={{ 
                                        padding: '1rem', 
                                        textAlign: 'left', 
                                        fontWeight: 600,
                                        color: 'var(--color-text)',
                                        fontSize: '0.875rem'
                                    }}>Product Name</th>
                                    <th style={{ 
                                        padding: '1rem', 
                                        textAlign: 'left', 
                                        fontWeight: 600,
                                        color: 'var(--color-text)',
                                        fontSize: '0.875rem'
                                    }}>Batch ID</th>
                                    <th style={{ 
                                        padding: '1rem', 
                                        textAlign: 'left', 
                                        fontWeight: 600,
                                        color: 'var(--color-text)',
                                        fontSize: '0.875rem'
                                    }}>Current Owner</th>
                                    <th style={{ 
                                        padding: '1rem', 
                                        textAlign: 'left', 
                                        fontWeight: 600,
                                        color: 'var(--color-text)',
                                        fontSize: '0.875rem'
                                    }}>Status</th>
                                    <th style={{ 
                                        padding: '1rem', 
                                        textAlign: 'left', 
                                        fontWeight: 600,
                                        color: 'var(--color-text)',
                                        fontSize: '0.875rem'
                                    }}>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allProducts.map((product, idx) => (
                                    <motion.tr
                                        key={product.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        style={{
                                            borderBottom: '1px solid var(--color-border)',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                        }}
                                    >
                                        <td style={{ padding: '1rem', color: 'var(--color-primary)', fontWeight: 600, fontFamily: 'monospace' }}>
                                            #{formatId(product.id)}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--color-text)', fontWeight: 500 }}>
                                            {product.name}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                                            {product.batchId}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div>
                                                <div style={{ color: 'var(--color-text)', fontWeight: 500, marginBottom: '0.25rem' }}>
                                                    {product.ownerRole}
                                                </div>
                                                <div style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                    {product.currentOwner.slice(0, 10)}...{product.currentOwner.slice(-6)}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span className={`badge ${getStatusBadgeClass(product.status)}`}>
                                                {product.statusName}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                            {product.timestamp}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
