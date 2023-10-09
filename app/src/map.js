import React, { useEffect, useRef, useState } from 'react';
import useGrid from "./grid"
import useGridHover from "./gridhover"
import useDragOffset from "./dragoffset"
import useAssets from './assets'


function useMatrix({ defaultValue }) {
    const [data, setData] = useState({})

    function key({ i, j }) {
        return i + " " + j
    }

    function getItem(cell) {
        return data[key(cell)] || defaultValue
    }

    function setItems(cells, value) {
        const update = {}
        for (const c of cells) {
            update[key(c)] = value
        }
        setData({
            ...data,
            ...update,
        })
    }

    return {
        getItem,
        setItems,
        setData,
        data,
    }
}


export default function useMap() {
    const background = useMatrix({ defaultValue: "grass" })

    function setData(data) {
        background.setData(data.background)
    }

    function toData() {
        return {
            background: background.data
        }
    }

    function loadFromLocalStorage() {
        setData(JSON.parse(localStorage.getItem("map")))
    }

    function saveToLocalStorage() {
        localStorage.setItem("map", JSON.stringify(toData()))
    }
    
    return {
        loadFromLocalStorage,
        saveToLocalStorage,
        background,
        setData,
        toData,
    }
}
