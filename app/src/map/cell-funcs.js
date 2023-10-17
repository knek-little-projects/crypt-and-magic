export function eq(a, b) {
    return a.i === b.i && a.j === b.j
}

export function isOutsideOfMap({ i, j }, mapSize) {
    return i < 0 || j < 0 || i >= mapSize || j >= mapSize
}

export function cellRight({ i, j }) {
    return {
        i: i + 1,
        j,
    }
}

export function cellLeft({ i, j }) {
    return {
        i: i - 1,
        j
    }
}