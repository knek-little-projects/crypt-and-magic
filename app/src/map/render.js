import Step from './step'
import * as cellFuncs from "./cell-funcs"


export default function* (map, cell) {
    const mapSize = map.getSize()

    if (cellFuncs.isOutsideOfMap(cell, mapSize)) {
        yield { style: { background: "black" } }
        return
    }
    {
        const { asset } = map.getBackgroundAt(cell)
        yield { image: asset.src }

        const children = (
            <div className='debug coordinates'>
                {/* {cell.i},{cell.j},{asset.id} */}
                {cell.i * mapSize + cell.j}
            </div>
        )
        yield { children }
    }
    {
        const chars = map.getCharsAt(cell)
        if (chars.length > 0) {
            if (chars.length > 1) {
                throw Error(`not implemented yet`)
            }
            const { asset } = chars[0]
            if (!asset) {
                throw Error(`asset is empty for char ${JSON.stringify(chars[0])}`)
            }
            yield { image: asset.src }
        }
    }
    {
        const spells = map.getSpellsAt(cell)
        for (const spell of spells) {
            if (!spell.asset) {
                throw Error(`spell.asset is empty for spell ${spell}`)
            }
            yield {
                className: 'opacityAnimation',
                style: {
                    opacity: "0.75",
                },
                image: spell.asset.src,
            }
        }
    }
    {
        const arrowDescription = map.getStepAt(cell)
        if (arrowDescription) {
            yield { children: <Step description={arrowDescription} /> }
        }
    }
}