import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { decrement, increment, store } from './store';

export default function TestComponent() {
    const count = useSelector(state => state.counter);
    const dispatch = useDispatch();
    return (
        <div>
            <button onClick={() => dispatch(decrement())}>-</button>
            <span>{JSON.stringify(count)}</span>
            <button onClick={() => dispatch(increment('hi'))}>+</button>
        </div>
    )
}
