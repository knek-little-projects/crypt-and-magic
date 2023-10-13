import useAssets from '../assets'


export default function Arrow({
    angle,
    colorType,
}) {
    const asset = useAssets().getAssetById(colorType + "-darr")

    return (
        <div style={{
            width: "100%",
            height: "100%",
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