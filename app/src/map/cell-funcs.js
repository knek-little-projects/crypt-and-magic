export function eq(a, b) {
    return a.i === b.i && a.j === b.j
}

export function isOutsideOfMap({ i, j }, mapSize) {
    return i < 0 || j < 0 || i >= mapSize || j >= mapSize
}