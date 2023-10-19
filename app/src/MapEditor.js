import React, { useEffect, useRef, useState } from 'react';
import useAssets from './assets'

import { ethers, providers } from 'ethers';
import { convertBytesToMatrix, convertMatrixToBytes, deployMap, fetchMap, useWallet } from "./wallet"

import "./App.scss"
import useMapData from './map/data';
import Map from "./Map"
import { BACKGROUND, CHARACTERS } from './map/layer-types';
import * as cellFuncs from "./map/cell-funcs"
import uuidv4 from "./uuid"

function MapEditorBrushButton({ src, onClick, children }) {
    return (
        <button onClick={onClick}>
            <img width={25} height={25} src={src} />
            {children}
        </button>
    )
}

export default function MapEditor() {
    const data = useMapData()
    const N = data.mapSize
    const { assets, getImageUrlById, findAssetById, getAssetById } = useAssets()
    const [brush, setBrush] = useState({ id: "grass", size: 1 })
    const [hoverImageUrl, setHoverImageUrl] = useState(null)
    const [hoverStyle, setHoverStyle] = useState({})

    const buttons = assets.filter(o => o.type === BACKGROUND).map(o => (
        <MapEditorBrushButton src={o.src} key={o.id} onClick={() => setBrush({ id: o.id, size: 1 })}>
            {o.name}
        </MapEditorBrushButton>
    ))

    function getCellsAround(center, size) {
        const cells = []
        for (let i = center.i - Math.floor(size / 2); i <= center.i + Math.floor(size / 2); i++) {
            for (let j = center.j - Math.floor(size / 2); j <= center.j + Math.floor(size / 2); j++) {
                cells.push({ i, j })
            }
        }
        return cells
    }

    function onBrush(center) {
        if (brush === null) {
            return
        }

        const asset = findAssetById(brush.id)
        const cells = getCellsAround(center, brush.size)

        if (asset.id === "erasor") {
            cells.forEach(cell => data.map.removeEverythingAt(cell))
            data.commit()
            return
        }

        if (asset.type === CHARACTERS) {
            if (data.map.hasObstacle(center)) {
                console.warn("has obstacle")
                return
            }
        }

        if (asset.id === "wizard") {
            let player = {
                id: "wizard",
                cell: center,
                health: 100,
                asset,
            }

            const oldPlayer = data.map.getChars().find(char => char.asset.id === asset.id)
            if (oldPlayer) {
                player = { ...oldPlayer, cell: center }
            }
            data.map.replaceChar(player)
            data.commit()
            return
        }

        if (asset.type === CHARACTERS) {
            const skeleton = {
                id: uuidv4(),
                asset,
                health: 100,
                cell: center,
            }
            data.map.addChar(skeleton)
            return
        }

        if (asset.type === BACKGROUND) {
            cells.forEach(cell => data.map.setBackgroundIdAt(cell, brush.id))
            data.commit()
            return
        }
    }

    function getHoverStyleAndImage(cell) {
        if (!cell) {
            return {
                style: {},
                image: null,
            }
        }

        if (brush.id === "erasor") {
            return {
                image: null,
                style: {
                    backgroundColor: "rgba(255,255,255,0.75)"
                }
            }
        }

        if (brush.size === 1 && brush.id === data.map.getBackgroundAt(cell).asset.id) {
            return {
                image: null,
                style: {},
            }
        }

        return {
            style: {},
            image: getImageUrlById(brush.id)
        }
    }

    function onHover(cell) {
        const { image, style } = getHoverStyleAndImage(cell)
        setHoverImageUrl(image)
        setHoverStyle(style)
    }

    useEffect(() => {
        setInputContractAddress(localStorage.getItem("lastContractAddress"))

        try {
            data.reactLoadFromLocalStorage()
        } catch (e) {

        }
    }, [])


    const { signer, account } = window.$wallet = useWallet()
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
        setInputContractAddress(contract.address)
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

    const [inputContractAddress, setInputContractAddress] = useState("")

    async function loadContract() {
        setContract(await fetchMap({ signer, address: inputContractAddress }))
    }

    return (
        <div className='MapEditor'>

            {
                account &&
                <div>
                    <p>Connected Account: {account}</p>
                    <button onClick={deployContract}>Deploy Map Contract</button>
                    <button onClick={loadContract}>Load</button>
                    <input type="text" value={inputContractAddress} onInput={e => setInputContractAddress(e.target.value)} style={{ width: "400px" }} />
                </div>
                ||
                <div>Unlock MetaMask and reload the page</div>
            }
            <br />

            <div className='brush-buttons'>
                <MapEditorBrushButton src="/map/erasor.png" onClick={() => setBrush({ id: "erasor", size: 1 })}>
                    Erase 1x1
                </MapEditorBrushButton>
                <MapEditorBrushButton src="/map/erasor.png" onClick={() => setBrush({ id: "erasor", size: 3 })}>
                    Erase 3x3
                </MapEditorBrushButton>
                {buttons}
                <div className="vr" />
                <MapEditorBrushButton src="/map/wizard.png" onClick={() => setBrush({ id: "wizard", size: 1 })}>
                    Hero
                </MapEditorBrushButton>
                <MapEditorBrushButton src="/map/skel-mage.png" onClick={() => setBrush({ id: "skel-mage", size: 1 })}>
                    Enemy
                </MapEditorBrushButton>
            </div>
            <hr />
            <Map
                getItems={data.getItems}
                mapSize={data.mapSize}
                onBrush={onBrush}
                onHover={onHover}
                hoverSize={brush.size}
                hoverImageUrl={hoverImageUrl}
                hoverStyle={hoverStyle}
            />
            <hr />
            <span>Local storage:</span>
            <button onClick={() => data.saveToLocalStorage()}>SAVE</button>
            <button onClick={() => data.reactLoadFromLocalStorage()}>LOAD</button>
            <button onClick={() => { data.reactLoadEmpty() }}>CLEAR</button>

        </div>
    );
}

