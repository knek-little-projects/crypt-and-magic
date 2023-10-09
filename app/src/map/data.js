import React, { useEffect, useRef, useState } from 'react';

Number.prototype.mod = function (n) {
    "use strict";
    return ((this % n) + n) % n;
}


function useMatrix({ defaultValue, transform }) {
    const [data, setData] = useState({})

    function key(cell) {
        const { i, j } = transform(cell)
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

export default function useMapData() {
    const mapWrap = 10
    const transform = ({ i, j }) => ({ i: i.mod(mapWrap), j: j.mod(mapWrap) })

    const background = useMatrix({ defaultValue: "grass", transform })

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
        mapWrap,
        loadFromLocalStorage,
        saveToLocalStorage,
        background,
        setData,
        toData,
    }
}
