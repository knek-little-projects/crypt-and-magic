import React, { useEffect, useRef, useState } from 'react';
import useGrid from "./grid"
import useGridHover from "./gridhover"
import useDragOffset from "./dragoffset"
import useAssets from './assets'
import "./App.scss"
import useMap from './map';

export default function Map({
    map,
    hoverSize = 1,
    onMouseDown = () => { },
    onMouseUp = () => { },
    onMouseMove = () => { },
}) {
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

    const { getImageUrlById } = useAssets()

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

    if (hoverAbsCell !== null) {
        let { x, y } = grid.getOffsetedScreenCellPointByAbsCell(hoverAbsCell)
        let cellWidth = cellSize
        let cellHeight = cellSize

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
                {/* <img draggable={false} /> */}
            </div>
        )
    }

    // const players = [
    //     {
    //         cell: {
    //             i: 0,
    //             j: 0,
    //         },
    //         image: {
    //             id: "wizard",
    //         }
    //     }
    // ]

    // players.forEach(p => {
    //     const { x, y } = grid.getOffsetedScreenCellPointByAbsCell(grid.mod(p.cell, mapSize))
    //     cells.push(
    //         <div
    //             className='cell'
    //             style={{
    //                 left: x + 'px',
    //                 top: y + 'px',
    //                 width: cellSize + 'px',
    //                 height: cellSize + 'px',
    //             }}
    //         >
    //             <img draggable={false} src={getImageUrlById(p.image.id)} />
    //         </div>
    //     )
    // })


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
                onMouseDown={e => onMouseDown(e) + dragHandlers.onMouseDown(e)}
                onMouseUp={e => onMouseUp(e) + dragHandlers.onMouseUp(e)}
                onMouseMove={e => onMouseMove(e) + dragHandlers.onMouseMove(e) + onGridHover(e)}
                onMouseLeave={e => onGridLeave(e)}
            >
                {cells}
            </div>
        </div>
    );
}
