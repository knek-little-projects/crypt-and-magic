import { BACKGROUND, CHARACTERS, PATHFINDER } from "./map/layer-types"
import { useEffect, useRef } from "react"
import useMapData from "./map/data"
import Map from "./Map"
import findPath from "./map/find-path"

function eq(a, b) {
    return a.i === b.i && a.j === b.j
}

export default function MapPlayer() {
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

    const isObstacle = (cell) => {
        const background = data.getItem(BACKGROUND, cell) || "grass"
        return background !== "grass"
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

    const onClick = cell => {
        if (eq(cell, player.cell)) {
            return
        }

        const cells = findPath(isObstacle, player.cell, cell)
        if (!cells || cells.length == 0) {
            return
        }

        const ids = []
        cells.shift()

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