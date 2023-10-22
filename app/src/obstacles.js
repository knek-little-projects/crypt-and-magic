import { eq } from "./map/cell-funcs"

export function useObstacles() {
    const players = useSelector(state => state.players)
    
    const hasObstacle = cell => {
        for (const player of players) {
            if (eq(player.cell, cell)) {
                return true
            }
        }
    }
}