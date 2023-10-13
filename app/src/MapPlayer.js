import { useEffect, useRef } from "react"
import useMapData from "./map/data"
import Map from "./Map"
import { PATHFINDER } from "./map/layer-types"


export default function MapPlayer() {
    const data = useMapData()

    useEffect(() => {
        try {
            data.reactLoadFromLocalStorage()
        } catch (e) {

        }
    }, [])

    const onClick = cell => {
        const cells = [
            { i: 0, j: 0 },
            { i: 1, j: 0 },
            { i: 2, j: 0 },
            { i: 3, j: 0 },
        ]
        data.setLayers(data.layers.updated(PATHFINDER, cells, "gr"))
    }

    return (
        <>
            <Map getItem={data.getItem} onClick={onClick} />
        </>
    )
}