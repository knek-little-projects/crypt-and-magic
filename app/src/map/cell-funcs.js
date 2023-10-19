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

export function getArrowDirection(a, b) {
    if (a.i < b.i && a.j === b.j) {
        return "r"
    } else if (a.i > b.i && a.j === b.j) {
        return "l"
    } else if (a.j < b.j && a.i === b.i) {
        return "b"
    } else if (a.j > b.j && a.i === b.i) {
        return "t"
    } else {
        throw Error(`Arrow direction undefined since the points are identical: ${JSON.stringify([a, b])}`)
    }
}