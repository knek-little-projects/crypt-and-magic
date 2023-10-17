import React, { useEffect, useRef, useState } from 'react';
import { BACKGROUND, CHARACTERS, SPELLS, PATHFINDER } from './layer-types';
import * as cellFuncs from "./cell-funcs"
import Step from './step'
import useAssets from '../assets';

function key({ i, j }) {
    return i + " " + j
}

export default function useMapData() {

    const { getImageUrlById, getAssetById } = useAssets()
    const mapSize = 10
    const defaultBackgroundId = "grass"

    class Layers {
        constructor(data) {
            this._data = data || {}
            if (!this._data.background) {
                this._data.background = {}
            }
            if (!this._data.chars) {
                this._data.chars = {}
            }
            if (!this._data.steps) {
                this._data.steps = {}
            }
            if (!this._data.spells) {
                this._data.spells = {}
                this._data.spellMap = {}
            }
        }

        addSpell(spell) {
            this._data.spells[spell.id] = spell

            const k = key(spell.cell)
            const map = this._data.spellMap
            if (!map[k]) {
                map[k] = []
            }
            map[k].push(spell)
        }

        removeSpell(spell) {
            const k = key(spell.cell)
            const map = this._data.spellMap
            if (map[k]) {
                map[k] = map[k].filter(otherSpell => otherSpell.id !== spell.id)
            }
            if (map[k].length === 0) {
                delete map[k]
            }
            delete this._data.spells[spell.id]
        }

        getSpellsAt(cell) {
            const k = key(cell)
            const map = this._data.spellMap
            return map[k] || []            
        }

        getSpells() {
            return Object.values(this._data.spells)
        }

        clearSpells() {
            this.getSpells().forEach(spell => this.removeSpell(spell))
        }

        getBackgroundAt(cell) {
            return { asset: getAssetById(this._getBackgroundId(cell)) }
        }

        setBackgroundIdAt(cell, assetId) {
            this._data.background[key(cell)] = assetId
        }

        getStepAt(cell) {
            return this._data.steps[key(cell)]
        }

        setStepAt(cell, step) {
            this._data.steps[key(cell)] = step
        }

        removeStepAt(cell) {
            delete this._data.steps[key(cell)]
        }

        setSteps(cells, values) {
            const steps = {}
            for (let i = 0; i < cells.length; i++) {
                steps[key(cells[i])] = values[i]
            }
            this._data.steps = steps
        }

        getCharsAt(cell) {
            return this.getChars().filter(char => cellFuncs.eq(char.cell, cell))
        }

        getChars() {
            return Object.values(this._data.chars)
        }

        setChars(arr) {
            const obj = {}
            arr.forEach(c => obj[c.id] = c)
            this._data.chars = obj
        }

        findChar(id) {
            return this.getChars().find(char => char.asset.id === id)
        }

        addChar(char) {
            this._data.chars[char.id] = char
        }

        removeCharsAt(cell) {
            this.setChars(this.getChars().filter(char => !cellFuncs.eq(char.cell, cell)))
        }

        replaceChar(char) {
            this._data.chars[char.id] = char
        }

        removeChar({ id }) {
            delete this._data.chars[id]
        }

        _getBackgroundId(cell) {
            return this._data.background[key(cell)] || defaultBackgroundId
        }

        hasObstacle(cell) {
            if (cellFuncs.isOutsideOfMap(cell, mapSize)) {
                return true
            }

            const background = this.getBackgroundAt(cell)
            if (background.asset.isObstacle) {
                return true
            }

            const chars = this.getCharsAt(cell)
            if (chars.length > 0) {
                return true
            }

            return false
        }

        mutate() {
            return new Layers({ ...this._data })
        }

        raw() {
            return { ...this._data }
        }

        removeEverythingAt(cell) {
            this.setBackgroundIdAt(cell, defaultBackgroundId)
            this.removeCharsAt(cell)
        }
    }

    const [layers, setLayers] = useState(new Layers())

    function reactLoadFromLocalStorage() {
        const { layers } = JSON.parse(localStorage.getItem("map"))
        setLayers(new Layers(layers))
    }

    function saveToLocalStorage() {
        localStorage.setItem("map", JSON.stringify({
            layers: layers.raw(),
        }))
    }

    function* getItems(cell) {
        if (cellFuncs.isOutsideOfMap(cell, mapSize)) {
            yield { style: { background: "black" } }
            return
        }
        {
            const { asset } = layers.getBackgroundAt(cell)
            yield { image: asset.src }

            const children = (
                <div className='debug coordinates'>
                    {cell.i},{cell.j},{asset.id}
                </div>
            )
            yield { children }
        }
        {
            const chars = layers.getCharsAt(cell)
            if (chars.length > 0) {
                if (chars.length > 1) {
                    throw Error(`not implemented yet`)
                }
                const { asset } = chars[0]
                yield { image: asset.src }
            }
        }
        {
            const spells = layers.getSpellsAt(cell)
            for (const spell of spells) {
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
            const arrowDescription = layers.getStepAt(cell)
            if (arrowDescription) {
                yield { children: <Step description={arrowDescription} /> }
            }
        }
    }

    window.$layers = layers

    return {
        getItems,
        layers,
        commit: () => setLayers(layers.mutate()),
        reactLoadFromLocalStorage,
        reactLoadEmpty: () => setLayers(new Layers()),
        saveToLocalStorage,
    }
}
