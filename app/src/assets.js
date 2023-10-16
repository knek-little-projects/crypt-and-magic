import { BACKGROUND, CHARACTERS } from "./map/layer-types"

export default function useAssets() {
    const assets = [
        {
            name: "grass",
            id: "grass",
            src: "/map/grass.png",
            type: BACKGROUND,
            isObstacle: false,
        },
        {
            name: "water",
            id: "water",
            src: "/map/water.png",
            type: BACKGROUND,
            isObstacle: true,
        },
        {
            name: "wizard",
            id: "wizard",
            src: "/map/wizard.png",
            type: CHARACTERS,
            isObstacle: true,
        },
        {
            name: "arrow",
            id: "green-darr",
            src: "/map/green-darr.png",
            type: "arrow",
        },
        {
            name: "arrow",
            id: "brown-darr",
            src: "/map/brown-darr.png",
            type: "arrow",
        },
        {
            name: "arrow",
            id: "red-darr",
            src: "/map/red-darr.png",
            type: "arrow",
        },
        {
            name: "cross",
            id: "green-cross",
            src: "/map/green-cross.png",
            type: "arrow",
        },
        {
            name: "cross",
            id: "brown-cross",
            src: "/map/brown-cross.png",
            type: "arrow",
        },
        {
            name: "cross",
            id: "red-cross",
            src: "/map/red-cross.png",
            type: "arrow",
        },
        {
            name: "fireball",
            id: "fireball",
            src: "/map/fireball.png",
            type: "magic",
        },
        {
            name: "Skeleton Mage",
            id: "skel-mage",
            src: "/map/skel-mage.png",
            type: CHARACTERS,
            set: "skeletons",
            isObstacle: true,
        },
        {
            name: "Erasor",
            id: "erasor",
            src: "/map/erasor.png",
            type: "editor",
        },
        {
            name: "Skeleton Sword",
            id: "skel-sword",
            src: "/map/skel-sword.png",
            type: "magic",
        },
    ]
    function findAssetById(id) {
        return assets.find(o => o.id === id)
    }
    function getAssetById(id) {
        const asset = findAssetById(id)
        if (!asset) {
            throw Error(`Asset id '${id}' not found`)
        }
        return asset
    }
    function getImageUrlById(id) {
        const asset = findAssetById(id)
        if (!asset) {
            throw Error(`Cannot find asset with id '${id}'`)
        }
        return asset.src
    }
    return {
        assets,
        getImageUrlById,
        getAssetById,
        findAssetById,
    }
}
