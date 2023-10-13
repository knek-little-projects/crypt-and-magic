import React, { useEffect, useRef, useState } from 'react';
import useAssets from './assets'
import "./App.scss"
import useGridHover from './gridhover';
import useDragOffset from './dragoffset';
import useGrid from './grid';
import { BACKGROUND, CHARACTERS, PATHFINDER } from './map/layer-types';



function Arrow({
    // x, y, 
    width, height,
    angle,
    colorType }) {
    const asset = useAssets().getAssetById(colorType + "-darr")

    return (
        <div style={{
            // position: 'absolute',
            // left: x + 'px',
            // top: y + 'px',
            // width: width + 'px',
            // height: height + 'px',
            width: "100%",
            height: "100%",
            rotate: angle + 'deg',
        }}>
            <img src={asset.src} style={{
                position: "relative",
                left: "13.5%",
                width: "75%",
                height: "100%",
            }} />
        </div>
    )
}

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


    function getArrow(description) {
        const colors = { g: "green", r: "red", b: "brown", e: "grey" }
        const angles = {
            r: -90,
            l: 90,
            t: 180,
            b: 0,
            tl: 180 - 45,
            tr: 180 + 45,
            bl: 0 + 45,
            br: 0 - 45,
        }

        const colorType = colors[description[0]]
        const angle = angles[description.slice(1)]
        return <Arrow colorType={colorType} angle={angle} />
    }

    const cells = []

    const { getImageUrlById } = useAssets()

    for (let i = -1; i < width / cellSize; i++) {
        for (let j = -1; j < height / cellSize; j++) {
            const absCell = grid.getAbsCellByScreenCell({ i, j });
            const { x, y } = grid.getOffsetedScreenCellPointByScreenCell({ i, j })

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
                        {getArrow(arrowDescription)}
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

