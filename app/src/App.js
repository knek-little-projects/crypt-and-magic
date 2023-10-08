import React, { useEffect, useRef, useState } from 'react';
import useGrid from "./grid"
import useGridHover from "./gridhover"
import useDragOffset from "./dragoffset"

import "./App.scss"


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

    return (
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
    );
}

