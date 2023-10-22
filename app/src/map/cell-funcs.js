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

export function positionToCell(p, N) {
    return {
        i: Math.floor(p / N),
        j: Math.floor(p % N),
    }
}

export function cellToPosition({ i, j }, N) {
    return i * N + j
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

export const STEP_RIGHT = 0; // 0b00
export const STEP_DOWN = 1; // 0b01
export const STEP_LEFT = 2; // 0b10
export const STEP_UP = 3; // 0b11
export function getMoveDirectionForContract(a, b) {
    if (a.i < b.i && a.j === b.j) {
        return STEP_RIGHT
    } else if (a.i > b.i && a.j === b.j) {
        return STEP_LEFT
    } else if (a.j < b.j && a.i === b.i) {
        return STEP_DOWN
    } else if (a.j > b.j && a.i === b.i) {
        return STEP_UP
    } else {
        throw Error(`Arrow direction undefined since the points are identical: ${JSON.stringify([a, b])}`)
    }
}


export function addStepToCell(step, { i, j }) {
    if (step == STEP_RIGHT) {
        return {
            i: i + 1,
            j
        }
    } else if (step == STEP_LEFT) {
        return {
            i: i - 1,
            j
        }
    } else if (step == STEP_UP) {
        return {
            i,
            j: j - 1
        }
    } else if (step == STEP_DOWN) {
        return {
            i,
            j: j + 1,
        }
    }
}