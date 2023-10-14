import React, { useEffect, useRef, useState } from 'react';
import useAssets from './assets'
import "./App.scss"
import useGridHover from './gridhover';
import useDragOffset from './dragoffset';
import useGrid from './grid';
import { BACKGROUND, CHARACTERS, PATHFINDER, SPELLS } from './map/layer-types';
import Step from "./map/step"
import * as cellFuncs from "./map/cell-funcs"

export default function Map({
    getItem,
    hoverSize = 1,
    hoverImageUrl = null,
    onBrush = () => { },
    onHover = () => { },
    onClick = () => { },
}) {
    const { offset, dragHandlers } = useDragOffset({ mouseButton: 2 })

    const mapSize = 10
    const cellSize = 50
    const grid = useGrid({ offset, cellSize, mapSize })

    const width = 500
    const height = 500
    const displayIJ = true

    const ref = useRef()
    const { hoverAbsCell, onGridHover, onGridLeave } = useGridHover(grid, ref)

    const { dragHandlers: brushHandlers } = useDragOffset({
        mouseButton: 0,
        onOffsetChange: e => onBrush(grid.getAbsCellByEvent(e, ref.current))
    })

    const cells = []

    const { getImageUrlById } = useAssets()

    for (let i = -1; i < width / cellSize; i++) {
        for (let j = -1; j < height / cellSize; j++) {
            const absCell = grid.getAbsCellByScreenCell({ i, j });
            const { x, y } = grid.getOffsetedScreenCellPointByScreenCell({ i, j })

            if (cellFuncs.isOutsideOfMap(absCell, mapSize)) {
                cells.push(
                    <div
                        key={`cell_${i}_${j}`}
                        className='cell'
                        style={{
                            left: x + 'px',
                            top: y + 'px',
                            width: cellSize + 'px',
                            height: cellSize + 'px',
                            background: "black",
                        }}
                    />
                )
                continue;
            }

            const backgroundId = getItem(BACKGROUND, absCell) || "grass"
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

            const foregroundId = getItem(CHARACTERS, absCell)
            if (foregroundId) {
                cells.push(
                    <div
                        key={`cell_fg_${i}_${j}`}
                        className='cell'
                        style={{
                            left: x + 'px',
                            top: y + 'px',
                            width: cellSize + 'px',
                            height: cellSize + 'px',
                            backgroundImage: "url('" + getImageUrlById(foregroundId) + "')",
                        }}
                    />
                )
            }

            const spellId = getItem(SPELLS, absCell)
            if (spellId) {
                cells.push(
                    <div
                        key={`cell_planspell_${i}_${j}`}
                        className='cell opacityAnimation'
                        style={{
                            left: x + 'px',
                            top: y + 'px',
                            width: cellSize + 'px',
                            height: cellSize + 'px',
                            // filter: "grayscale(0.99)",
                            opacity: "0.75",
                        }}
                    >
                        <img src={getImageUrlById(spellId)} draggable={false} />
                    </div>
                )
            }

            const arrowDescription = getItem(PATHFINDER, absCell)
            if (arrowDescription) {
                cells.push(
                    <div
                        key={`cell_arrow_${i}_${j}`}
                        className='cell'
                        style={{
                            left: x + 'px',
                            top: y + 'px',
                            width: cellSize + 'px',
                            height: cellSize + 'px',
                        }}
                    >
                        <Step description={arrowDescription} />
                    </div>
                )
            }
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
                    backgroundColor: "rgba(100, 100, 100, 0.5)",
                }}
            >
                {
                    hoverImageUrl &&
                    <img src={hoverImageUrl} draggable={false} />
                }
            </div>
        )
    }

    useEffect(() => {
        onHover(hoverAbsCell)
    }, [hoverAbsCell])

    function _onClick(e) {
        onClick(grid.getAbsCellByEvent(e, ref.current))
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
                onClick={e => _onClick(e)}
                onMouseDown={e => dragHandlers.onMouseDown(e) + brushHandlers.onMouseDown(e)}
                onMouseUp={e => dragHandlers.onMouseUp(e) + brushHandlers.onMouseUp(e)}
                onMouseMove={e => dragHandlers.onMouseMove(e) + brushHandlers.onMouseMove(e) + onGridHover(e)}
                onMouseLeave={e => onGridLeave(e)}
            >
                {cells}
            </div>
        </div>
    );
}

