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

    function key(cell) {
        const { i, j } = wrap(cell)
        return i + " " + j
    }

    class ImmutableLayer {
        constructor(data) {
            this._data = data || {}
        }

        getItem(cell) {
            return this._data[key(cell)]
        }

        mutate(data) {
            return new ImmutableLayer(data)
        }

        withManyUpdated(cells, value) {
            const updates = {}
            for (const cell of cells) {
                updates[key(cell)] = value
            }
            return this.mutate({
                ...this._data,
                ...updates,
            })
        }

        withOneUpdated(cell, value) {
            return this.withManyUpdated([cell], value)
        }

        raw() {
            return { ...this._data }
        }

        map(fn) {
            const copy = {}
            for (const key in this._data) {
                const val = fn(this._data[key])
                if (val) {
                    copy[key] = val
                }
            }
            return this.mutate(copy)
        }
    }

    const [background, setBackground] = useState(new ImmutableLayer())
    const [foreground, setForeground] = useState(new ImmutableLayer())

    function reactLoadFromLocalStorage() {
        const { background, foreground } = JSON.parse(localStorage.getItem("map"))
        setBackground(new ImmutableLayer(background))
        setForeground(new ImmutableLayer(foreground))
    }

    function saveToLocalStorage() {
        localStorage.setItem("map", JSON.stringify({
            background: background.raw(),
            foreground: foreground.raw(),
        }))
    }

    return {
        background,
        foreground,
        reactLoadFromLocalStorage,
        saveToLocalStorage,
        setBackground,
        setForeground,
    }
}
