import { useState, useEffect } from "react"
import useMapData from "./data"
import { ethers, providers } from 'ethers';
import { convertBytesToMatrix, convertMatrixToBytes, deployMap, fetchMap, useWallet } from "../wallet"
import * as cellFuncs from "./cell-funcs"
import useAssets from "../assets";

export function useOnchainData({ autoload }) {
    const data = useMapData()
    const N = data.map.getSize()
    const { assets, getImageUrlById, findAssetById, getAssetById } = useAssets()

    const { signer, account } = useWallet()
    const [contract, setContract] = useState(null)

    async function deployContract() {
        // const obstacles = ethers.utils.formatBytes32String("0x0");
        const obstacles = convertMatrixToBytes(N, cell => data.map.getBackgroundAt(cell).asset.isObstacle)
        const maxSkeletons = 3
        setContract(await deployMap({ signer, N, obstacles, maxSkeletons }))
    }

    useEffect(() => {
        if (!contract) {
            return
        }

        console.log(window.$contract = contract)
        localStorage.setItem("lastContractAddress", contract.address)

        async function fetchData() {
            const obstacles = await contract.obstacles()
            const f = convertBytesToMatrix(N, obstacles)

            data.map.clear()
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < N; j++) {
                    if (f({ i, j })) {
                        data.map.setBackgroundIdAt({ i, j }, "water")
                    }
                }
            }

            const addrs = await contract.getCharacterAddresses()
            for (const addr of addrs) {
                const state = await contract.characterAddressToCharacterState(addr)

                const i = Math.floor(state.position / N)
                const j = Math.floor(state.position % N)
                data.map.addChar({
                    id: addr,
                    asset: getAssetById(state.asset === 0 ? "skel-mage" : "wizard"),
                    health: 255 - state.damage,
                    direction: -1 + state.direction,
                    cell: { i, j },
                })
            }

            data.commit()
        }

        fetchData()

    }, [contract])


    useEffect(() => {
        if (!account) {
            return
        }

        if (!autoload) {
            return
        }

        async function f() {
            const address = localStorage.getItem("lastContractAddress")
            try {
                if (address) {
                    await loadContract(address)
                    return
                }
            } catch (e) {
                console.error("autoload failed for address", address, e)
            }
        }

        f()
    }, [account])

    async function loadContract(address) {
        setContract(await fetchMap({ signer, address }))
    }

    return {
        data,
        contract,
        account,
        deployContract,
        loadContract,
    }
}