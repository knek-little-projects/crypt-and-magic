import React, { useEffect, useRef, useState } from 'react';

export default function useGridHover(grid, ref) {
    const [hoverAbsCell, setHoverAbsCell] = useState(null)

    function onGridHover(e) {
        const newCell = grid.getAbsCellByEvent(e, ref.current)

        if (hoverAbsCell === null || newCell.i !== hoverAbsCell.i || newCell.j !== hoverAbsCell.j) {
            setHoverAbsCell(newCell)
        }
    }

    function onGridLeave(e) {
        setHoverAbsCell(null)
    }

    return {
        hoverAbsCell,
        onGridHover,
        onGridLeave,
    }
}