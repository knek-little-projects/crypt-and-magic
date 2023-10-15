import React, { useEffect, useRef, useState } from 'react';


export default function useMapData() {
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

    const [layers, setLayers] = useState(new Layers())
    window.$layers = layers

    function reactLoadFromLocalStorage() {
        const { layers } = JSON.parse(localStorage.getItem("map"))
        setLayers(new Layers(layers))
    }

    function saveToLocalStorage() {
        localStorage.setItem("map", JSON.stringify({
            layers: layers.raw()
        }))
    }
    return {
        getItem: (layer, cell) => layers.getItem(layer, cell),
        layers,
        setLayers,
        reactLoadFromLocalStorage,
        saveToLocalStorage,
    }
}
