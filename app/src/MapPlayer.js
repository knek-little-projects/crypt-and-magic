import { SPELLS } from "./map/layer-types"
import { useState } from "react"
import Map from "./Map"
import findPath from "./map/find-path"
import * as cellFuncs from "./map/cell-funcs"
import { useOnchainData } from "./map/onchain-data"
import { packSteps } from "./wallet"


export default function MapPlayer() {
    const [moves, setMoves] = useState([])
    const { N, data, contract, account } = useOnchainData({ autoload: true })

    function getPlayer() {
        return data.map.findChar(account)
    }

    const player = window.$player = getPlayer()
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

        if (cellFuncs.eq(cell, player.cell)) {
            return
        }

        const chars = data.map.getCharsAt(cell)
        if (chars.length > 0) {
            if (chars.length > 1) {
                throw Error(`not implemented yet`)
            }

            async function f() {
                const tx = await contract.castSpell(0, chars[0].id).catch(e => { })
                const rx = await tx.wait()
                console.log(".castSpell() GAS USED", rx.gasUsed.toNumber())
            }

            f().catch(e => { })
            return
        }

        if (moves.length > 0 && cellFuncs.eq(moves[moves.length - 1], cell)) {

            if (moves.length > 64) {
                console.error("The path is longer 64")
                return
            }

            async function move() {
                const nonce = await contract.nonce()
                const steps = packSteps(player.cell, moves)

                const tx = await contract.move(nonce, steps,
                    // { gasLimit: 30000000 }
                )
                const rx = await tx.wait()
                console.log(".move() GAS USED", rx.gasUsed.toNumber())
            }
            move().catch(e => { })
            // setRunEmulation(true)
            return
        }

        buildPathTo(cell)
    }

    const [selectedSpell, setSelectedSpell] = useState(null)
    const hoverSize = selectedSpell && selectedSpell.size || 1
    const hoverImageUrl = selectedSpell && selectedSpell.asset.src

    function teleportIn() {
        contract.teleportIn().catch(e => { })
    }

    function teleportOut() {
        contract.teleportOut().catch(e => { })
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