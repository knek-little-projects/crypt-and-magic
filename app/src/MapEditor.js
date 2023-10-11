import React, { useEffect, useRef, useState } from 'react';
import useAssets from './assets'

import "./App.scss"
import useMapData from './map/data';
import Map from "./Map"

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
    const { assets, getImageUrlById } = useAssets()
    const [brush, setBrush] = useState({ id: "grass", size: 1 })
    const [hoverImageUrl, setHoverImageUrl] = useState(null)

    const buttons = assets.filter(o => o.type === "background").map(o => (
        <MapEditorBrushButton src={o.src} key={o.id} onClick={() => setBrush({ id: o.id, size: 1 })}>
            {o.name}
        </MapEditorBrushButton>
    ))

    function onBrush(center) {
        if (brush === null) {
            return
        }

        const size = brush.size
        const cells = []
        for (let i = center.i - Math.floor(size / 2); i <= center.i + Math.floor(size / 2); i++) {
            for (let j = center.j - Math.floor(size / 2); j <= center.j + Math.floor(size / 2); j++) {
                cells.push({ i, j })
            }
        }
        data.background.setItems(cells, brush.id)
    }

    function onHover(cell) {
        if (cell) {
            if (brush.id === data.background.getItem(cell)) {
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
            data.loadFromLocalStorage()
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
            </div>
            <hr />
            <Map
                data={data}
                onBrush={onBrush}
                onHover={onHover}
                hoverSize={brush.size}
                hoverImageUrl={hoverImageUrl}
            />
            <hr />
            <button onClick={() => data.saveToLocalStorage()}>SAVE</button>
            <button onClick={() => data.loadFromLocalStorage()}>LOAD</button>
        </div>
    );
}

