import React, { useEffect, useRef, useState } from 'react';
import useAssets from './assets'
import "./App.scss"
import useGridHover from './gridhover';
import useDragOffset from './dragoffset';
import useGrid from './grid';
import { BACKGROUND, CHARACTERS, PATHFINDER, SPELLS } from './map/layer-types';
import Step from "./map/step"
import * as cellFuncs from "./map/cell-funcs"

function Cell({
    x,
    y,
    cellSize,
    children,
    style,
    className,
}) {
    const style_ = {
        left: x + 'px',
        top: y + 'px',
        width: cellSize + 'px',
        height: cellSize + 'px',
        ...style,
    }
    const className_ = `cell ${className}`
    return (
        <div
            className={className_}
            style={style_}
        >
            {children}
        </div>
    )
}

export default function Map({
    getItem,
    hoverSize = 1,
    hoverImageUrl = null,
    hoverStyle = {},
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
                    <Cell
                        key={`cell_${i}_${j}`}
                        x={x}
                        y={y}
                        cellSize={cellSize}
                        style={{
                            background: "black"
                        }}
                    />
                )
                continue;
            }

            const backgroundId = getItem(BACKGROUND, absCell) || "grass"
            cells.push(
                <Cell
                    key={`cell_${i}_${j}`}
                    cellSize={cellSize}
                    x={x}
                    y={y}
                    style={{
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
                </Cell>
            )

            const foregroundId = getItem(CHARACTERS, absCell)
            if (foregroundId) {
                cells.push(
                    <Cell
                        x={x}
                        y={y}
                        cellSize={cellSize}
                        style={{
                            backgroundImage: "url('" + getImageUrlById(foregroundId) + "')",
                        }}
                    />
                )
            }

            const spellId = getItem(SPELLS, absCell)
            if (spellId) {
                cells.push(
                    <Cell
                        key={`cell_planspell_${i}_${j}`}
                        className='opacityAnimation'
                        x={x}
                        y={y}
                        cellSize={cellSize}
                        style={{
                            opacity: "0.75",
                        }}
                    >
                        <img src={getImageUrlById(spellId)} draggable={false} />
                    </Cell>
                )
            }

            const arrowDescription = getItem(PATHFINDER, absCell)
            if (arrowDescription) {
                cells.push(
                    <Cell
                        key={`cell_arrow_${i}_${j}`}
                        x={x}
                        y={y}
                        cellSize={cellSize}
                    >
                        <Step description={arrowDescription} />
                    </Cell>
                )
            }
        }
    }

    if (hoverAbsCell !== null) {
        let { x, y } = grid.getOffsetedScreenCellPointByAbsCell(hoverAbsCell)
        let cellSize_ = cellSize * hoverSize

        if (hoverSize > 1) {
            const offset = Math.floor(hoverSize / 2)
            x -= offset * cellSize
            y -= offset * cellSize
        }

        cells.push(
            <Cell
                key="cell_hover"
                className='cell-hover'
                x={x}
                y={y}
                cellSize={cellSize_}
                style={{
                    backgroundColor: "rgba(100, 100, 100, 0.5)",
                    ...hoverStyle,
                }}
            >
                {
                    hoverImageUrl &&
                    <img src={hoverImageUrl} draggable={false} />
                }
            </Cell>
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

