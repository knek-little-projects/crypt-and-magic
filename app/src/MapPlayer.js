import { BACKGROUND, CHARACTERS, PATHFINDER } from "./map/layer-types"
import { useEffect, useRef } from "react"
import useMapData from "./map/data"
import Map from "./Map"

function eq(a, b) {
    return a.i === b.i && a.j === b.j
}

class FindPathError extends Error { }

function findPath(isObstacle, a, b) {
    function heuristic(p1, p2) {
        return Math.abs(p1.i - p2.i) + Math.abs(p1.j - p2.j);
    }

    function getNeighbors(p) {
        return [
            { i: p.i + 1, j: p.j },
            { i: p.i - 1, j: p.j },
            { i: p.i, j: p.j + 1 },
            { i: p.i, j: p.j - 1 }
        ].filter(neighbor => !isObstacle(neighbor));
    }

    const openList = [];
    const closedList = [];
    const startNode = {
        point: a,
        f: 0,
        g: 0,
        h: heuristic(a, b)
    };

    openList.push(startNode);

    let maxIters = 1000
    while (openList.length > 0) {
        // console.log("iter", maxIters)
        if (maxIters-- < 0) {
            return []
            // throw new FindPathError(`Iter exceeded`)
        }
        openList.sort((nodeA, nodeB) => nodeA.f - nodeB.f);
        const currentNode = openList.shift();
        closedList.push(currentNode);

        if (currentNode.point.i === b.i && currentNode.point.j === b.j) {
            let path = [];
            let current = currentNode;
            while (current) {
                path.push(current.point);
                current = current.parent;
            }
            return path.reverse();
        }

        const children = getNeighbors(currentNode.point).map(neighbor => ({
            point: neighbor,
            f: 0,
            g: 0,
            h: heuristic(neighbor, b),
            parent: currentNode
        }));

        for (let child of children) {
            if (closedList.some(closedChild => closedChild.point.i === child.point.i && closedChild.point.j === child.point.j)) {
                continue;
            }

            child.g = currentNode.g + 1;
            child.f = child.g + child.h;

            if (openList.some(openNode => openNode.point.i === child.point.i && openNode.point.j === child.point.j && child.g > openNode.g)) {
                continue;
            }

            openList.push(child);
        }
    }

    return [];
}

export default function MapPlayer() {
    const data = useMapData()
    const player = {
        cell: data.layers.find(CHARACTERS, id => id !== null)
    }

    useEffect(() => {
        try {
            data.reactLoadFromLocalStorage()
        } catch (e) {

        }
    }, [])

    const isObstacle = (cell) => {
        const background = data.getItem(BACKGROUND, cell) || "grass"
        return background !== "grass"
    }

    function getArrowDirection(a, b) {
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

    const onClick = cell => {
        if (eq(cell, player.cell)) {
            return
        }

        const cells = findPath(isObstacle, player.cell, cell)
        if (!cells || cells.length == 0) {
            return
        }

        const ids = []
        cells.shift()

        const colorType = "g"
        for (let i = 0; i < cells.length - 1; i++) {
            const id = colorType + getArrowDirection(cells[i], cells[i + 1])
            ids.push(id)
        }
        
        ids.push(colorType + "c")
        data.setLayers(data.layers.reset(PATHFINDER, cells, ids))
    }

    return (
        <>
            <Map getItem={data.getItem} onClick={onClick} />
        </>
    )
}