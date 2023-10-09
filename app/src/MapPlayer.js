import { useEffect } from "react"
import Map from "./Map"
import useMap from "./map"

export default function MapPlayer() {
    const map = useMap()

    useEffect(() => {
        try {
            map.loadFromLocalStorage()
        } catch (e) {

        }
    }, [])

    return (
        <Map map={map} />
    )
}