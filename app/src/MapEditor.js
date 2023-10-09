import React, { useEffect, useRef, useState } from 'react';
import useGrid from "./grid"
import useGridHover from "./gridhover"
import useDragOffset from "./dragoffset"
import useAssets from './assets'

import "./App.scss"
import useMap from './map';

function MapEditorBrushButton({ src, onClick, children }) {
    return (
        <button onClick={onClick}>
            <img width={25} height={25} src={src} />
            {children}
        </button>
    )
}


export default function MapEditor() {
    const cellSize = 50
    const width = 500
    const height = 500
    const displayIJ = true
    const mapSize = 10

    const { offset, dragHandlers } = useDragOffset({ mouseButton: 2 })
    const grid = useGrid({ offset, cellSize, mapSize })

    const ref = useRef()
    const { hoverAbsCell, onGridHover, onGridLeave } = useGridHover(grid, ref)

    const map = useMap()
    const cells = []

    const { assets, getImageUrlById } = useAssets()

    for (let i = -1; i < width / cellSize; i++) {
        for (let j = -1; j < height / cellSize; j++) {
            const absCell = grid.mod(grid.getAbsCellByScreenCell({ i, j }), mapSize)
            const { x, y } = grid.getOffsetedScreenCellPointByScreenCell({ i, j })
            const backgroundId = map.background.getItem(absCell)
            cells.push(
                <div
                    key={`cell_${i}_${j}`}
                    className='cell'
                    style={{
                        left: x + 'px',
                        top: y + 'px',
                        width: cellSize + 'px',
                        height: cellSize + 'px',
                        backgroundImage: "url('" + getImageUrlById(backgroundId) + "')",
                    }}
                >
                    {
                        displayIJ
                        &&
                        <div className='debug coordinates'>
                            {absCell.i},{absCell.j},{backgroundId}
                        </div>
                    }
                </div>
            )
        }
    }

    const [brush, setBrush] = useState({ id: "grass", size: 1 })

    if (hoverAbsCell !== null) {
        let { x, y } = grid.getOffsetedScreenCellPointByAbsCell(hoverAbsCell)
        let cellWidth = cellSize
        let cellHeight = cellSize

        const hoverSize = brush.size
        if (hoverSize > 1) {
            cellWidth = hoverSize * cellSize
            cellHeight = hoverSize * cellSize
            const offset = Math.floor(hoverSize / 2)
            x -= offset * cellSize
            y -= offset * cellSize
        }

        cells.push(
            <div
                key="cell_hover"
                className='cell cell-hover'
                style={{
                    left: x + 'px',
                    top: y + 'px',
                    width: cellWidth + 'px',
                    height: cellHeight + 'px',
                    backgroundColor: "rgba(100, 100, 100, 0.5)"
                }}
            >
                <img draggable={false} />
            </div>
        )

    }

    const buttons = assets.filter(o => o.type === "background").map(o => (
        <MapEditorBrushButton src={o.src} key={o.id} onClick={() => setBrush({ id: o.id, size: 1 })}>
            {o.name}
        </MapEditorBrushButton>
    ))


    function setBackgroundAtEvent(e) {
        if (brush === null) {
            return
        }
        const center = grid.getAbsCellByEvent(e, ref.current)
        const size = brush.size || 1

        const cells = []
        for (let i = center.i - Math.floor(size / 2); i <= center.i + Math.floor(size / 2); i++) {
            for (let j = center.j - Math.floor(size / 2); j <= center.j + Math.floor(size / 2); j++) {
                cells.push(grid.mod({ i, j }, mapSize))
            }
        }

        map.background.setItems(cells, brush.id)
    }
    const { dragHandlers: brushHandlers } = useDragOffset({
        mouseButton: 0,
        onOffsetChange: e => setBackgroundAtEvent(e)
    })
    
    const save = () => {
        localStorage.setItem("map", JSON.stringify(map.toData()))
    }
    const load = () => {
        map.setData(JSON.parse(localStorage.getItem("map")))
    }
    useEffect(() => {
        try {
            load()
        } catch(e) {
            
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
            </div>
            <hr />
            <div className="map">
                <div
                    ref={ref}
                    className='cell-wrapper'
                    style={{
                        width: width + 'px',
                        height: height + 'px',
                    }}
                    onContextMenu={e => e.preventDefault()}
                    onMouseDown={e => dragHandlers.onMouseDown(e) + brushHandlers.onMouseDown(e) + (e.button === 0 && setBackgroundAtEvent(e))}
                    onMouseUp={e => dragHandlers.onMouseUp(e) + brushHandlers.onMouseUp(e)}
                    onMouseMove={e => dragHandlers.onMouseMove(e) + brushHandlers.onMouseMove(e) + onGridHover(e)}
                    onMouseLeave={e => onGridLeave(e)}
                >
                    {cells}
                </div>
            </div>
            <hr />
            <button onClick={save}>SAVE</button>
            <button onClick={load}>LOAD</button>
        </div>
    );
}

