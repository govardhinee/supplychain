import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { BlockchainContext } from '../context/BlockchainContext';
import { motion } from 'framer-motion';

const Login = () => {
    const { loginUser } = useContext(BlockchainContext);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            loginUser(data.user);
            navigate('/dashboard');
        } catch (error) {
            alert(error.message);
        }
    };

    const copyCredential = (text) => {
        navigator.clipboard.writeText(text);
        alert("Copied: " + text);
    };

    return (
        <div style={{
            minHeight: 'calc(100vh - 80px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            marginTop: '80px',
            position: 'relative'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="modern-card"
                style={{ 
                    width: '100%', 
                    maxWidth: '420px', 
                    marginBottom: '3rem'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
                    <h2 style={{ 
                        fontSize: '2rem', 
                        fontWeight: 700, 
                        marginBottom: '0.5rem',
                        color: 'var(--color-text)'
                    }}>
                        Welcome Back
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
                        Sign in to access your dashboard
                    </p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <input
                            className="modern-input"
                            type="text"
                            name="username"
                            placeholder="Username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div>
                        <input
                            className="modern-input"
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-modern" style={{ marginTop: '0.5rem', width: '100%' }}>
                        Sign In
                    </button>
                </form>
            </motion.div>

            {/* Demo Credentials */}
            <div style={{ width: '100%', maxWidth: '900px' }}>
                <p style={{ 
                    textAlign: 'center', 
                    color: 'var(--color-text-muted)', 
                    marginBottom: '1.5rem', 
                    fontSize: '0.875rem', 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    fontWeight: 600
                }}>
                    Demo Accounts
                </p>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '1rem' 
                }}>
                    {[
                        { role: 'Manufacturer', user: 'manufacturer', pass: 'pass', icon: '🏭', hint: 'Creates products & starts the journey' },
                        { role: 'Warehouse', user: 'warehouse', pass: 'pass', icon: '🏢', hint: 'Receives from Manufacturer' },
                        { role: 'Supplier', user: 'supplier', pass: 'pass', icon: '🚚', hint: 'Moves goods to Retailer' },
                        { role: 'Retailer', user: 'retailer', pass: 'pass', icon: '🏪', hint: 'Sells to End User' },
                        { role: 'End User', user: 'enduser', pass: 'pass', icon: '🧑‍🍳', hint: 'Checks if product is delivered or not' }
                    ].map(cred => (
                        <motion.div
                            key={cred.role}
                            whileHover={{ y: -4 }}
                            className="glass-card"
                            style={{
                                padding: '1.25rem',
                                cursor: 'pointer',
                                textAlign: 'center'
                            }}
                            onClick={() => copyCredential(cred.user)}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{cred.icon}</div>
                            <h4 style={{ 
                                color: 'var(--color-text)', 
                                fontWeight: 600, 
                                marginBottom: '0.5rem',
                                fontSize: '1rem'
                            }}>
                                {cred.role}
                            </h4>
                            <div>
                                <div style={{ 
                                    fontSize: '0.8125rem', 
                                    color: 'var(--color-text-muted)',
                                    fontFamily: 'monospace'
                                }}>
                                    <div>{cred.user}</div>
                                    <div style={{ marginTop: '0.25rem' }}>••••</div>
                                </div>
                                <p style={{ 
                                    marginTop: '0.4rem', 
                                    fontSize: '0.75rem', 
                                    color: 'var(--color-text-muted)' 
                                }}>
                                    {cred.hint}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Login;
