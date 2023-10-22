import Step from './step'
import * as cellFuncs from "./cell-funcs"
import { useSelector } from 'react-redux'
import useAssets from '../assets'
import { MAP_SIZE } from '../store'


export default function* (map, cell) {
    const { getAssetById } = useAssets()
    const spells = useSelector(state => state.spells)
    const steps = useSelector(state => state.steps)
    const skeletons = useSelector(state => state.skeletons)
    const players = useSelector(state => state.players)
    const obstacles = useSelector(state => state.obstacles)

    if (cellFuncs.isOutsideOfMap(cell, MAP_SIZE)) {
        yield { style: { background: "black" } }
        return
    }

    {
        const hasBackgroundObstacle = obstacles[cell.i + " " + cell.j] === true;
        const assetId = hasBackgroundObstacle ? "water" : "grass"
        yield { image: getAssetById(assetId).src }

        const children = (
            <div className='debug coordinates'>
                {/* {cell.i},{cell.j},{asset.id} */}
                {cell.i * MAP_SIZE + cell.j}
            </div>
        )
        yield { children }
    }

    for (const skel of skeletons) {
        if (cellFuncs.eq(skel.cell, cell)) {
            yield { image: getAssetById("skel-mage").src }
        }
    }

    for (const player of players) {
        if (cellFuncs.eq(player.cell, cell)) {
            yield { image: getAssetById("wizard").src }
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
        const arrowDescription = steps[cell.i + " " + cell.j]
        if (arrowDescription) {
            yield { children: <Step description={arrowDescription} /> }
        }
    }
}