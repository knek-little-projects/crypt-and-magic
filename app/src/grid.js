Number.prototype.mod = function (n) {
    "use strict";
    return ((this % n) + n) % n;
}

export default function useGrid({ offset, cellSize }) {
    return {
        mod({ i, j }, k) {
            return {
                i: i.mod(k),
                j: j.mod(k),
            }
        },
        getScreenCellByScreenPoint({ x, y }) {
            return {
                i: Math.floor(x / cellSize),
                j: Math.floor(y / cellSize),
            }
        },
        getAbsCellByScreenCell({ i, j }) {
            return {
                i: i - Math.floor(offset.x / cellSize),
                j: j - Math.floor(offset.y / cellSize),
            }
        },
        getOffsetedScreenCellPointByScreenCell({ i, j }) {
            return {
                x: (i * cellSize) + offset.x.mod(cellSize),
                y: (j * cellSize) + offset.y.mod(cellSize),
            }
        },
        getAbsPointByAbsCell({ i, j }) {
            return {
                x: i * cellSize,
                y: j * cellSize,
            }
        },
        getOffsetedScreenCellPointByAbsCell({ i, j }) {
            const { x, y } = this.getAbsPointByAbsCell({ i, j })
            return {
                x: x + offset.x,
                y: y + offset.y,
            }
        },
        getAbsPointByScreenPoint({ x, y }) {
            return {
                x: x - offset.x,
                y: y - offset.y,
            }
        },
        getAbsCellByAbsPoint({ x, y }) {
            return {
                i: Math.floor(x / cellSize),
                j: Math.floor(y / cellSize),
            }
        },
        getAbsCellByScreenPoint({ x, y }) {
            return this.getAbsCellByAbsPoint(this.getAbsPointByScreenPoint({ x, y }))
        },
        getUnoffsetedScreenPointByScreenCell({ i, j }) {
            return {
                x: i * cellSize,
                y: j * cellSize,
            }
        },
        getScreenPointByEvent(e, element) {
            const rect = element.getBoundingClientRect()
            return {
                x: e.clientX - rect.x,
                y: e.clientY - rect.y,
            }
        },
        getAbsCellByEvent(e, el) {
            return this.getAbsCellByScreenPoint(this.getScreenPointByEvent(e, el))
        },
    }
}