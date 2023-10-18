import React, { useState, useEffect } from 'react';
import { ethers, providers } from 'ethers';
import { deployMap, fetchMap, useWallet } from "./wallet"

function MetaMask({ }) {

    const { signer, account } = window.$wallet = useWallet()
    const [contract, setContract] = useState(null)

    const N = 16
    const obstacles = ethers.utils.formatBytes32String("0x0");

    async function deployContract() {
        setContract(await deployMap({ signer, N, obstacles }))
    }

    useEffect(() => {
        if (!contract) {
            return
        }

        console.log(window.$contract = contract)
        setInputContractAddress(contract.address)
    }, [contract])

    const [inputContractAddress, setInputContractAddress] = useState("")

    async function loadContract() {
        setContract(await fetchMap({ signer, address: inputContractAddress }))
    }

    return (
        <div>
            <h2>MetaMask Info:</h2>
            {
                account &&
                <div>
                    <p>Connected Account: {account}</p>
                    <button onClick={deployContract}>Deploy Map Contract</button>
                    <button onClick={loadContract}>Load</button>
                    <div>
                        <input type="text" value={inputContractAddress} onInput={e => setInputContractAddress(e.target.value)} style={{ width: "400px" }} />
                    </div>
                </div>
                ||
                <div>Account is not connected</div>
            }
        </div>
    );
}

export default MetaMask;
