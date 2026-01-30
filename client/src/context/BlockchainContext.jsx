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

    const connectWallet = async () => {
        try {
            if (!ethereum) return alert('Please install MetaMask.');
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

    useEffect(() => {
        checkIfWalletIsConnected();
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
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
                logoutUser
            }}
        >
            {children}
        </BlockchainContext.Provider>
    );
};

export default BlockchainProvider;
