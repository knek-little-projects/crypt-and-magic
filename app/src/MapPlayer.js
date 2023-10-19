import { SPELLS } from "./map/layer-types"
import { useEffect, useRef, useState } from "react"
import useMapData from "./map/data"
import Map from "./Map"
import findPath from "./map/find-path"
import * as cellFuncs from "./map/cell-funcs"
import useInterval from "./react-interval"
import useAssets from "./assets"
import uuidv4 from "./uuid"
import { useOnchainData } from "./map/onchain-data"


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
    const { assets, getAssetById } = useAssets()
    const magicSpells = assets.filter(a => a.type === SPELLS).map(asset => new Spell({ asset, size: 1 }))

    const { data, contract, account } = useOnchainData({ autoload: true })

    function getPlayer() {
        return data.map.findChar(account)
    }

    const player = window.$player = getPlayer()

    useEffect(() => {
        try {
            data.reactLoadFromLocalStorage()
        } catch (e) {

        }
    }, [])

    function updateSkeletons(additonalObstacle) {
        const skeletons = data.map.getChars().filter(char => char.asset.set === "skeletons")
        for (const skel of skeletons) {
            if (skel.movement === undefined) {
                skel.movement = +1
            }
            const { i, j } = skel.cell;
            let nextCell = { i: i + skel.movement, j }
            if (isObstacle(nextCell) && !cellFuncs.eq(player.cell, nextCell)) {
                skel.movement = -skel.movement
                nextCell = { i: i + skel.movement, j }
            }
            if (isObstacle(nextCell)) {
                continue
            }
            if (cellFuncs.eq(nextCell, additonalObstacle)) {
                continue
            }
            skel.cell = nextCell
        }
    }

    useInterval(() => {
        if (moves.length === 0) {
            setDelay(0)
            setRunEmulation(false)
            return
        }

        const player = getPlayer()
        const currentMove = moves.shift()  // dangerously anti react
        if (isObstacle(currentMove)) {
            while (moves.shift()) { };
            return
        }

        updateSkeletons(currentMove)
        player.cell = currentMove;

        let swordAttack = false
        {
            const player = getPlayer()
            for (const skel of data.map.getChars().filter(char => char.asset.set === "skeletons")) {
                if (isAround(skel.cell, player.cell)) {
                    swordAttack = true
                    break
                }
            }
        }

        const map = data.map
        map.removeStepAt(currentMove)
        if (swordAttack) {
            map.addSpell({
                id: uuidv4(),
                asset: getAssetById("skel-sword"),
                targetId: player.id,
            })
            player.damage += 25
        }

        map.replaceChar(player)

        console.warn("Everybody immortale")
        // data.map.getChars().filter(char => char.damage >= 100).forEach(char => data.map.removeChar(char))
        
        data.commit()
    }, delay)

    function isAround(a, b) {
        return Math.abs(a.i - b.i) <= 1 && Math.abs(a.j - b.j) <= 1
    }

    useEffect(() => {
        if (!runEmulation) {
            return
        }

        if (casted) {
            setTimeout(() => {
                data.map.getSpells().forEach(spell => data.map.getCharsAtSpell(spell).forEach(char => char.damage += 40))
                data.map.getChars().filter(char => char.health <= 0).forEach(char => data.map.removeChar(char))
                data.map.clearSpells()
                data.commit()
                setRunEmulation(false)
                setCasted(null)
            }, 1000)
            return
        }

        if (moves.length > 0) {
            setDelay(100)
        }
    }, [runEmulation])

    const isObstacle = (cell) => data.map.hasObstacle(cell)

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
            const id = colorType + cellFuncs.getArrowDirection(cells[i], cells[i + 1])
            ids.push(id)
        }

        ids.push(colorType + "c")
        data.map.setSteps(cells, ids)
        data.commit()
    }

    const onClick = cell => {
        if (!player || !player.cell) {
            return
        }

        if (runEmulation) {
            return
        }

        if (cellFuncs.eq(cell, player.cell)) {
            return
        }

        const chars = data.map.getCharsAt(cell)
        if (chars.length > 0) {
            if (chars.length > 1) {
                throw Error(`not implemented yet`)
            }
            if (magicSpells.length === 0) {
                console.error("No spells")
                return
            }
            data.map.clearSpells()
            data.map.addSpell({
                id: uuidv4(),
                asset: magicSpells[0].asset,
                targetId: chars[0].id,
            })
            data.commit()
            setCasted({ cell, spell: magicSpells[0] })
            setRunEmulation(true)
            setSelectedSpell(null)
            return
        }

        if (moves.length > 0 && cellFuncs.eq(moves[moves.length - 1], cell)) {
            setRunEmulation(true)
            return
        }

        if (selectedSpell) {
            data.map.clearSpells()
            data.map.addSpell({
                id: uuidv4(),
                asset: selectedSpell.asset,
                cell,
            })
            data.commit()
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

    function switchSpell(spell) {
        if (selectedSpell && selectedSpell.id === spell.id) {
            setSelectedSpell(null)
            return
        }
        setSelectedSpell(spell)
        data.map.setSteps([])
        data.commit()
        setMoves([])
    }

    const magicButtons = []
    for (const spell of magicSpells) {
        const key = spell.asset.id + "_" + spell.size
        const onClick = () => switchSpell(spell)
        const src = spell.asset.src
        const style = {}
        const className = selectedSpell && selectedSpell.id === spell.id && "animate-border" || ""
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

    async function teleportIn() {
        await contract.teleportIn()
    }

    async function teleportOut() {
        await contract.teleportOut()
    }

    return (
        <>
            {
                account &&
                <p>Connected Account: {account}</p>
                ||
                <div>Unlock MetaMask and reload the page</div>
            }
            {
                contract &&
                <>
                    {
                        player 
                        &&
                        <button onClick={teleportOut}>Teleport out</button>
                        ||
                        <button onClick={teleportIn}>Teleport in</button>
                    }
                    <br />
                    <br />
                    {player &&
                        <div>
                            <button
                                disabled={runEmulation}
                                style={{ height: "40px" }}
                                onClick={() => {
                                    data.map.setSteps([])
                                    data.map.clearSpells()
                                    data.commit()
                                    setMoves([])
                                    setSelectedSpell(null)
                                }}>
                                CLEAR
                            </button>
                            <div className="vr" />
                            {magicButtons}
                        </div>
                    }
                    <Map
                        hoverImageUrl={hoverImageUrl}
                        hoverSize={hoverSize}
                        mapSize={data.mapSize}
                        getItems={data.getItems}
                        onClick={onClick}
                    />
                </>
            }
        </>
    )
}