let localServer = "localhost:8000";
let remoteServer = "52.45.229.11";
//export const usedServer = localServer;
export const usedServer = remoteServer;

export const optionsInfo = { 
    labelPosition: {
        name: "Label Position",
        inlineOptions: {
            'topLeft': { name: "Top left" },
            'topRight': { name: 'Top right' },
            'bottomLeft': {name: "Bottom left"},
            'bottomRight': {name: "Bottom right"}
        }
    }
}


export const tracksInfo = [
    {
        type: 'left-axis',
        datatype: ['axis'],
        local: true,
        orientation: '1d-vertical',
        name: 'Left Axis',
        thumbnail: 'vertical-axis-thumbnail.png'
    },
    {
        type: 'top-axis',
        datatype: ['axis'],
        local: true,
        orientation: '1d-horizontal',
        name: 'Top Axis',
        thumbnail: 'horizontal-axis-thumbnail.png',
        defaultOptions: {}
    },
    {
        type: 'heatmap',
        datatype: ['matrix'],
        local: false,
        orientation: '2d',
        thumbnail: 'heatmap-thumbnail.png',
        defaultOptions: {
            colorRange: ['#FFFFFF','#F8E71C', '#F5A623', '#D0021B' ],
            maxZoom: null
        }
    },
    {
        type: 'horizontal-line',
        datatype: ['vector'],
        local: false,
        orientation: '1d-horizontal',
        thumbnail: 'horizontal-line-thumbnail.png',
        defaultOptions: {

        }
    },
    {
        type: 'vertical-line',
        datatype: ['vector'],
        local: false,
        orientation: '1d-vertical',
        thumbnail: 'vertical-line-thumbnail.png'
    },
    {
        type: 'horizontal-1d-tiles',
        datatype: ['vector', 'stacked-interval', 'gene-annotation'],
        local: false,
        orientation: '1d-horizontal',
        name: 'Horizontal 1D Tile Outlines',
        thumbnail: 'horizontal-1d-tiles-thumbnail.png'

    },
    {
        type: 'vertical-1d-tiles',
        datatype: ['1d-tiles'],
        local: false,
        orientation: '1d-vertical',
        name: 'Vertical 1D Tile Outlines'
    },
    {
        type: '2d-tiles',
        datatype: ['matrix'],
        local: false,
        orientation: '2d',
        name: '2D Tile Outlines',
        thumbnail: '2d-tiles-thumbnail.png'
    },
    {
        type: 'top-stacked-interval',
        datatype: ['stacked-interval'],
        local: false,
        orientation: '1d-horizontal',
        thumbnail: 'horizontal-stacked-interval.png'
    },
    {
        type: 'left-stacked-interval',
        datatype: ['stacked-interval'],
        local: false,
        orientation: '1d-vertical',
        thumbnail: 'vertical-stacked-interval.png'
    },
    {
        type: 'viewport-projection-center',
        datatype: ['2d-projection'],
        local: true,
        hidden: true,
        orientation: '2d',
        name: 'Viewport Projection',
        thumbnail: 'viewport-projection-center.png'
    },

    {
        type: 'horizontal-gene-annotations',
        datatype: ['gene-annotation'],
        local: false,
        orientation: '1d-horizontal',
        name: 'Gene Annotations',
        thumbnail: null,
        availableOptions: [ 'labelPosition' ]
    },
    {
        type: 'vertical-gene-annotations',
        datatype: ['gene-annotation'],
        local: false,
        orientation: '1d-vertical',
        name: 'Gene Annotations',
        thumbnail: null,
        availableOptions: [ 'labelPosition' ]
    },
    {
        type: 'arrowhead-domains',
        datatype: ['arrowhead-domains'],
        local: false,
        orientation: '2d',
        name: 'Arrowhead Domains',
        thumbnail: null
    },

    {
        type: 'combined',
        datatype: 'any',
        local: true,
        orientation: 'any'
    }
]

export const TILE_FETCH_DEBOUNCE = 100;
// Number of milliseconds zoom-related actions (e.g., tile loading) are debounced
export const ZOOM_DEBOUNCE = 100;

let temp = {};

tracksInfo.forEach(t => {
    temp[t.type] = t;
})

export const tracksInfoByType = temp;

// the length of time to keep refreshing the view after
// a drag event
export const SHORT_DRAG_TIMEOUT = 110;
export const LONG_DRAG_TIMEOUT = 1000;
