import { useState, useEffect } from "react"
import useMapData from "./data"
import { BigNumber, ethers, providers } from 'ethers';
import { convertMatrixToBytes, deployMap, fetchMap, useWallet } from "../wallet"
import { useSelector, useDispatch } from 'react-redux';
import * as cellFuncs from "./cell-funcs"
import useAssets from "../assets";
import * as $wallet from "../wallet"
import { Spell, addSpell, clearExpiredSpells, setObstaclesFromBytes } from "../store";
import useInterval from "../react-interval";

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
    const dispatch = useDispatch()
    const obstacles = useSelector(state => state.obstacles)

    const data = useMapData()
    const N = data.map.getSize()
    const { getAssetById, findAssetById } = useAssets()

    const { signer, account } = useWallet()
    const [contract, setContract] = useState(null)

    async function deployContract({ maxSkeletons, skeletonRespawnTime }) {
        // const obstacles = ethers.utils.formatBytes32String("0x0");
        const obstacles = convertMatrixToBytes(N, ({ i, j }) => obstacles[i + " " + j] === true)
        setContract(await deployMap({ signer, N, obstacles, maxSkeletons, skeletonRespawnTime }))
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
        dispatch(setObstaclesFromBytes({ obstacles, N }))

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

    useInterval(() => {
        dispatch(clearExpiredSpells())
    }, 1000)

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
            data.map.setSteps([])
            data.commit()
        }

        async function log() {
            console.log("LOG", ...arguments)
        }

        async function handleSpellCasted(spellId, targetAddress) {
            console.log("SpellCasted", ...arguments)
            // const cell = cellFuncs.positionToCell(p, N)
            const asset = findAssetById(spellId)
            if (!asset) {
                console.error(`Asset ${spellId} wasn't found`)
                return
            }
            // console.log("at", cell, asset)
            const char = data.map.findChar(targetAddress)
            if (!char) {
                console.warn(`Spell casted for a non-existent char ${targetAddress}`)
                return
            }
            // data.map.addSpell({
            //     id: uuidv4(),
            //     asset,
            //     targetId: targetAddress,
            //     finishTime: new Date().getTime() + 1000 * 1,
            // })
            // data.commit()
            dispatch(addSpell(new Spell({
                assetId: asset.id,
                idFrom: char.id,
                idTo: char.id,
                ttl: 1000,
                startTime: new Date().getTime(),
            })))
        }

        async function handleSkeletonRemoved(id, p) {
            console.log("SkeletonRemoved", ...arguments)
            data.map.removeChar({ id })
        }

        async function handleSkeletonAdded(id, p) {

            const cell = cellFuncs.positionToCell(p, N)

            data.map.addChar({
                id,
                asset: getAssetById("skel-mage"),
                damage: 0,
                step: 0,
                cell,
            })
        }

        async function handleSkeletonMoved(id, p) {
            console.log("SkeletonMoved", ...arguments)
            const skeleton = data.map.findChar(id)
            if (!skeleton) {
                console.warn("Skeleton not found on the map", id)
            }
            skeleton.cell = cellFuncs.positionToCell(p, N)
            data.commit()
        }
        async function handlePlayerKilled(id) {
            console.log("handlePlayerKilled", ...arguments)
        }
        async function handlePlayerDamaged(id, damage) {
            console.log("handlePlayerDamaged", ...arguments)
        }

        const disable = () => {
            contract.off('PlayerAdded', handlePlayerAdded);
            contract.off('PlayerMoved', handlePlayerMoved);
            contract.off('PlayerRemoved', handlePlayerRemoved);
            contract.off('SkeletonRemoved', handleSkeletonRemoved);
            contract.off('log', log);
            contract.off('logInt', log);
            contract.off('logUint', log);
            contract.off('SpellCasted', handleSpellCasted);
            contract.off('SkeletonAdded', handleSkeletonAdded);
            contract.off('SkeletonMoved', handleSkeletonMoved);
            contract.off('PlayerKilled', handlePlayerKilled);
            contract.off('PlayerDamaged', handlePlayerDamaged);
        }

        if (!contract) {
            return
        }

        if (!mapStateLoaded) {
            return
        }

        try {
            contract.on('SpellCasted', handleSpellCasted);
            contract.on('PlayerKilled', handlePlayerKilled);
            contract.on('PlayerDamaged', handlePlayerDamaged);
            contract.on('PlayerAdded', handlePlayerAdded);
            contract.on('PlayerMoved', handlePlayerMoved);
            contract.on('PlayerRemoved', handlePlayerRemoved);
            contract.on('SkeletonRemoved', handleSkeletonRemoved);
            contract.on('SkeletonAdded', handleSkeletonAdded);
            contract.on('SkeletonMoved', handleSkeletonMoved);
            contract.on('log', log);
            contract.on('logInt', log);
            contract.on('logUint', log);
        } catch (e) {
            console.error(e)
            setContract(null)
            setMapStateLoaded(false)
            return;
        }

        return disable;
    }, [contract, mapStateLoaded]);


    return {
        N,
        data,
        contract,
        account,
        deployContract,
        loadContract,
    }
}