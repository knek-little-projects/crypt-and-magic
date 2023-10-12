import { useEffect, useRef } from "react"
import useMapData from "./map/data"
import useGrid from "./grid"
import useDragOffset from "./dragoffset"
import Map from "./Map"

export default function MapPlayer() {
    const data = useMapData()

    useEffect(() => {
        try {
            data.reactLoadFromLocalStorage()
        } catch (e) {

        }
    }, [])

    return (
        <Map data={data} />
    )
}