
export default function useAssets() {
    const assets = [
        {
            name: "grass",
            id: "grass",
            src: "/map/grass.png",
            type: "background",
        },
        {
            name: "water",
            id: "water",
            src: "/map/water.png",
            type: "background",
        },
        {
            name: "wizard",
            id: "wizard",
            src: "/map/wizard.png",
            type: "char",
        }
    ]
    function findAssetById(id) {
        return assets.find(o => o.id === id)
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
        findAssetById,
    }
}
