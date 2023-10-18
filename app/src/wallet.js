import React, { useState, useEffect } from 'react';
import { ethers, providers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';

window.$ethers = ethers

export function useWallet() {
    const [provider, setProvider] = useState(null)
    const [signer, setSigner] = useState(null)
    const [account, setAccount] = useState(null);

    useEffect(() => {
        async function initialize() {
            const ethereumProvider = await detectEthereumProvider();

            if (ethereumProvider && ethereumProvider.isMetaMask) {
                setProvider(new ethers.providers.Web3Provider(ethereumProvider))
                console.info('MetaMask is installed!');
            } else {
                console.error('Please install MetaMask.');
            }
        }

        initialize()
    }, [])

    useEffect(() => {
        async function getAccountDetails() {
            if (provider) {
                const signer = window.$signer = await provider.getSigner()
                const accountAddress = await signer.getAddress()

                setSigner(signer)
                setAccount(accountAddress);
            }
        }
        getAccountDetails().catch(e => console.error(e))
    }, [provider])

    return { provider, signer, account }
}

async function fetchMapContractData() {
    const response = await fetch('/contracts/Map.json')
    const contractData = await response.json()
    return contractData
}

async function fetchMapContractFactory({ signer }) {
    const contractData = await fetchMapContractData()
    const ContractFactory = new ethers.ContractFactory(contractData.abi, contractData.bytecode, signer)
    return ContractFactory
}

export async function deployMap({ signer, N, obstacles }) {
    const ContractFactory = await fetchMapContractFactory({ signer })
    const contract = await ContractFactory.deploy(N, obstacles);

    console.log('Contract deployment transaction hash:', contract.deployTransaction.hash);
    await contract.deployed();
    console.log('Contract deployed to address:', contract.address);
    return contract
}

export async function fetchMap({ signer, address }) {
    const contractData = await fetchMapContractData()
    console.log("loading", address)
    const contract = new ethers.Contract(address, contractData.abi, signer)
    return contract
}