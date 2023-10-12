import React, { useEffect, useRef, useState } from 'react';

Number.prototype.mod = function (n) {
    "use strict";
    return ((this % n) + n) % n;
}

export default function useMapData() {
    const mapSize = 10

    function wrap({ i, j }) {
        return { i: i.mod(mapSize), j: j.mod(mapSize) }
    }

    function key(layer, cell) {
        const { i, j } = wrap(cell)
        return layer + " " + i + " " + j
    }

    function isLayerInKey(layer, key) {
        return String(layer) === key.split(" ")[0]
    }

    class Layers {
        constructor(data) {
            this._data = data || {}
        }

        getItem(layer, cell) {
            return this._data[key(layer, cell)]
        }

        mutate(data) {
            return new Layers(data)
        }

        withManyUpdated(layer, cells, value) {
            const updates = {}
            for (const cell of cells) {
                updates[key(layer, cell)] = value
            }
            return this.mutate({
                ...this._data,
                ...updates,
            })
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

        updated(layer, what, how) {
            if (typeof what === "function") {
                return this.map(layer, what)
            } else if (what instanceof Array) {
                return this.withManyUpdated(layer, what, how)
            } else {
                return this.withOneUpdated(layer, what, how)
            }
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
