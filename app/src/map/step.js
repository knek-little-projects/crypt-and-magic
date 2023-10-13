import Arrow from "./arrow"
import Cross from "./cross"

const colors = { g: "green", r: "red", b: "brown", e: "grey" }

const angles = {
    r: -90,
    l: 90,
    t: 180,
    b: 0,
    tl: 180 - 45,
    tr: 180 + 45,
    bl: 0 + 45,
    br: 0 - 45,
}

export default function getArrow({ description }) {
    const colorType = colors[description[0]]

    if (description[1] === "c") {
        return <Cross colorType={colorType} />
    }

    const angle = angles[description.slice(1)]
    return <Arrow colorType={colorType} angle={angle} />
}
