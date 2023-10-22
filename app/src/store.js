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


function defined(x) {
    if (x === undefined) {
        throw Error(`Got undefined value`)
    }
    return x
}

function assert(x) {
    if (!x) {
        throw Error(`Assertion error`)
    }
}

export class Player {
    constructor({ id, cell, damage }) {
        this.id = defined(id)
        this.cell = defined(cell)
        this.damage = defined(damage)
    }
}

const players = createSlice({
    name: 'players',
    initialState: [],
    reducers: {
        addPlayer(state, { payload: player }) {
            assert(player instanceof Player)
            return [...state, player]
        },
        removePlayer(state, { payload: { id } }) {
            return state.filter(player => player.id != id)
        },
    }
})

export class Spell {
    constructor({ assetId, idFrom, idTo, ttl, startTime }) {
        this.assetId = defined(assetId)
        this.idFrom = defined(idFrom)
        this.idTo = defined(idTo)
        this.ttl = defined(ttl)
        this.startTime = defined(startTime)
    }
}

const spells = createSlice({
    name: 'spells',
    initialState: [],
    reducers: {
        addSpell(state, { payload: spell }) {
            assert(spell instanceof Spell)
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
        obstacles: obstacles.reducer,
    }
});

