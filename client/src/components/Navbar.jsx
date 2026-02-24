import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BlockchainContext } from '../context/BlockchainContext';

const Navbar = () => {
    const { currentAccount, connectWallet, currentUser, logoutUser } = useContext(BlockchainContext);
    const navigate = useNavigate();

    return (
        <nav style={{
            background: 'rgba(11, 14, 20, 0.85)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid var(--color-border)',
            padding: '1rem 2rem',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: '70px',
            boxSizing: 'border-box'
        }}>
            <div
                onClick={() => navigate('/')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer'
                }}
            >
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem'
                }}>🔗</div>
                <h1 className="text-gradient" style={{
                    fontSize: '1.5rem',
                    margin: 0
                }}>
                    SupplyChain.io
                </h1>
            </div>

            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <Link
                    to="/"
                    style={{
                        color: 'var(--color-text)',
                        fontWeight: 500,
                        fontSize: '0.9375rem',
                        transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--color-text)'}
                >
                    Dashboard
                </Link>
                <Link
                    to="/track"
                    style={{
                        color: 'var(--color-text-muted)',
                        fontWeight: 500,
                        fontSize: '0.9375rem',
                        transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}
                >
                    Track Product
                </Link>
                <Link
                    to="/admin"
                    style={{
                        color: 'var(--color-text-muted)',
                        fontWeight: 500,
                        fontSize: '0.9375rem',
                        transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.color = 'var(--color-primary)'}
                    onMouseLeave={(e) => e.target.style.color = 'var(--color-text-muted)'}
                >
                    Admin
                </Link>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                {currentUser && (
                    <Link to="/dashboard" style={{ textDecoration: 'none' }}>
                        <div style={{
                            padding: '0.5rem 1rem',
                            background: 'rgba(139, 92, 246, 0.15)',
                            borderRadius: '8px',
                            border: '1px solid rgba(139, 92, 246, 0.3)',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'var(--color-accent)',
                            marginRight: '0.5rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}>
                            {currentUser.role}
                        </div>
                    </Link>
                )}

                {currentUser ? (
                    <button
                        onClick={logoutUser}
                        className="btn-secondary"
                        style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
                    >
                        Logout
                    </button>
                ) : (
                    <Link to="/login">
                        <button className="btn-secondary" style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}>
                            Login
                        </button>
                    </Link>
                )}

                {!currentAccount ? (
                    <button
                        onClick={connectWallet}
                        className="btn-modern"
                        style={{ padding: '0.625rem 1.25rem', fontSize: '0.875rem' }}
                    >
                        Connect Wallet
                    </button>
                ) : (
                    <div style={{
                        padding: '0.625rem 1rem',
                        background: 'rgba(16, 185, 129, 0.15)',
                        borderRadius: '8px',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        fontSize: '0.8125rem',
                        fontFamily: 'monospace',
                        color: 'var(--color-success)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--color-success)',
                            display: 'block'
                        }}></span>
                        {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
