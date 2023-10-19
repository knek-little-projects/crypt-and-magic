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
    const [player, setPlayer] = useState(null)

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
        loadMapFromChain()

    }, [contract])

    async function loadMapFromChain() {
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
                damage: state.damage,
                direction: -1 + state.direction,
                cell: { i, j },
            })
        }

        data.commit()
    }

    async function loadLastContractAddress() {
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

    useEffect(() => {
        if (!account) {
            return
        }

        if (!autoload) {
            return
        }

        loadLastContractAddress()
    }, [account])

    async function loadContract(address) {
        setContract(await fetchMap({ signer, address }))
    }

    useEffect(() => {
        if (!contract) {
            return;
        }

        async function handlePlayerAdded(id, p) {
            console.debug("handlePlayerAdded")
            const { damage } = await contract.characterAddressToCharacterState(id)
            data.map.addChar({
                id,
                asset: getAssetById("wizard"),
                damage,
                cell: cellFuncs.positionToCell(p, N),
            })
            data.commit()
        }

        function handlePlayerRemoved(id) {
            console.debug("handlePlayerRemoved")
            data.map.removeChar({ id })
            data.commit()
        }

        contract.on('PlayerAdded', handlePlayerAdded);
        contract.on('PlayerRemoved', handlePlayerRemoved);

        return () => {
            contract.off('PlayerAdded', handlePlayerAdded);
            contract.off('PlayerRemoved', handlePlayerRemoved);
        }
    }, [contract]);


    return {
        data,
        contract,
        account,
        deployContract,
        loadContract,
    }
}