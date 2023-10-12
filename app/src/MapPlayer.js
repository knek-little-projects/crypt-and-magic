import { useEffect, useRef } from "react"
import useMapData from "./map/data"
import Map from "./Map"
import useAssets from "./assets"


function Arrow({ x, y, width, height, angle, colorType }) {
    const asset = useAssets().getAssetById(colorType + "-darr")

    return (
        <div style={{
            position: 'absolute',
            left: x + 'px',
            top: y + 'px',
            width: width + 'px',
            height: height + 'px',
            rotate: angle + 'deg',
        }}>
            <img src={asset.src} style={{
                position: "relative",
                left: "13.5%",
                width: "75%",
                height: "100%",
            }} />
        </div>
    )
}


export default function MapPlayer() {
    const data = useMapData()

    useEffect(() => {
        try {
            data.reactLoadFromLocalStorage()
        } catch (e) {

        }
    }, [])

    const onClick = cell => {
        console.log(cell)
    }

    return (
        <>
            <Map getItem={data.getItem} onClick={onClick} />
            <Arrow colorType="red" x={100} y={100} width={40} height={40} />
        </>
    )
}