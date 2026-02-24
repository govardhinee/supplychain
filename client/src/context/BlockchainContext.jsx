import { ethers } from 'ethers';
import { createContext, useEffect, useState } from 'react';
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
        return new Promise(async (resolve, reject) => {
            if (!navigator.geolocation) {
                return reject(new Error("Geolocation is not supported by your browser. Location tracking is mandatory for this action."));
            }

            try {
                // In modern Chrome/Edge, sometimes asking for permissions explicitly first helps trigger the popup if it's stuck.
                if (navigator.permissions && navigator.permissions.query) {
                    const result = await navigator.permissions.query({ name: 'geolocation' });
                    if (result.state === 'denied') {
                        return reject(new Error("Location permission is currently denied! Please click the lock icon next to your URL bar, allow Location access, and refresh the page."));
                    }
                }

                // Actually request the position which triggers the prompt if state is 'prompt'
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude.toString(),
                            long: position.coords.longitude.toString()
                        });
                    },
                    (error) => {
                        console.error("Geolocation Error detailed:", error);
                        let errorMessage = "Unknown location error.";
                        if (error.code === error.PERMISSION_DENIED) {
                            errorMessage = "You denied the request for Geolocation. Please click the lock icon in your URL bar, change Location to 'Allow', and try again. Location is mandatory.";
                        } else if (error.code === error.POSITION_UNAVAILABLE) {
                            errorMessage = "Location information is unavailable. (Check if Windows Location Services is ON in your PC Settings). Location is mandatory.";
                        } else if (error.code === error.TIMEOUT) {
                            errorMessage = "The request to get your location timed out. Please try again.";
                        }

                        reject(new Error(errorMessage));
                    },
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
                );

            } catch (err) {
                console.error("Unexpected error in getLocation block:", err);
                reject(new Error("Failed to get location."));
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
