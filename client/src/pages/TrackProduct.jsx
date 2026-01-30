import React, { useState, useContext, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { BlockchainContext } from '../context/BlockchainContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5QrcodeScanner } from 'html5-qrcode';

const TrackProduct = () => {
    const { contract } = useContext(BlockchainContext);
    const [searchId, setSearchId] = useState('');
    const [productData, setProductData] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [isCounterfeit, setIsCounterfeit] = useState(false);
    const [scanMeta, setScanMeta] = useState(null); // data encoded in QR (optional)

    const formatId = (id) => String(id).padStart(4, '0');

    useEffect(() => {
        if (showScanner) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
            );
            scanner.render(onScanSuccess, onScanFailure);

            function onScanSuccess(decodedText, decodedResult) {
                // Handle scanned string: expect JSON "{id: 1, ...}" or just "1"
                let idToSearch = decodedText;
                let meta = null;
                try {
                    const parsed = JSON.parse(decodedText);
                    if (parsed.id) idToSearch = parsed.id;
                    if (parsed.name || parsed.batchId) {
                        meta = {
                            name: parsed.name || null,
                            batchId: parsed.batchId || null
                        };
                    }
                } catch (e) {
                    // Not JSON, assume raw ID
                }
                setSearchId(idToSearch);
                setScanMeta(meta);
                setShowScanner(false);
                scanner.clear();
                // Trigger search automatically
                fetchData(idToSearch);
            }

            function onScanFailure(error) {
                // handle scan failure, usually better to ignore and keep scanning.
                // console.warn(`Code scan error = ${error}`);
            }

            return () => {
                scanner.clear().catch(error => console.error("Failed to clear html5-qrcode scanner. ", error));
            };
        }
    }, [showScanner]);

    const fetchData = async (id) => {
        if (!contract) return alert("Please connect wallet first (or ensure Localhost is open).");

        setLoading(true);
        setError('');
        setIsCounterfeit(false);
        setProductData(null);
        setHistoryData([]);

        try {
            const product = await contract.getProduct(id);
            if (product.id.toString() === '0') {
                throw new Error("PRODUCT_NOT_FOUND");
            }

            const history = await contract.getHistory(id);

            const statusMap = ["Created", "In Transit", "In Warehouse", "Delivered"];
            const getRole = (addr) => {
                const lowerAddr = addr.toLowerCase();
                if (lowerAddr === '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266') return 'Manufacturer';
                if (lowerAddr === '0x70997970c51812dc3a010c7d01b50e0d17dc79c8') return 'Warehouse';
                if (lowerAddr === '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc') return 'Supplier';
                if (lowerAddr === '0x90f79bf6eb2c4f870365e785982e1f101e93b906') return 'Retailer';
                return 'End User / Unknown';
            };

            const normalized = {
                id: product.id.toString(),
                name: product.name,
                batchId: product.batchId,
                owner: product.currentOwner,
                status: statusMap[Number(product.status)],
                image: product.ipfsHash
            };
            setProductData(normalized);

            const formattedHistory = history.map(item => ({
                owner: item.owner,
                role: getRole(item.owner),
                status: statusMap[Number(item.status)],
                timestamp: new Date(Number(item.timestamp) * 1000).toLocaleString()
            }));
            setHistoryData(formattedHistory);

            // If QR contained extra information (name / batch), validate against chain
            if (scanMeta && (scanMeta.name || scanMeta.batchId)) {
                const nameMismatch = scanMeta.name && scanMeta.name !== normalized.name;
                const batchMismatch = scanMeta.batchId && scanMeta.batchId !== normalized.batchId;
                if (nameMismatch || batchMismatch) {
                    setIsCounterfeit(true);
                    setError(
                        "Warning: QR details do not match blockchain record. This QR code may have been reused (possible counterfeit)."
                    );
                }
            }

        } catch (err) {
            console.error(err);
            if (err.message === "PRODUCT_NOT_FOUND") {
                setIsCounterfeit(true);
                setError("Counterfeit alert: This product ID does not exist on the blockchain (possible fake product).");
            } else {
                setIsCounterfeit(false);
                setError("Unable to fetch product details. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleManualSearch = (e) => {
        e.preventDefault();
        setScanMeta(null); // manual search: no embedded QR meta to compare
        fetchData(searchId);
    };

    return (
        <div style={{ paddingTop: '120px', paddingBottom: '50px', maxWidth: '900px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' }}>

            <header style={{ marginBottom: '3rem' }}>
                <motion.h2 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ 
                        fontSize: '2.5rem', 
                        marginBottom: '0.75rem', 
                        fontWeight: 700,
                        color: 'var(--color-text)'
                    }}
                >
                    Track Product
                </motion.h2>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}
                >
                    Scan QR code or enter product ID
                </motion.p>
            </header>

            {/* SEARCH / SCAN AREA */}
            <motion.div 
                initial={{ y: 20, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                className="modern-card" 
                style={{ padding: '2rem', marginBottom: '2rem' }}
            >

                {!showScanner ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowScanner(true)}
                            className="btn-modern"
                            style={{
                                padding: '1rem 2rem',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}
                        >
                            📸 Scan QR Code
                        </motion.button>
                        <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)', margin: '1rem 0' }}></div>

                        <form onSubmit={handleManualSearch} style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                            <input
                                type="number"
                                placeholder="Enter Product ID"
                                value={searchId}
                                onChange={(e) => setSearchId(e.target.value)}
                                className="modern-input"
                                style={{ flex: 1 }}
                            />
                            <button type="submit" disabled={loading} className="btn-modern" style={{ width: 'auto' }}>
                                {loading ? '...' : 'Search'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <div id="reader" style={{ width: '100%', maxWidth: '500px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden' }}></div>
                        <button
                            onClick={() => setShowScanner(false)}
                            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'red', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                        >
                            Stop Scanning
                        </button>
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            marginTop: '1.25rem',
                            borderRadius: '12px',
                            padding: '0.9rem 1rem',
                            border: isCounterfeit ? '1px solid rgba(248,113,113,0.7)' : '1px solid rgba(148,163,184,0.5)',
                            background: isCounterfeit ? 'rgba(127,29,29,0.4)' : 'rgba(15,23,42,0.8)',
                            color: isCounterfeit ? '#fecaca' : 'var(--color-text-muted)',
                            textAlign: 'center',
                            fontSize: '0.9rem'
                        }}
                    >
                        {isCounterfeit ? '🚨 ' : ''}{error}
                    </div>
                )}
            </motion.div>

            {/* RESULTS AREA */}
            <AnimatePresence>
                {productData && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0 }} 
                        className="modern-card" 
                        style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}
                    >

                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                            <div style={{ position: 'relative' }}>
                                <img src={productData.image} alt="Product" style={{ width: '200px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                                {/* QR Code Overlay (Small) */}
                                <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', background: 'white', padding: '5px', borderRadius: '8px', border: '2px solid black' }}>
                                    <QRCodeSVG value={JSON.stringify({ id: productData.id })} size={64} />
                                </div>
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <h2 style={{ fontSize: '2.5rem', margin: 0, lineHeight: 1.1 }}>{productData.name}</h2>
                                    <span style={{ fontSize: '3rem', fontWeight: 900, color: 'rgba(255,255,255,0.05)' }}>
                                        #{formatId(productData.id)}
                                    </span>
                                </div>
                                <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>Batch: {productData.batchId}</p>

                                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div style={{ 
                                        padding: '0.7rem 1.5rem', 
                                        background: productData.status === 'Delivered' 
                                            ? 'rgba(16, 185, 129, 0.2)' 
                                            : productData.status === 'In Warehouse'
                                            ? 'rgba(59, 130, 246, 0.2)'
                                            : 'rgba(245, 158, 11, 0.2)',
                                        borderRadius: '50px', 
                                        fontWeight: 700,
                                        fontSize: '0.9rem',
                                        border: `1px solid ${productData.status === 'Delivered' 
                                            ? 'rgba(16, 185, 129, 0.4)' 
                                            : productData.status === 'In Warehouse'
                                            ? 'rgba(59, 130, 246, 0.4)'
                                            : 'rgba(245, 158, 11, 0.4)'}`,
                                        color: productData.status === 'Delivered' 
                                            ? '#34d399' 
                                            : productData.status === 'In Warehouse'
                                            ? '#60a5fa'
                                            : '#fbbf24',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}>
                                        <span style={{ fontSize: '1.2rem' }}>
                                            {productData.status === 'Delivered' ? '✅' : productData.status === 'In Warehouse' ? '📦' : '🚚'}
                                        </span>
                                        Status: {productData.status}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '2rem', marginBottom: '1.5rem' }}>
                            <h3 style={{ 
                                fontSize: '1.5rem', 
                                fontWeight: 700,
                                margin: 0,
                                color: 'var(--color-text)'
                            }}>
                                Supply Chain Journey
                            </h3>
                        </div>



                        <div style={{ position: 'relative', borderLeft: '2px solid rgba(255,255,255,0.1)', marginLeft: '1rem', paddingLeft: '2rem' }}>
                            {/* Fixed Timeline Stages */}
                            {['Manufacturer', 'Warehouse', 'Supplier', 'Retailer', 'End User'].map((stage, index) => {
                                // Find if this stage exists in history
                                const step = historyData.find(h => h.role.includes(stage)) ||
                                    (stage === 'End User' ? historyData.find(h => h.role.includes('Unknown')) : null);

                                const isCompleted = !!step;
                                const isCurrent = productData.owner.toLowerCase() === (step?.owner?.toLowerCase() || '');

                                return (
                                    <div key={index} style={{ marginBottom: '2rem', position: 'relative', opacity: isCompleted ? 1 : 0.5 }}>
                                        {/* Timeline Dot */}
                                        <motion.div 
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: index * 0.1 }}
                                            style={{
                                                position: 'absolute', 
                                                left: '-2.6rem', 
                                                top: '0', 
                                                width: '1.4rem', 
                                                height: '1.4rem',
                                                background: isCompleted 
                                                    ? 'linear-gradient(135deg, #10b981, #34d399)' 
                                                    : 'linear-gradient(135deg, #334155, #475569)',
                                                borderRadius: '50%', 
                                                border: `3px solid ${isCompleted ? '#0f172a' : '#1e293b'}`,
                                                boxShadow: isCompleted 
                                                    ? '0 0 20px rgba(16, 185, 129, 0.6), 0 0 40px rgba(16, 185, 129, 0.3)' 
                                                    : 'none',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {isCompleted && (
                                                <span style={{ fontSize: '0.7rem' }}>✓</span>
                                            )}
                                        </motion.div>

                                        {/* Content */}
                                        {isCompleted ? (
                                            <>
                                                <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{step.timestamp}</span>
                                                <h4 style={{ fontSize: '1.2rem', margin: '0.2rem 0', color: stage === 'End User' ? '#10b981' : 'white' }}>
                                                    {stage} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>({step.status})</span>
                                                </h4>
                                                <p style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#64748b' }}>Wallet: {step.owner}</p>
                                            </>
                                        ) : (
                                            <>
                                                <span style={{ color: '#64748b', fontSize: '0.9rem' }}>Pending</span>
                                                <h4 style={{ fontSize: '1.2rem', margin: '0.2rem 0', color: '#cbd5e1' }}>
                                                    {stage}
                                                </h4>
                                                <p style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#475569' }}>Not yet reached</p>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* EXTRA INFO PANEL (similar to table style) */}
                        <div
                            style={{
                                marginTop: '2rem',
                                borderRadius: '16px',
                                border: '1px solid rgba(148,163,184,0.4)',
                                overflow: 'hidden',
                                background: 'rgba(15,23,42,0.9)'
                            }}
                        >
                            {[
                                { label: 'Current Owner', value: productData.owner },
                                { label: 'Current Role', value: historyData.length ? historyData[historyData.length - 1].role : 'Unknown' },
                                { label: 'Delivery Status', value: productData.status === 'Delivered' ? 'Delivered to End User' : 'Not yet delivered' },
                                { label: 'On-chain Product ID', value: `#${formatId(productData.id)}` },
                                { label: 'Authenticity', value: 'Verified on blockchain' }
                            ].map((row, idx) => (
                                <div
                                    key={row.label}
                                    style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        padding: '0.6rem 1rem',
                                        background: idx % 2 === 0 ? 'rgba(15,23,42,0.9)' : 'rgba(15,23,42,0.7)'
                                    }}
                                >
                                    <div style={{ flex: '0 0 180px', fontWeight: 600, color: '#e5e7eb', fontSize: '0.9rem' }}>
                                        {row.label}:
                                    </div>
                                    <div style={{ flex: 1, color: '#cbd5e1', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                                        {row.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>

            {/* COUNTERFEIT INFORMATION PANEL */}
            {isCounterfeit && !productData && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="modern-card"
                    style={{
                        marginTop: '1.5rem',
                        padding: '1.5rem',
                        border: '1px solid rgba(248,113,113,0.6)',
                        background: 'rgba(127,29,29,0.4)'
                    }}
                >
                    <h3 style={{ marginTop: 0, marginBottom: '0.75rem', color: '#fecaca', fontSize: '1.25rem' }}>
                        Counterfeit (Fake Product) Suspected
                    </h3>
                    <p style={{ margin: 0, color: '#fee2e2', fontSize: '0.9rem' }}>
                        The scanned Product ID does not exist in the blockchain ledger. Please double‑check the QR code
                        or contact the manufacturer / retailer to verify authenticity.
                    </p>
                </motion.div>
            )}

        </div>
    );
};

export default TrackProduct;
