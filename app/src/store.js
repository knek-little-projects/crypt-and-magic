import { createSlice } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { convertBytesToMatrix } from './wallet';

const counter = createSlice({
    name: 'counter',
    initialState: [],
    reducers: {
        increment(state) {
            return [...state, { random: Math.random() }]
        },
        decrement(state) {
            return state.filter(item => item.random > 0.5)
        }
    }
})

export const { increment, decrement } = counter.actions;

function assert(x) {
    if (!x) {
        throw Error(`Assertion error`)
    }
}

const players = createSlice({
    name: 'players',
    initialState: [],
    reducers: {
        addPlayer(state, { payload: player }) {
            return [...state, player]
        },
        removePlayer(state, { payload: { id } }) {
            return state.filter(player => player.id != id)
        },
    }
})

export const { addPlayer, removePlayer } = players.actions

const skeletons = createSlice({
    name: 'skeletons',
    initialState: [],
    reducers: {
        addSkeleton(state, { payload: skeleton }) {
            return [...state, skeleton]
        },
        removeSkeleton(state, { payload: { id } }) {
            return state.filter(skeleton => skeleton.id != id)
        },
    }
})

export const { addSkeleton, removeSkeleton } = skeletons.actions;

const spells = createSlice({
    name: 'spells',
    initialState: [],
    reducers: {
        addSpell(state, { payload: spell }) {
            return [...state, spell]
        },
        clearExpiredSpells(state) {
            const t = new Date().getTime()
            return state.filter(spell => t < spell.startTime + spell.ttl)
        },
    }
})

export const { addSpell, clearExpiredSpells } = spells.actions;

const obstacles = createSlice({
    name: 'obstacles',
    initialState: {},
    reducers: {
        setObstaclesFromBytes(_, { payload: { obstacles, N } }) {
            const result = {}

            const f = convertBytesToMatrix(N, obstacles)
            for (let i = 0; i < N; i++) {
                for (let j = 0; j < N; j++) {
                    if (f({ i, j })) {
                        result[i + " " + j] = true
                    }
                }
            }

            return result

        },
        setObstacle(state, { payload: { i, j } }) {
            return {
                ...state,
                [i + " " + j]: true
            }
        },
        unsetObstacle(state, { payload: { i, j } }) {
            return {
                ...state,
                [i + " " + j]: false
            }
        },
    }
})

export const { setObstacle, unsetObstacle, setObstaclesFromBytes } = obstacles.actions;

export const store = configureStore({
    reducer: {
        counter: counter.reducer,
        spells: spells.reducer,
        players: players.reducer,
        skeletons: skeletons.reducer,
        obstacles: obstacles.reducer,
    }
});

