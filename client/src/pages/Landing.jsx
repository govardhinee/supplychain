import { motion } from 'framer-motion';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { BlockchainContext } from '../context/BlockchainContext';

const Landing = () => {
    const navigate = useNavigate();
    const { currentUser } = useContext(BlockchainContext);

    return (
        <div style={{
            minHeight: 'calc(100vh - 80px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
            marginTop: '80px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Inheriting global theme background */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 0
            }} />

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '800px' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <motion.h1
                        className="text-gradient"
                        style={{
                            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                            fontWeight: 800,
                            marginBottom: '1.5rem',
                            lineHeight: 1.2
                        }}
                    >
                        Supply Chain
                        <br />
                        <span style={{ color: 'var(--color-text)' }}>Blockchain Platform</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.6 }}
                        style={{
                            fontSize: '1.25rem',
                            color: 'var(--color-text-muted)',
                            marginBottom: '3rem',
                            lineHeight: 1.7
                        }}
                    >
                        Transparent, secure, and verifiable supply chain tracking
                        <br />
                        powered by Ethereum blockchain technology
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                        style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}
                    >
                        <button
                            onClick={() => currentUser ? navigate('/dashboard') : navigate('/login')}
                            className="btn-modern"
                            style={{ minWidth: '200px' }}
                        >
                            {currentUser ? 'Go to Dashboard' : 'Get Started'}
                        </button>
                        <button
                            onClick={() => navigate('/track')}
                            className="btn-secondary"
                            style={{ minWidth: '200px' }}
                        >
                            Track Product
                        </button>
                    </motion.div>
                </motion.div>

                {/* Features Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '1.5rem',
                        marginTop: '5rem',
                        width: '100%'
                    }}
                >
                    {[
                        { icon: '🔒', title: 'Secure', desc: 'Blockchain verified' },
                        { icon: '👁️', title: 'Transparent', desc: 'Full visibility' },
                        { icon: '⚡', title: 'Fast', desc: 'Real-time tracking' }
                    ].map((feature, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ y: -5 }}
                            className="glass-card"
                            style={{
                                padding: '1.5rem',
                                textAlign: 'center'
                            }}
                        >
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{feature.icon}</div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--color-text)' }}>
                                {feature.title}
                            </h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{feature.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default Landing;
