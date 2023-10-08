function useDragOffset({
    mouseButton = 1,
    onOffsetChange = () => { },
}) {
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
    const [prevOffset, setPrevOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);

    const onMouseDown = (e) => {
        if (e.button === mouseButton) {
            setLastPos({ x: e.clientX, y: e.clientY });
            setPrevOffset(offset)
            setDragging(true);
        }
    }

    const onMouseMove = (e) => {
        if (dragging) {
            const dx = e.clientX - lastPos.x;
            const dy = e.clientY - lastPos.y;
            setOffset({ x: prevOffset.x + dx, y: prevOffset.y + dy });
            onOffsetChange(e)
        }
    }

    const onMouseUp = () => {
        setDragging(false);
    }

    return {
        offset,
        onOffsetChange,
        dragHandlers: {
            onMouseDown,
            onMouseMove,
            onMouseUp,
        }
    }
}
