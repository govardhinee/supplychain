import { AnimatePresence, motion } from 'framer-motion';
import { Html5QrcodeScanner } from 'html5-qrcode';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { QRCodeSVG } from 'qrcode.react';
import { useContext, useEffect, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { BlockchainContext } from '../context/BlockchainContext';

// Fix Leaflet Default Icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MapUpdater = ({ locations }) => {
    const map = useMap();
    useEffect(() => {
        if (locations.length > 0) {
            const bounds = L.latLngBounds(locations.map(l => [parseFloat(l.lat), parseFloat(l.long)]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [locations, map]);
    return null;
};

const LocationName = ({ lat, long }) => {
    const [name, setName] = useState('Loading...');

    useEffect(() => {
        if (!lat || !long || lat === "0" || long === "0") {
            setName("Unknown Location");
            return;
        }

        const fetchName = async () => {
            try {
                // Using BigDataCloud's free client-side reverse geocoding API to prevent CORS/User-Agent blocking
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${long}&localityLanguage=en`);
                if (!response.ok) throw new Error("Failed to fetch");
                const data = await response.json();

                if (data.city || data.locality || data.principalSubdivision) {
                    const place = data.city || data.locality || data.principalSubdivision;
                    const country = data.countryName || '';
                    setName(place ? `${place}${country ? `, ${country}` : ''}` : country);
                } else {
                    setName(`${parseFloat(lat).toFixed(4)}, ${parseFloat(long).toFixed(4)}`);
                }
            } catch (e) {
                console.warn("Reverse geocode failed:", e);
                setName(`${parseFloat(lat).toFixed(4)}, ${parseFloat(long).toFixed(4)}`);
            }
        };
        fetchName();
    }, [lat, long]);

    return <span style={{ color: '#60a5fa' }}>{name}</span>;
};

const CertificateDisplay = ({ value }) => {
    if (!value) return <span style={{ color: '#64748b' }}>No certificate</span>;

    if (value.startsWith('http')) {
        return (
            <a href={value} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                View Certificate ↗
            </a>
        );
    }
    return <span>{value}</span>;
};


const TrackProduct = () => {
    const { contract } = useContext(BlockchainContext);
    const [searchId, setSearchId] = useState('');
    const [productData, setProductData] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [rawMaterials, setRawMaterials] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showScanner, setShowScanner] = useState(false);
    const [isCounterfeit, setIsCounterfeit] = useState(false);
    const [scanMeta, setScanMeta] = useState(null);

    const formatId = (id) => String(id).padStart(4, '0');

    useEffect(() => {
        if (showScanner) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );
            scanner.render(onScanSuccess, onScanFailure);

            function onScanSuccess(decodedText, decodedResult) {
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
                    // Not JSON
                }
                setSearchId(idToSearch);
                setScanMeta(meta);
                setShowScanner(false);
                scanner.clear();
                fetchData(idToSearch);
            }

            function onScanFailure(error) {
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
        setRawMaterials([]);

        try {
            const product = await contract.getProduct(id);
            if (product.id.toString() === '0') {
                throw new Error("PRODUCT_NOT_FOUND");
            }

            const history = await contract.getHistory(id);
            const materialsUsed = await contract.getProductRawMaterials(id);

            // Fetch Material Details
            const materials = [];
            for (let i = 0; i < materialsUsed.length; i++) {
                const m = materialsUsed[i];
                const matDetails = await contract.getRawMaterial(m.materialId);
                materials.push({
                    name: matDetails.name,
                    quantity: m.quantity.toString(),
                    supplier: matDetails.supplier,
                    certificate: matDetails.certificateHash,
                    lat: matDetails.lat,
                    long: matDetails.long
                });
            }
            setRawMaterials(materials);

            const statusMap = ["Created", "In Transit", "In Warehouse", "Delivered"];
            const getRole = (addr) => {
                const lowerAddr = addr.toLowerCase();
                if (lowerAddr === '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266') return 'Manufacturer'; // Default
                if (lowerAddr === '0x70997970c51812dc3a010c7d01b50e0d17dc79c8') return 'Warehouse';
                if (lowerAddr === '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc') return 'Supplier';
                if (lowerAddr === '0x90f79bf6eb2c4f870365e785982e1f101e93b906') return 'Retailer';
                // Check if unknown is Raw Material Supplier
                if (lowerAddr === '0xcd3b766cCdD6Ae721141F452C550Ca635964ce71'.toLowerCase()) return 'Raw Material Supplier';
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
                timestamp: new Date(Number(item.timestamp) * 1000).toLocaleString(),
                lat: item.lat,
                long: item.long
            }));
            setHistoryData(formattedHistory);

            if (scanMeta && (scanMeta.name || scanMeta.batchId)) {
                const nameMismatch = scanMeta.name && scanMeta.name !== normalized.name;
                const batchMismatch = scanMeta.batchId && scanMeta.batchId !== normalized.batchId;
                if (nameMismatch || batchMismatch) {
                    setIsCounterfeit(true);
                    setError("Warning: QR details do not match blockchain record.");
                }
            }

        } catch (err) {
            console.error(err);
            if (err.message === "PRODUCT_NOT_FOUND") {
                setIsCounterfeit(true);
                setError("Counterfeit alert: This product ID does not exist on the blockchain.");
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
        setScanMeta(null);
        fetchData(searchId);
    };

    // Calculate map center and bounds
    const rawMaterialLocations = rawMaterials
        .filter(m => m.lat && m.long && m.lat !== "0" && m.long !== "0")
        .map(m => ({
            lat: m.lat,
            long: m.long,
            role: 'Raw Material',
            status: `Supplied: ${m.name}`,
            timestamp: 'Origin'
        }));

    const historyLocations = historyData.filter(h => h.lat && h.long && h.lat !== "0" && h.long !== "0");
    const validLocations = [...rawMaterialLocations, ...historyLocations];

    const center = validLocations.length > 0
        ? [parseFloat(validLocations[validLocations.length - 1].lat), parseFloat(validLocations[validLocations.length - 1].long)]
        : [51.505, -0.09]; // Default London

    return (
        <div style={{ paddingTop: '120px', paddingBottom: '50px', maxWidth: '1000px', margin: '0 auto', paddingLeft: '20px', paddingRight: '20px' }}>

            <header style={{ marginBottom: '3rem' }}>
                <motion.h2
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ fontSize: '2.5rem', marginBottom: '0.75rem', fontWeight: 700, color: 'var(--color-text)' }}
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
                            style={{ padding: '1rem 2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
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
                        <button onClick={() => setShowScanner(false)} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'red', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>
                            Stop Scanning
                        </button>
                    </div>
                )}
                {error && (
                    <div style={{ marginTop: '1.25rem', padding: '0.9rem 1rem', border: isCounterfeit ? '1px solid rgba(248,113,113,0.7)' : '1px solid rgba(148,163,184,0.5)', background: isCounterfeit ? 'rgba(127,29,29,0.4)' : 'rgba(15,23,42,0.8)', color: isCounterfeit ? '#fecaca' : 'var(--color-text-muted)', textAlign: 'center', fontSize: '0.9rem', borderRadius: '12px' }}>
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

                        {/* PRODUCT HEADER */}
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                            <div style={{ position: 'relative' }}>
                                <img src={productData.image} alt="Product" style={{ width: '200px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
                                <div style={{ position: 'absolute', bottom: '-10px', right: '-10px', background: 'white', padding: '5px', borderRadius: '8px', border: '2px solid black' }}>
                                    <QRCodeSVG value={JSON.stringify({ id: productData.id })} size={64} />
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <h2 style={{ fontSize: '2.5rem', margin: 0, lineHeight: 1.1 }}>{productData.name}</h2>
                                    <span style={{ fontSize: '3rem', fontWeight: 900, color: 'rgba(255,255,255,0.05)' }}>#{formatId(productData.id)}</span>
                                </div>
                                <p style={{ color: '#94a3b8', fontSize: '1.2rem' }}>Batch: {productData.batchId}</p>
                                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ padding: '0.7rem 1.5rem', background: 'rgba(59, 130, 246, 0.2)', borderRadius: '50px', border: '1px solid rgba(59, 130, 246, 0.4)', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Status: {productData.status}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RAW MATERIALS SECTION */}
                        <div style={{ marginTop: '1rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--color-text)' }}>Certified Raw Materials</h3>
                            {rawMaterials.length === 0 ? (
                                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: '#94a3b8' }}>
                                    No raw material data recorded for this product.
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                                    {rawMaterials.map((mat, idx) => (
                                        <div key={idx} style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                <strong style={{ fontSize: '1.1rem', color: '#34d399' }}>{mat.name}</strong>
                                                <span style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Qty: {mat.quantity}</span>
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Supplier: {mat.supplier.substring(0, 8)}...</div>
                                            <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <span>📜</span> <CertificateDisplay value={mat.certificate} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* GEOLOCATION MAP */}
                        <div style={{ marginTop: '1rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--color-text)' }}>Journey Map</h3>
                            {validLocations.length === 0 ? (
                                <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', textAlign: 'center', color: '#94a3b8' }}>
                                    No location data available for this product's journey.
                                </div>
                            ) : (
                                <div style={{ height: '400px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <MapContainer center={center} zoom={3} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                                        <MapUpdater locations={validLocations} />
                                        <TileLayer
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        />
                                        <Polyline positions={historyLocations.map(h => [h.lat, h.long])} color="#6366f1" weight={3} dashArray="5, 10" />
                                        {validLocations.map((loc, idx) => (
                                            <Marker key={idx} position={[loc.lat, loc.long]}>
                                                <Popup>
                                                    <strong>{loc.role}</strong><br />
                                                    {loc.status}<br />
                                                    <small>{loc.timestamp}</small>
                                                </Popup>
                                            </Marker>
                                        ))}
                                    </MapContainer>
                                </div>
                            )}
                        </div>

                        {/* TIMELINE */}
                        <div style={{ marginTop: '1rem' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--color-text)' }}>Timeline</h3>
                            <div style={{ position: 'relative', borderLeft: '2px solid rgba(255,255,255,0.1)', marginLeft: '1rem', paddingLeft: '2rem' }}>
                                {/* Render Raw Materials First */}
                                {rawMaterials.map((mat, index) => (
                                    <div key={`mat-${index}`} style={{ marginBottom: '2rem', position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '-2.6rem', top: '0', width: '1.4rem', height: '1.4rem', background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', borderRadius: '50%', border: '3px solid #0f172a' }}></div>
                                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Raw Material Origin</span>
                                        <h4 style={{ fontSize: '1.2rem', margin: '0.2rem 0', color: 'white' }}>
                                            Raw Material: {mat.name} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>({mat.quantity} units)</span>
                                        </h4>
                                        <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                            📍 <LocationName lat={mat.lat} long={mat.long} />
                                        </div>
                                        <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span>📜</span> <CertificateDisplay value={mat.certificate} />
                                        </div>
                                        <p style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#64748b' }}>Supplier: {mat.supplier}</p>
                                    </div>
                                ))}

                                {/* Render Product History */}
                                {historyData.map((step, index) => (
                                    <div key={index} style={{ marginBottom: '2rem', position: 'relative' }}>
                                        <div style={{ position: 'absolute', left: '-2.6rem', top: '0', width: '1.4rem', height: '1.4rem', background: 'linear-gradient(135deg, #10b981, #34d399)', borderRadius: '50%', border: '3px solid #0f172a' }}></div>
                                        <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{step.timestamp}</span>
                                        <h4 style={{ fontSize: '1.2rem', margin: '0.2rem 0', color: 'white' }}>
                                            {step.role} <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>({step.status})</span>
                                        </h4>
                                        <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                            📍 <LocationName lat={step.lat} long={step.long} />
                                        </div>
                                        <p style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#64748b' }}>Wallet: {step.owner}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>

            {/* COUNTERFEIT INFORMATION PANEL */}
            {isCounterfeit && !productData && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="modern-card" style={{ marginTop: '1.5rem', padding: '1.5rem', border: '1px solid rgba(248,113,113,0.6)', background: 'rgba(127,29,29,0.4)' }}>
                    <h3 style={{ marginTop: 0, marginBottom: '0.75rem', color: '#fecaca', fontSize: '1.25rem' }}>Counterfeit (Fake Product) Suspected</h3>
                    <p style={{ margin: 0, color: '#fee2e2', fontSize: '0.9rem' }}>The scanned Product ID does not exist in the blockchain ledger.</p>
                </motion.div>
            )}

        </div>
    );
};

export default TrackProduct;
