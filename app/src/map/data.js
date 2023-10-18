import React, { useEffect, useRef, useState } from 'react';
import * as cellFuncs from "./cell-funcs"
import useAssets from '../assets';
import render from "./render"

function key({ i, j }) {
    return i + " " + j
}

export default function useMapData() {

    const { getAssetById } = useAssets()
    const mapSize = 16
    const defaultBackgroundId = "grass"

    class Map {
        constructor(data) {
            this._reset(data)
        }

        _reset(data) {
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

        getSize() {
            return mapSize
        }

        addSpell(spell) {
            this._data.spells[spell.id] = spell
        }

        getCharsAtSpell(spell) {
            const cell = this.findSpellCell(spell)
            if (cell) {
                return this.getCharsAt(cell)
            } else {
                return []
            }
        }

        findSpellCell({ cell, targetId }) {
            if (cell) {
                return cell
            }
            if (targetId) {
                const char = this.findChar(targetId)
                if (char) {
                    return char.cell
                }
            }
        }

        removeSpell(spell) {
            delete this._data.spells[spell.id]
        }

        getSpellsAt(cell) {
            return this.getSpells().filter(spell => {
                const spellCell = this.findSpellCell(spell)
                return spellCell && cellFuncs.eq(cell, spellCell)
            })
        }

        getSpells() {
            return Object.values(this._data.spells)
        }

        clearSpells() {
            this._data.spells = {}
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
            return this.getChars().find(char => char.id === id)
        }

        getChar(id) {
            const char = this.findChar(id)
            if (!char) {
                throw Error(`char id '${id}' not found`)
            }
            return char
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

        clear() {
            this._reset()
        }

        mutate() {
            return new Map({ ...this._data })
        }

        raw() {
            return { ...this._data }
        }

        removeEverythingAt(cell) {
            this.setBackgroundIdAt(cell, defaultBackgroundId)
            this.removeCharsAt(cell)
        }
    }

    const [map, setMap] = useState(new Map())

    function reactLoadFromLocalStorage() {
        const { map } = JSON.parse(localStorage.getItem("map"))
        setMap(new Map(map))
    }

    function saveToLocalStorage() {
        localStorage.setItem("map", JSON.stringify({
            map: map.raw()
        }))
    }

    window.$map = map

    return {
        map,
        mapSize,
        getItems: cell => render(map, cell),
        commit: () => setMap(map.mutate()),
        reactLoadFromLocalStorage,
        reactLoadEmpty: () => setMap(new Map()),
        saveToLocalStorage,
    }
}
