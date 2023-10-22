import { createSlice } from '@reduxjs/toolkit';
import { configureStore } from '@reduxjs/toolkit';
import { convertBytesToMatrix } from './wallet';
import { eq } from './map/cell-funcs';

export const MAP_SIZE = 16

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


const steps = createSlice({
    name: 'steps',
    initialState: {},
    reducers: {
        clearSteps() {
            return {}
        },
        setSteps(_, { payload: { cells, ids } }) {
            const result = {}
            for (let i = 0; i < cells.length; i++) {
                result[cells[i].i + " " + cells[i].j] = ids[i]
            }
            return result
        },
    }
})

export const { setSteps, clearSteps } = steps.actions;

const players = createSlice({
    name: 'players',
    initialState: [],
    reducers: {
        addPlayer(state, { payload: player }) {
            return [...state.filter(p => p.id != player.id), player]
        },
        removePlayer(state, { payload: { id } }) {
            return state.filter(player => player.id != id)
        },
        movePlayer(state, { payload: { id, cell } }) {
            const player = state.find(player => player.id == id)
            if (player) {
                player.cell = cell
            }
        },
        removePlayerAt(state, { payload: cell }) {
            return state.filter(s => !eq(s.cell, cell))
        }
    }
})

export const { removePlayerAt, addPlayer, removePlayer, movePlayer } = players.actions

const skeletons = createSlice({
    name: 'skeletons',
    initialState: [],
    reducers: {
        addSkeleton(state, { payload: skeleton }) {
            return [...state.filter(s => s.id != skeleton.id), skeleton]
        },
        removeSkeleton(state, { payload: { id } }) {
            return state.filter(skeleton => skeleton.id != id)
        },
        setSkeletonForRemoval(state, { payload: { id } }) {
            const skel = state.find(skel => skel.id == id)
            if (skel) {
                skel.removeAfter = new Date().getTime() + 1000
            }
        },
        clearExpiredSkeletons(state) {
            const t = new Date().getTime()
            return state.filter(skeleton => !skeleton.removeAfter || skeleton.removeAfter < t)
        },
        moveSkeleton(state, { payload: { id, cell } }) {
            const skel = state.find(skel => skel.id == id)
            if (skel) {
                skel.cell = cell
            }
        },
        removeSkeletonAt(state, { payload: cell }) {
            return state.filter(s => !eq(s.cell, cell))
        }
    }
})

export const { setSkeletonForRemoval, clearExpiredSkeletons, removeSkeletonAt, addSkeleton, removeSkeleton, moveSkeleton } = skeletons.actions;

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
        steps: steps.reducer,
    }
});

