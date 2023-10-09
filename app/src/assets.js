
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
    function getImageUrlById(id) {
        return assets.find(o => o.id === id).src
    }
    return {
        assets,
        getImageUrlById,
    }
}
