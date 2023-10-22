import Step from './step'
import * as cellFuncs from "./cell-funcs"
import { useSelector } from 'react-redux'
import useAssets from '../assets'


export default function* (map, cell) {
    const { assets, getAssetById } = useAssets()
    const spells = useSelector(state => state.spells)
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
        for (const char of map.getCharsAt(cell)) {
            for (const spell of spells) {
                console.log(">>>", spell)
                if (char.id == spell.idTo) {
                    yield {
                        className: 'opacityAnimation',
                        style: {
                            opacity: "0.75",
                        },
                        image: getAssetById(spell.assetId).src,
                    }
                }
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