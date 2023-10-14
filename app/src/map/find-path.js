export default function findPath(isObstacle, a, b) {
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