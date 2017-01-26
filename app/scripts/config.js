import {HeatmapOptions} from './HeatmapOptions.jsx';
import {svgHorizontalLineIcon} from './icons.js';
import {svgVerticalLineIcon} from './icons.js';
import {svg2DTilesIcon} from './icons.js';
import {svg2DHeatmapIcon} from './icons.js';
import {svg1DAxisIcon} from './icons.js';
import {svgVertical1DAxisIcon} from './icons.js';
import {svgGeneAnnotationsIcon} from './icons.js';
import {svgVerticalGeneAnnotationsIcon} from './icons.js';
import {svg1DTilesIcon} from './icons.js';
import {svgVertical1DTilesIcon} from './icons.js';
import {svgArrowheadDomainsIcon} from './icons.js';

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
            'bottomRight': {name: "Bottom right"},
            'hidden': {name: "Hidden"}
        }
    },
    colorRange: {
        name: "Color Range",
        componentPickers: {
            'heatmap': HeatmapOptions
        }
    }
}

//
console.log('svgHorizontalLineIcon:', svgHorizontalLineIcon);


export const tracksInfo = [
    {
        type: 'left-axis',
        datatype: ['axis'],
        local: true,
        orientation: '1d-vertical',
        name: 'Left Axis',
        thumbnail: svgVertical1DAxisIcon
    },
    {
        type: 'top-axis',
        datatype: ['axis'],
        local: true,
        orientation: '1d-horizontal',
        name: 'Top Axis',
        thumbnail: svg1DAxisIcon,
        defaultOptions: {}
    },
    {
        type: 'heatmap',
        datatype: ['matrix'],
        local: false,
        orientation: '2d',
        thumbnail: svg2DHeatmapIcon,
        defaultOptions: {
            colorRange: ['#FFFFFF','#F8E71C', '#F5A623', '#D0021B' ],
            maxZoom: null
        },
        availableOptions: [ 'labelPosition', 'colorRange' ]
    },
    {
        type: 'horizontal-line',
        datatype: ['vector'],
        local: false,
        orientation: '1d-horizontal',
        thumbnail: svgHorizontalLineIcon,
        defaultOptions: {

        }
    },
    {
        type: 'vertical-line',
        datatype: ['vector'],
        local: false,
        orientation: '1d-vertical',
        thumbnail: svgVerticalLineIcon
    },
    {
        type: 'horizontal-1d-tiles',
        datatype: ['vector', 'stacked-interval', 'gene-annotation'],
        local: false,
        orientation: '1d-horizontal',
        name: 'Horizontal 1D Tile Outlines',
        thumbnail: svg1DTilesIcon

    },
    {
        type: 'vertical-1d-tiles',
        datatype: ['1d-tiles'],
        local: false,
        orientation: '1d-vertical',
        name: 'Vertical 1D Tile Outlines',
        thumbnail: svgVertical1DTilesIcon
    },
    {
        type: '2d-tiles',
        datatype: ['matrix'],
        local: false,
        orientation: '2d',
        name: '2D Tile Outlines',
        thumbnail: svg2DTilesIcon
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
        thumbnail: svgGeneAnnotationsIcon,
        availableOptions: [ 'labelPosition' ]
    },
    {
        type: 'vertical-gene-annotations',
        datatype: ['gene-annotation'],
        local: false,
        orientation: '1d-vertical',
        name: 'Gene Annotations',
        thumbnail: svgVerticalGeneAnnotationsIcon,
        availableOptions: [ 'labelPosition' ]
    },
    {
        type: 'arrowhead-domains',
        datatype: ['arrowhead-domains'],
        local: false,
        orientation: '2d',
        name: 'Arrowhead Domains',
        thumbnail: svgArrowheadDomainsIcon
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
