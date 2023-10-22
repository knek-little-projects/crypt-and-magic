import { useSelector } from "react-redux"
import { eq } from "./map/cell-funcs"

export function useChars() {
    
    const skeletons = useSelector(state => state.skeletons)
    const players = useSelector(state => state.players)

    function findCharAt(cell) {
        const skel = skeletons.find(skel => eq(skel.cell, cell))
        if (skel) {
            return skel
        }

        const player = players.find(pl => eq(pl.cell, cell))
        if (player) {
            return player
        }
    }

    return {
        findCharAt
    }
}