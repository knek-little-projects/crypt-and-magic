import { BACKGROUND, CHARACTERS, PATHFINDER } from "./map/layer-types"
import { useEffect, useRef, useState } from "react"
import useMapData from "./map/data"
import Map from "./Map"
import findPath from "./map/find-path"

function eq(a, b) {
    return a.i === b.i && a.j === b.j
}

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

function useInterval(callback, delay) {
    const savedCallback = useRef()

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback
    }, [callback])

    // Set up the interval.
    useEffect(() => {
        function tick() {
            savedCallback.current()
        }
        if (delay) {
            setTimeout(tick, 0)
            let id = setInterval(tick, delay)
            return () => clearInterval(id)
        }
    }, [delay])
}


export default function MapPlayer() {
    const [runEmulation, setRunEmulation] = useState(false)
    const [moves, setMoves] = useState([])
    const [delay, setDelay] = useState(0)

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

        const cell = moves.shift()
        data.setLayers(data.layers
            .removed(PATHFINDER, cell)
            // .removed(CHARACTERS, player.cell)
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
        const background = data.getItem(BACKGROUND, cell) || "grass"
        return background !== "grass"
    }

    const onClick = cell => {
        if (runEmulation) {
            return
        }

        if (eq(cell, player.cell)) {
            return
        }

        if (moves.length > 0 && eq(moves[moves.length - 1], cell)) {
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