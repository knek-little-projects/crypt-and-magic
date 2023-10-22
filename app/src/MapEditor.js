import React, { useEffect, useRef, useState } from 'react';
import useAssets from './assets'

import "./App.scss"
import useMapData from './map/data';
import Map from "./Map"
import { BACKGROUND, CHARACTERS } from './map/layer-types';
import * as cellFuncs from "./map/cell-funcs"
import uuidv4 from "./uuid"
import { useOnchainData } from './map/onchain-data';
import { MAP_SIZE, removePlayerAt, removeSkeletonAt, setObstacle, unsetObstacle } from './store';
import { useDispatch, useSelector } from 'react-redux';
import { useObstacles } from './obstacles';

function MapEditorBrushButton({ src, onClick, children }) {
    return (
        <button onClick={onClick}>
            <img width={25} height={25} src={src} />
            {children}
        </button>
    )
}

export default function MapEditor() {
    const N = MAP_SIZE
    const dispatch = useDispatch()
    const players = useSelector(state => state.players)
    const skeletons = useSelector(state => state.skeletons)
    const obstacles = useSelector(state => state.obstacles)
    const { hasObstacle } = useObstacles()

    const { data, contract, account, deployContract, loadContract } = useOnchainData({ autoload: true })
    const [inputContractAddress, setInputContractAddress] = useState("")
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

    function removeEverythingAt(cell) {
        dispatch(removePlayerAt(cell))
        dispatch(removeSkeletonAt(cell))
        dispatch(unsetObstacle(cell))
    }

    function onBrush(center) {
        if (brush === null) {
            return
        }

        const asset = findAssetById(brush.id)
        const cells = getCellsAround(center, brush.size)

        if (asset.id === "erasor") {
            cells.forEach(cell => removeEverythingAt(cell))
            return
        }

        // if (asset.type === CHARACTERS) {
        //     if (hasObstacle(center)) {
        //         console.warn("has obstacle")
        //         return
        //     }
        // }

        // if (asset.id === "wizard") {
        //     let player = {
        //         id: "wizard",
        //         cell: center,
        //         damage: 0,
        //         asset,
        //     }

        //     const oldPlayer = data.map.getChars().find(char => char.asset.id === asset.id)
        //     if (oldPlayer) {
        //         player = { ...oldPlayer, cell: center }
        //     }
        //     data.map.replaceChar(player)
        //     data.commit()
        //     return
        // }

        // if (asset.type === CHARACTERS) {
        //     const skeleton = {
        //         id: uuidv4(),
        //         asset,
        //         damage: 0,
        //         cell: center,
        //     }
        //     data.map.addChar(skeleton)
        //     return
        // }

        if (asset.type === BACKGROUND) {
            if (asset.id === "grass") {
                dispatch(setObstacle(center))
            } else {
                dispatch(unsetObstacle(center))
            }
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

        if (brush.size === 1 && ((obstacles[cell.i + " " + cell.j] === true) === (brush.id === "water"))) {
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
        if (contract) {
            setInputContractAddress(contract.address)
        }
    }, [contract])

    const [maxSkeletons, setMaxSkeletons] = useState(3)
    const [skeletonRespawnTime, setSkeletonRespawnTime] = useState(10)

    return (
        <div className='MapEditor'>

            {
                account &&
                <div>
                    <p>Connected Account: {account}</p>
                    <button onClick={() => deployContract({ maxSkeletons, skeletonRespawnTime })}>Deploy Map Contract</button>
                    <button onClick={() => loadContract(inputContractAddress)}>Load</button>
                    <input type="text" value={inputContractAddress} onInput={e => setInputContractAddress(e.target.value)} style={{ width: "400px" }} />

                    setMaxSkeletons: <input type="text" value={maxSkeletons} onInput={e => setMaxSkeletons(e.target.value)} />
                    setSkeletonRespawnTime: <input type="text" value={skeletonRespawnTime} onInput={e => setSkeletonRespawnTime(e.target.value)} />
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
                {/* <div className="vr" /> */}
                {/* <MapEditorBrushButton src="/map/wizard.png" onClick={() => setBrush({ id: "wizard", size: 1 })}>
                    Hero
                </MapEditorBrushButton> */}
                {/* <MapEditorBrushButton src="/map/skel-mage.png" onClick={() => setBrush({ id: "skel-mage", size: 1 })}>
                    Enemy
                </MapEditorBrushButton> */}
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

