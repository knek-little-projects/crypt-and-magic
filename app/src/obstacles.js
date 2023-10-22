import { useSelector } from "react-redux"
import { eq } from "./map/cell-funcs"

export function useObstacles() {
    const players = useSelector(state => state.players)
    const skeletons = useSelector(state => state.skeletons)
    const obstacles = useSelector(state => state.obstacles)

    const hasObstacle = cell => {
        if (obstacles[cell.i + " " + cell.j]) {
            return true
        }

        for (const player of players) {
            if (eq(player.cell, cell)) {
                return true
            }
        }

        for (const skel of skeletons) {
            if (eq(skel.cell, cell)) {
                return true
            }
        }

        return false
    }

    return { hasObstacle }
}