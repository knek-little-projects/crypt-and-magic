import React, { useEffect, useRef, useState } from 'react';
import useAssets from './assets'

import "./App.scss"
import useMapData from './map/data';
import Map from "./Map"
import { BACKGROUND, CHARACTERS } from './map/layer-types';

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
    const { assets, getImageUrlById, findAssetById } = useAssets()
    const [brush, setBrush] = useState({ id: "grass", size: 1 })
    const [hoverImageUrl, setHoverImageUrl] = useState(null)
    const mapSize = 10

    const buttons = assets.filter(o => o.type === "background").map(o => (
        <MapEditorBrushButton src={o.src} key={o.id} onClick={() => setBrush({ id: o.id, size: 1 })}>
            {o.name}
        </MapEditorBrushButton>
    ))

    function onBrush(center) {
        if (brush === null) {
            return
        }

        const asset = findAssetById(brush.id)

        if (asset.id === "wizard") {
            data.setLayers(data.layers.reset(CHARACTERS, center, asset.id))
            return
        }

        if (asset.type === "char") {
            data.setLayers(data.layers.updated(CHARACTERS, center, asset.id))
            return
        }

        if (asset.type === "background") {
            const size = brush.size
            const cells = []
            for (let i = center.i - Math.floor(size / 2); i <= center.i + Math.floor(size / 2); i++) {
                for (let j = center.j - Math.floor(size / 2); j <= center.j + Math.floor(size / 2); j++) {
                    cells.push({ i, j })
                }
            }

            data.setLayers(data.layers.updated(BACKGROUND, cells, brush.id))
            return
        }
    }

    function onHover(cell) {
        if (cell) {
            if (brush.id === data.getItem("background", cell)) {
                setHoverImageUrl(null)
            } else {
                setHoverImageUrl(getImageUrlById(brush.id))
            }
        } else {
            setHoverImageUrl(null)
        }
    }

    useEffect(() => {
        try {
            data.reactLoadFromLocalStorage()
        } catch (e) {

        }
    }, [])

    return (
        <div className='MapEditor'>
            <div className='brush-buttons'>
                <MapEditorBrushButton src="/map/erasor.png" onClick={() => setBrush({ id: "grass", size: 1 })}>
                    Erase 1x1
                </MapEditorBrushButton>
                <MapEditorBrushButton src="/map/erasor.png" onClick={() => setBrush({ id: "grass", size: 3 })}>
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
                getItem={data.getItem}
                onBrush={onBrush}
                onHover={onHover}
                hoverSize={brush.size}
                hoverImageUrl={hoverImageUrl}
            />
            <hr />
            <button onClick={() => data.saveToLocalStorage()}>SAVE</button>
            <button onClick={() => data.reactLoadFromLocalStorage()}>LOAD</button>
        </div>
    );
}

