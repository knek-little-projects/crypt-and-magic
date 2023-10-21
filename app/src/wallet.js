import React, { useState, useEffect } from 'react';
import { ethers, providers } from 'ethers';
import detectEthereumProvider from '@metamask/detect-provider';
import * as cellFuncs from "./map/cell-funcs"

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

export async function deployMap({ signer, N, obstacles, maxSkeletons }) {
    const ContractFactory = await fetchMapContractFactory({ signer })
    const contract = await ContractFactory.deploy(N, obstacles, maxSkeletons);

    console.info('Contract deployment transaction hash:', contract.deployTransaction.hash);
    await contract.deployed();
    console.info('Contract deployed to address:', contract.address);
    return contract
}

export async function fetchMap({ signer, address }) {
    const contractData = await fetchMapContractData()
    console.log("loading", address)
    const contract = new ethers.Contract(address, contractData.abi, signer)
    return contract
}

export function convertMatrixToBytes(N, f) {
    if (!parseInt(N)) {
        throw Error()
    }

    if (typeof f !== "function") {
        throw Error()
    }

    let bits = '';
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            bits += f({ i, j }) ? '1' : '0';
        }
    }

    // Convert the bits to bytes
    let bytesArr = [];
    for (let i = 0; i < bits.length; i += 8) {
        const byte = parseInt(bits.slice(i, i + 8), 2)
        bytesArr.push(byte)
    }

    // Convert the array of bytes to a bytes format using ethers
    // const bytes = ethers.utils.concat(bytesArr);

    return bytesArr
}

export function bytesToBits(bytes) {
    bytes = ethers.utils.arrayify(bytes)

    let bits = '';
    for (let i = 0; i < bytes.length; i++) {
        let byte = bytes[i]
        let byteBits = byte.toString(2).padStart(8, '0')
        bits += byteBits
    }

    return bits
}

export function convertBytesToMatrix(N, bytes) {
    if (!parseInt(N)) {
        throw Error()
    }

    const bits = bytesToBits(bytes)

    // Now, recreate the function f() using the bits
    return function f({ i, j }) {
        let index = i * N + j;
        return bits[index] === '1';
    };
}

export function packSteps(startCell, nextCells) {
    const maxSteps = ethers.BigNumber.from(nextCells.length)
    let steps = ethers.BigNumber.from(0)
    let a = startCell
    let s = ""
    let shl = 0
    for (const b of nextCells) {
        const step = cellFuncs.getMoveDirectionForContract(a, b)
        s = s + cellFuncs.getArrowDirection(a, b)
        steps = ethers.BigNumber.from(step).shl(shl).or(steps)
        shl += 2
        a = b
    }
    const packedSteps = maxSteps.shl(128).add(steps)
    console.debug(packedSteps)
    console.debug(s)
    return packedSteps
}