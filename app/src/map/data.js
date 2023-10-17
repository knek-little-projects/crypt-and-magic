import React, { useEffect, useRef, useState } from 'react';
import { BACKGROUND, CHARACTERS, SPELLS, PATHFINDER } from './layer-types';
import * as cellFuncs from "./cell-funcs"
import Step from './step'
import useAssets from '../assets';

function key(layer, { i, j }) {
    return layer + " " + i + " " + j
}

function isLayerInKey(layer, key) {
    return String(layer) === key.split(" ")[0]
}

function keySplit(key) {
    const [layer, i, j] = key.split(" ")
    return [layer, { i: parseInt(i), j: parseInt(j) }]
}

class Layers {
    constructor(data) {
        this._data = data || {}
    }

    // getBackground(cell) {
    //     return this._getItem(BACKGROUND, cell)
    // }

    // _getItem(layer, cell) {
    //     return this._data[key(layer, cell)]
    // }

    getItem(layer, cell) {
        return this._data[key(layer, cell)]
    }

    mutate(data) {
        if (!data) {
            throw Error()
        }
        return new Layers(data)
    }

    withManyUpdatedBySignelValue(layer, cells, value) {
        const updates = {}
        for (const cell of cells) {
            updates[key(layer, cell)] = value
        }
        return this.mutate({
            ...this._data,
            ...updates,
        })
    }

    withManyUpdatedByMany(layer, cells, values) {
        const updates = {}
        for (let i = 0; i < cells.length; i++) {
            updates[key(layer, cells[i])] = values[i]
        }
        return this.mutate({
            ...this._data,
            ...updates,
        })
    }

    withManyUpdated(layer, cells, what) {
        if (what instanceof Array) {
            return this.withManyUpdatedByMany(layer, cells, what)
        } else {
            return this.withManyUpdatedBySignelValue(layer, cells, what)
        }
    }

    withOneUpdated(layer, cell, value) {
        return this.withManyUpdated(layer, [cell], value)
    }

    raw() {
        return { ...this._data }
    }

    copy() {
        return this.mutate(this._data)
    }

    map(layer, fn) {
        const copy = {}
        for (const key in this._data) {
            if (isLayerInKey(layer, key)) {
                const val = fn(this._data[key])
                if (val) {
                    copy[key] = val
                }
            } else {
                copy[key] = this._data[key]
            }
        }
        return this.mutate(copy)
    }

    find(layer, fn) {
        for (const key in this._data) {
            const [_layer, cell] = keySplit(key)
            if (layer == _layer) {
                if (fn(this._data[key])) {
                    return cell
                }
            }
        }
    }

    findAll(layer, fn) {
        const result = []
        for (const key in this._data) {
            const [_layer, cell] = keySplit(key)
            if (layer == _layer) {
                if (fn(this._data[key])) {
                    result.push(cell)
                }
            }
        }
        return result
    }

    updated(layer, what, how) {
        if (typeof what === "function") {
            return this.map(layer, what)
        } else if (what instanceof Array) {
            return this.withManyUpdated(layer, what, how)
        } else if (what === undefined) {
            throw Error(`Layer updated(layer, what): 'what' cannot be undefined`)
        } else {
            return this.withOneUpdated(layer, what, how)
        }
    }

    empty() {
        return this.mutate({})
    }

    cleared(layer) {
        return this.map(layer, () => undefined)
    }

    removed(layer, what) {
        if (layer instanceof Array) {
            let result = this
            for (const l of layer) {
                result = result.removed(l, what)
            }
            return result
        }
        if (what === undefined) {
            return this.cleared()
        }
        return this.updated(layer, what, undefined)
    }

    reset(layer, what, how) {
        return this.cleared(layer).updated(layer, what, how)
    }
}

export default function useMapData() {

    const [chars, setChars] = useState([])
    const [layers, setLayers] = useState(new Layers())

    useEffect(() => {
        const cells = []
        const ids = []
        for (const c of chars) {
            cells.push(c.cell)
            ids.push(c.asset.id)
        }
        setLayers(layers.cleared(CHARACTERS).withManyUpdatedByMany(CHARACTERS, cells, ids))
    }, [chars])

    function reactLoadFromLocalStorage() {
        const { layers, chars } = JSON.parse(localStorage.getItem("map"))
        setLayers(new Layers(layers))
        if (chars) {
            setChars(chars)
        }
    }

    function saveToLocalStorage() {
        localStorage.setItem("map", JSON.stringify({
            layers: layers.raw(),
            chars,
        }))
    }

    const { getImageUrlById } = useAssets()
    const mapSize = 10
    const getItem = (layer, cell) => {
        return layers.getItem(layer, cell)
    }

    function* getItems(cell) {
        if (cellFuncs.isOutsideOfMap(cell, mapSize)) {
            yield { style: { background: "black" } }
            return
        }
        {
            const assetId = getItem(BACKGROUND, cell) || "grass"
            const image = getImageUrlById(assetId)
            yield { image }

            const children = (
                <div className='debug coordinates'>
                    {cell.i},{cell.j},{assetId}
                </div>
            )
            yield { children }
        }
        {
            const assetId = getItem(CHARACTERS, cell)
            if (assetId) {
                const image = getImageUrlById(assetId)
                yield { image }
            }
        }
        {
            const assetId = getItem(SPELLS, cell)
            if (assetId) {
                yield {
                    className: 'opacityAnimation',
                    style: {
                        opacity: "0.75",
                    },
                    image: getImageUrlById(assetId),
                }
            }
        }
        {
            const arrowDescription = getItem(PATHFINDER, cell)
            if (arrowDescription) {
                yield { children: <Step description={arrowDescription} /> }
            }
        }
    }

    return {
        getItems,
        getItem,
        layers,
        chars,
        setChars,
        setLayers,
        reactLoadFromLocalStorage,
        saveToLocalStorage,
    }
}
