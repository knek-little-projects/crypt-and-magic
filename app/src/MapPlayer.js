import { BACKGROUND, CHARACTERS, PATHFINDER, SPELLS } from "./map/layer-types"
import { useEffect, useRef, useState } from "react"
import useMapData from "./map/data"
import Map from "./Map"
import findPath from "./map/find-path"
import * as cellFuncs from "./map/cell-funcs"
import useInterval from "./react-interval"
import useAssets from "./assets"


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

class Spell {
    constructor({ asset, size }) {
        this.asset = asset
        this.size = size
    }

    get id() {
        return `${this.asset.id}_${this.size}`
    }
}


export default function MapPlayer() {
    const [runEmulation, setRunEmulation] = useState(false)
    const [moves, setMoves] = useState([])
    const [delay, setDelay] = useState(0)
    const [casted, setCasted] = useState(null)
    const { assets } = useAssets()
    const mapSize = 10

    const data = useMapData()
    function getPlayer() {
        return {
            cell: data.layers.find(CHARACTERS, id => id === "wizard")
        }
    }
    const player = getPlayer()

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

        if (casted) {
            setTimeout(() => {
                data.setLayers(data.layers.cleared(SPELLS))
                setRunEmulation(false)
                setCasted(null)
            }, 1000)
            return
        }

        if (moves.length > 0) {
            setDelay(100)
        }
    }, [runEmulation])

    const isObstacle = (cell) => {
        if (cellFuncs.isOutsideOfMap(cell, mapSize)) {
            return true
        }
        const background = data.getItem(BACKGROUND, cell) || "grass"
        return background !== "grass" || data.getItem(CHARACTERS, cell)
    }

    function buildPathTo(cell) {
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

    const onClick = cell => {
        if (!player.cell) {
            return
        }

        if (runEmulation) {
            return
        }

        if (cellFuncs.eq(cell, player.cell)) {
            return
        }

        if (moves.length > 0 && cellFuncs.eq(moves[moves.length - 1], cell)) {
            setRunEmulation(true)

            return
        }

        if (selectedSpell) {
            data.setLayers(data.layers.reset(SPELLS, cell, selectedSpell.asset.id))
            setCasted({ cell, spell: selectedSpell })
            setRunEmulation(true)
            setSelectedSpell(null)
            return
        }

        buildPathTo(cell)
    }

    const [selectedSpell, setSelectedSpell] = useState(null)
    const hoverSize = selectedSpell && selectedSpell.size || 1
    const hoverImageUrl = selectedSpell && selectedSpell.asset.src

    function clearPath() {
        data.setLayers(data.layers.cleared(PATHFINDER))
        setMoves([])
    }

    function switchSpell(spell) {
        if (selectedSpell && selectedSpell.id === spell.id) {
            setSelectedSpell(null)
            return
        }
        setSelectedSpell(spell)
        clearPath()
    }

    function clearSpells() {
        data.setLayers(data.layers.cleared(SPELLS))
    }

    const magicButtons = []
    const magicSpells = assets.filter(a => a.type === "magic").map(asset => new Spell({ asset, size: 1 }))
    for (const spell of magicSpells) {
        const key = spell.asset.id + "_" + spell.size
        const onClick = () => switchSpell(spell)
        const src = spell.asset.src
        const style = {}
        // const style = selectedSpell && selectedSpell.id === spell.id && { border: "4px solid blue" } || { border: "4px solid #999" }
        const className = selectedSpell && selectedSpell.id === spell.id && "animate-border"
        const text = spell.asset.name
        magicButtons.push(
            <button
                disabled={runEmulation}
                key={key} onClick={onClick} style={style} className={className}>
                <img style={{ width: "32px" }} src={src} />
                {text}
            </button>
        )
    }

    return (
        <>
            <div>
                <button
                    disabled={runEmulation}
                    style={{ height: "40px" }}
                    onClick={() => {
                        clearPath()
                        clearSpells()
                        setSelectedSpell(null)
                    }}>
                    CLEAR
                </button>
                <div className="vr" />
                {magicButtons}
            </div>
            <Map
                hoverImageUrl={hoverImageUrl}
                hoverSize={hoverSize}
                getItem={data.getItem}
                onClick={onClick}

            />
        </>
    )
}