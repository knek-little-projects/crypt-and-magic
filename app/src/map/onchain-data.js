import { useState, useEffect } from "react"
import useMapData from "./data"
import { BigNumber, ethers, providers } from 'ethers';
import { convertBytesToMatrix, convertMatrixToBytes, deployMap, fetchMap, useWallet } from "../wallet"
import * as cellFuncs from "./cell-funcs"
import useAssets from "../assets";
import * as $wallet from "../wallet"

window.$wallet = $wallet

function toNumber(obj) {
    obj = { ...obj }
    for (const key in obj) {
        if (obj[key] instanceof BigNumber) {
            obj[key] = obj[key].toNumber()
        }
    }
    return obj;
}

export function useOnchainData({ autoload }) {
    const data = useMapData()
    const N = data.map.getSize()
    const { getAssetById } = useAssets()

    const { signer, account } = useWallet()
    const [contract, setContract] = useState(null)

    async function deployContract() {
        // const obstacles = ethers.utils.formatBytes32String("0x0");
        const obstacles = convertMatrixToBytes(N, cell => data.map.getBackgroundAt(cell).asset.isObstacle)
        const maxSkeletons = 3
        setContract(await deployMap({ signer, N, obstacles, maxSkeletons }))
    }

    const [mapStateLoaded, setMapStateLoaded] = useState(false)

    useEffect(() => {
        if (!contract) {
            return
        }

        console.debug(window.$contract = contract)
        localStorage.setItem("lastContractAddress", contract.address)

        loadMapFromChain()
            .catch(e => {
                console.error(e)
                setMapStateLoaded(false)
            })
            .then(() => {
                setMapStateLoaded(true)
            })
    }, [contract])

    async function loadMapFromChain() {
        const [obstacles, skeletonAddresses, playerAddresses, skeletons, players] = await contract.getFullState();

        const f = convertBytesToMatrix(N, obstacles)
        data.map.clear()
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                if (f({ i, j })) {
                    data.map.setBackgroundIdAt({ i, j }, "water")
                }
            }
        }

        for (let i = 0; i < skeletonAddresses.length; i++) {
            const id = skeletonAddresses[i]
            const { damage, step, position } = toNumber(skeletons[i])

            const cell = cellFuncs.positionToCell(position, N)

            data.map.addChar({
                id,
                asset: getAssetById("skel-mage"),
                damage,
                step,
                cell,
            })
        }
        for (let i = 0; i < playerAddresses.length; i++) {
            const id = playerAddresses[i]
            const { damage, position } = toNumber(players[i])

            const cell = cellFuncs.positionToCell(position, N)

            data.map.addChar({
                id,
                asset: getAssetById("wizard"),
                damage,
                cell,
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
        const VERSION = 1;
        const contract = await fetchMap({ signer, address })
        let version;
        try {
            version = await contract.version();
        } catch {
            throw Error(`Contract has no version`)
        }
        if (VERSION != version) {
            throw Error(`Contract has wrong version (got ${version}, expected ${VERSION})`)
        }
        setContract(contract)
    }

    useEffect(() => {

        async function handlePlayerAdded(id) {
            console.debug("handlePlayerAdded")
            const { damage, position } = toNumber(await contract.playerAddressToState(id))
            data.map.addChar({
                id,
                damage,
                asset: getAssetById("wizard"),
                cell: cellFuncs.positionToCell(position, N),
            })
            data.commit()
        }

        async function handlePlayerRemoved(id, p) {
            console.debug("handlePlayerRemoved")
            data.map.removeChar({ id })
            data.commit()
        }

        async function handlePlayerMoved(id, steps, p) {
            console.debug("PlayerMoved", id, steps, p)
            data.map.updateCharPosition({
                id,
                cell: cellFuncs.positionToCell(p, N)
            })
            data.commit()
        }

        async function log() {
            console.log("LOG", ...arguments)
        }

        const disable = () => {
            contract.off('PlayerAdded', handlePlayerAdded);
            contract.off('PlayerMoved', handlePlayerMoved);
            contract.off('PlayerRemoved', handlePlayerRemoved);
            contract.off('log', log);
            contract.off('logInt', log);
            contract.off('logUint', log);
        }

        if (!contract) {
            return
        }

        if (!mapStateLoaded) {
            return
        }

        contract.on('PlayerAdded', handlePlayerAdded);
        contract.on('PlayerMoved', handlePlayerMoved);
        contract.on('PlayerRemoved', handlePlayerRemoved);
        contract.on('log',log);
        contract.on('logInt',log);
        contract.on('logUint',log);

        return disable;
    }, [contract, mapStateLoaded]);


    return {
        data,
        contract,
        account,
        deployContract,
        loadContract,
    }
}