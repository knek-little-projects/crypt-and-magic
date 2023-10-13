import useAssets from '../assets'


export default function Cross({ colorType }) {
    const asset = useAssets().getAssetById(colorType + "-cross")
    return (
        <div style={{
            width: "100%",
            height: "100%",
        }}>
            <img src={asset.src} style={{
                position: "relative",
                left: "10%",
                top: "10%",
                width: "80%",
                height: "80%",
            }} />
        </div>
    )
}