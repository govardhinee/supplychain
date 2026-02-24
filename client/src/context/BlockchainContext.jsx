import React, { createContext, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { contractABI, contractAddress } from '../utils/constants';

export const BlockchainContext = createContext();

const { ethereum } = window;

const BlockchainProvider = ({ children }) => {
    const [currentAccount, setCurrentAccount] = useState('');
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(false);

    // Auth State
    const [currentUser, setCurrentUser] = useState(null); // { username, role }

    const checkIfWalletIsConnected = async () => {
        try {
            if (!ethereum) return;
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            if (accounts.length) {
                setCurrentAccount(accounts[0]);
                initializeContract(accounts[0]);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const initializeContract = async (account) => {
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const supplyChainContract = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(supplyChainContract);
    };

    const checkNetwork = async () => {
        const chainId = await ethereum.request({ method: 'eth_chainId' });
        // Hardhat Localhost Chain ID is 31337 (0x7a69)
        const hardhatChainId = '0x7a69';

        if (chainId !== hardhatChainId) {
            try {
                await ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: hardhatChainId }],
                });
            } catch (switchError) {
                // This error code indicates that the chain has not been added to MetaMask.
                if (switchError.code === 4902) {
                    try {
                        await ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [
                                {
                                    chainId: hardhatChainId,
                                    chainName: 'Hardhat Localhost',
                                    rpcUrls: ['http://127.0.0.1:8545'],
                                },
                            ],
                        });
                    } catch (addError) {
                        console.error(addError);
                    }
                } else {
                    alert("Please switch your MetaMask network to Localhost 8545 (Chain ID 31337).");
                }
            }
        }
    };

    const connectWallet = async () => {
        try {
            if (!ethereum) return alert('Please install MetaMask.');
            await checkNetwork();
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            setCurrentAccount(accounts[0]);
            window.location.reload();
        } catch (error) {
            console.log(error);
            throw new Error('No ethereum object');
        }
    };

    const loginUser = (userData) => {
        setCurrentUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logoutUser = () => {
        setCurrentUser(null);
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const getLocation = async () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by your browser"));
            } else {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude.toString(),
                            long: position.coords.longitude.toString()
                        });
                    },
                    (error) => {
                        console.error("Error getting location:", error);
                        resolve({ lat: "0", long: "0" }); // Default to 0,0 on error to allow flow to continue
                    }
                );
            }
        });
    };

    useEffect(() => {
        checkIfWalletIsConnected();
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', (accounts) => {
                if (accounts.length > 0) {
                    setCurrentAccount(accounts[0]);
                    initializeContract(accounts[0]);
                    window.location.reload(); // Reload to refresh state
                } else {
                    setCurrentAccount('');
                    setContract(null);
                }
            });

            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
        }

        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', () => { });
                window.ethereum.removeListener('chainChanged', () => { });
            }
        };
    }, []);

    return (
        <BlockchainContext.Provider
            value={{
                connectWallet,
                currentAccount,
                contract,
                loading,
                setLoading,
                currentUser,
                loginUser,
                logoutUser,
                getLocation
            }}
        >
            {children}
        </BlockchainContext.Provider>
    );
};

export default BlockchainProvider;
