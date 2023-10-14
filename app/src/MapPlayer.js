import { BACKGROUND, CHARACTERS, PATHFINDER } from "./map/layer-types"
import { useEffect, useRef, useState } from "react"
import useMapData from "./map/data"
import Map from "./Map"
import findPath from "./map/find-path"
import * as cellFuncs from "./map/cell-funcs"
import useInterval from "./react-interval"


function getArrowDirection(a, b) {
    if (a.i < b.i && a.j === b.j) {
        return "r"
    } else if (a.i > b.i && a.j === b.j) {
        return "l"
    } else if (a.j < b.j && a.i === b.i) {
        return "b"
    } else if (a.j > b.j && a.i === b.i) {
        return "t"
    } else {
        throw Error(`Arrow direction undefined since the points are identical: ${JSON.stringify([a, b])}`)
    }
}



export default function MapPlayer() {
    const [runEmulation, setRunEmulation] = useState(false)
    const [moves, setMoves] = useState([])
    const [delay, setDelay] = useState(0)
    const mapSize = 10

    const data = useMapData()
    const player = {
        cell: data.layers.find(CHARACTERS, id => id !== null)
    }

    useEffect(() => {
        try {
            data.reactLoadFromLocalStorage()
        } catch (e) {

        }
    }, [])

    useInterval(() => {
        if (moves.length === 0) {
            setDelay(0)
            setRunEmulation(false)
            return
        }

        const currentMove = moves.shift()
        data.setLayers(data.layers
            .removed(PATHFINDER, currentMove)
            .reset(CHARACTERS, currentMove, "wizard")
        )
    }, delay)

    useEffect(() => {
        if (!runEmulation) {
            return
        }
        if (moves.length === 0) {
            return
        }
        setDelay(100)
    }, [runEmulation])

    const isObstacle = (cell) => {
        if (cellFuncs.isOutsideOfMap(cell, mapSize)) {
            return true
        }
        const background = data.getItem(BACKGROUND, cell) || "grass"
        return background !== "grass"
    }

    const onClick = cell => {
        if (runEmulation) {
            return
        }

        if (cellFuncs.eq(cell, player.cell)) {
            return
        }

        if (moves.length > 0 && cellFuncs.eq(moves[moves.length - 1], cell)) {
            setRunEmulation(true)
        }

        const cells = findPath(isObstacle, player.cell, cell)
        if (!cells || cells.length == 0) {
            return
        }

        const ids = []
        cells.shift()
        setMoves(cells)

        const colorType = "g"
        for (let i = 0; i < cells.length - 1; i++) {
            const id = colorType + getArrowDirection(cells[i], cells[i + 1])
            ids.push(id)
        }

        ids.push(colorType + "c")
        data.setLayers(data.layers.reset(PATHFINDER, cells, ids))
    }

    return (
        <>
            <Map getItem={data.getItem} onClick={onClick} />
        </>
    )
}