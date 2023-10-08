import React, { useEffect, useRef, useState } from 'react';
import useGrid from "./grid"
import useGridHover from "./gridhover"
import useDragOffset from "./dragoffset"

import "./App.scss"


function useMapObjects() {
    return {
        objects: [
            {
                name: "grass",
                id: "grass",
                src: "/map/grass.png"
            },
            {
                name: "water",
                id: "water",
                src: "/map/water.png"
            }
        ]
    }
}


function MapEditorBrushButton({ src, onClick, children }) {
    return (
        <button onClick={onClick}>
            <img width={25} height={25} src={src} />
            {children}
        </button>
    )
}


export default function App() {
    const cellSize = 50
    const width = 500
    const height = 500
    const displayIJ = true
    const mapSize = 10

    const { offset, dragHandlers } = useDragOffset({ mouseButton: 2 })
    const grid = useGrid({ offset, cellSize, mapSize })

    const ref = useRef()
    const { hoverAbsCell, onGridHover, onGridLeave } = useGridHover(grid, ref)

    const cells = []

    for (let i = -1; i < width / cellSize; i++) {
        for (let j = -1; j < height / cellSize; j++) {
            const absCell = grid.mod(grid.getAbsCellByScreenCell({ i, j }), mapSize)
            const { x, y } = grid.getOffsetedScreenCellPointByScreenCell({ i, j })
            cells.push(
                <div
                    key={`cell_${i}_${j}`}
                    className='cell'
                    style={{
                        left: x + 'px',
                        top: y + 'px',
                        width: cellSize + 'px',
                        height: cellSize + 'px',
                        backgroundImage: "url('/map/grass.png')",
                    }}
                >
                    {displayIJ &&
                        <div className='debug coordinates'>{absCell.i},{absCell.j}</div>
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

    const { objects } = useMapObjects()
    const buttons = objects.map(o => (
        <MapEditorBrushButton src={o.src} key={o.id}>
            {o.name}
        </MapEditorBrushButton>
    ))

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
                    onMouseDown={e => dragHandlers.onMouseDown(e)}
                    onMouseUp={e => dragHandlers.onMouseUp(e)}
                    onMouseMove={e => dragHandlers.onMouseMove(e) + onGridHover(e)}
                    onMouseLeave={e => onGridLeave(e)}
                >
                    {cells}
                </div>
            </div>
        </div>
    );
}

