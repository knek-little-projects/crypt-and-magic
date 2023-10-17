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
    image,
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
            {image && <img src={image} draggable={false} />}
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

    function* getItems(cell) {
        if (cellFuncs.isOutsideOfMap(cell, mapSize)) {
            yield { style: { background: "black" } }
            return
        }
        {
            const assetId = getItem(BACKGROUND, cell) || "grass"
            const image = getImageUrlById(assetId)
            yield { image }

            const children = (
                <div className='debug coordinates'>
                    {cell.i},{cell.j},{assetId}
                </div>
            )
            yield { children }
        }
        {
            const assetId = getItem(CHARACTERS, cell)
            if (assetId) {
                const image = getImageUrlById(assetId)
                yield { image }
            }
        }
        {
            const assetId = getItem(SPELLS, cell)
            if (assetId) {
                yield {
                    className: 'opacityAnimation',
                    style: {
                        opacity: "0.75",
                    },
                    image: getImageUrlById(assetId),
                }
            }
        }
        {
            const arrowDescription = getItem(PATHFINDER, cell)
            if (arrowDescription) {
                yield { children: <Step description={arrowDescription} /> }
            }
        }
    }

    for (let i = -1; i < width / cellSize; i++) {
        for (let j = -1; j < height / cellSize; j++) {
            const absCell = grid.getAbsCellByScreenCell({ i, j });
            const { x, y } = grid.getOffsetedScreenCellPointByScreenCell({ i, j })

            let index = 0
            for (const item of getItems(absCell)) {
                const key = `cell_${i}_${j}_${index++}`
                cells.push(<Cell x={x} y={y} cellSize={cellSize} key={key} {...item} />)
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

