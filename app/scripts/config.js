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

import {format, formatPrefix, precisionRound, precisionPrefix} from 'd3-format';

let localServer = "localhost:8000";
let remoteServer = "52.45.229.11";
//export const usedServer = localServer;
export const usedServer = remoteServer;

let availableColors = {
    'black': { name: "Black", value: "black"},
    'blue': { name: "Blue", value: "blue"},
    'brown': { name: "Brown", value: "brown"},
    'cyan': { name: "Cyan", value: "cyan"},
    'green': { name: "Green", value: "green"},
    'grey': { name: "Grey", value: "grey"},
    'orange': { name: "Orange", value: "orange"},
    'purple': { name: "Purple", value: "purple"},
    'turquoise': { name: "Turquoise", value: "turquoise"},
    'red': { name: "Red", value: "red"}
}

export const optionsInfo = {
    valueScaling: {
        name: "Value Scaling",
        inlineOptions: {
            'linear': { name: "Linear", value: 'linear' },
            'log': {name: "Log", value: 'log' }
        }
    },
    lineStrokeWidth: {
        name: "Stroke Width",
        inlineOptions: {
            '1': { name: "1", value: 1},
            '2': { name: "2", value: 2},
            '3': { name: "3", value: 3},
            '5': { name: "5", value: 5},
            '8': { name: "8", value: 8}
        }
    },
    minusStrandColor:  {
        name: "- Strand Color",
        inlineOptions: availableColors
    },
    plusStrandColor:  {
        name: "+ Strand Color",
        inlineOptions: availableColors
    },
    lineStrokeColor:  {
        name: "Stroke color",
        inlineOptions: availableColors
    },
    projectionStrokeColor:  {
        name: "Stroke color",
        inlineOptions: availableColors
    },
    projectionFillColor:  {
        name: "Fill color",
        inlineOptions: availableColors
    },
    oneDHeatmapFlipped: {
        name: 'Flip Heatmap',
        inlineOptions: {
            'yes': { name: 'Yes', value: 'yes' },
            'no': { name: 'No', value: null }
        }
    },
    axisPositionHorizontal: {
        name: "Axis Position",
        inlineOptions: {
            'left': { name: 'Left', value: 'left' },
            'outsideLeft': { name: 'Outside left', value: 'outsideLeft' },
            'right': { name: 'Right', value: 'right' },
            'outsideRight': { name: 'Outside right', value: 'outsideRight' },
            'hidden': { name: 'Hidden', value: null }
        }
    },

    axisPositionVertical: {
        name: "Axis Position",
        inlineOptions: {
            'top': { name: 'Top', value: 'top' },
            'outsideTop': { name: 'Outside top', value: 'outsideTop' },
            'bottom': { name: 'Bottom', value: 'bottom' },
            'outsideBottom': { name: 'Outside bottom', value: 'outsideBottom' },
            'hidden': { name: 'Hidden', value: null }
        }
    },

    colorbarPosition: {
        name: "Colorbar Position",
        inlineOptions: {
            'topLeft': { name: 'Top Left', value: 'topLeft' },
            'topRight': { name: 'Top Right', value: 'topRight' },
            'bottomLeft': { name: 'Bottom Left', value: 'bottomLeft' },
            'bottomRight': { name: 'Bottom Right', value: 'bottomRight' },
            'hidden': { name: 'Hidden', value: null }
        }
    },

    /*
    colorbarOrientation: {
        name: "Colorbar Orientation",
        inlineOptions: {
            'horizontal': { name: 'Horizontal', value: 'horizontal' },
            'vertical': { name: 'Vertical', value: 'vertical' },
        }
    },
    */

    // This will default to "inside" if it's not set when colorbarPosition
    // is set
    colorbarLabelsPosition: {
        name: "Colorbar Labels Position",
        inlineOptions: {
            'inside': { name: 'Inside', value: 'inside'},
            'outside': { name: 'Outside', value: 'outside'}
        }
    },

    labelColor: {
        name: "Label Color",
        inlineOptions: availableColors
    },
    labelPosition: {
        name: "Label Position",
        inlineOptions: {
            'ol': { name: "Outer left", value: "outerLeft"},
            'or': { name: "Outer right", value: 'outerRight' },
            'ot': { name: "Outer top", value: "outerTop" },
            'ob': { name: "Outer bottom", value: "outerBottom" },
            'tl': { name: "Top left", value: 'topLeft' },
            'tr': { name: 'Top right', value: 'topRight' },
            'bl': {name: "Bottom left", value: 'bottomLeft' },
            'br': {name: "Bottom right", value: 'bottomRight' },
            'hidden': {name: "Hidden", value: 'hidden'}
        }
    },
    labelTextOpacity: {
        name: "Label Text Opacity",
        inlineOptions: {
            '0': { name: "0%", value: 0 },
            '0.2': { name: "20%", value: 0.2 },
            '0.4': { name: "40%", value: 0.4 },
            '0.6': { name: "60%", value: 0.6 },
            '0.8': { name: "80%", value: 0.8 },
            '1.0': { name: '100%', value: 1.0 },
        }
    },
    labelBackgroundOpacity: {
        name: "Label Background Opacity",
        inlineOptions: {
            '0': { name: "0%", value: 0 },
            '0.2': { name: "20%", value: 0.2 },
            '0.4': { name: "40%", value: 0.4 },
            '0.6': { name: "60%", value: 0.6 },
            '0.8': { name: "80%", value: 0.8 },
            '1.0': { name: '100%', value: 1.0 },
        }
    },

    // colormaps are mostly taken from here:
    // http://matplotlib.org/api/pyplot_summary.html?highlight=colormaps#matplotlib.pyplot.colormaps
    colorRange: {
        name: "Color map",
        inlineOptions: {
            'afmhot': { name: 'afmhot', value: ['rgba(0, 0, 0, 1.0)', 'rgba(128, 0, 0, 1.0)', 'rgba(256, 129, 1, 1.0)', 'rgba(256, 256, 129, 1.0)', 'rgba(256, 256, 256, 1.0)'] },
            'fall': { name: 'fall', value: ['white', 'rgba(245,166,35,1.0)', 'rgba(208,2,27,1.0)', 'black'] },
            'hot': { name: "hot", value: ['rgba(10, 0, 0, 1.0)', 'rgba(179, 0, 0, 1.0)', 'rgba(256, 91, 0, 1.0)', 'rgba(256, 256, 6, 1.0)', 'rgba(256, 256, 256, 1.0)'] },
            'jet': { name: "jet", value: ['rgba(0, 0, 128, 1.0)', 'rgba(0, 129, 256, 1.0)', 'rgba(125, 256, 122, 1.0)', 'rgba(256, 148, 0, 1.0)', 'rgba(128, 0, 0, 1.0)'] },

            'bwr': { name: 'bwr', value: ['rgba(0, 0, 256, 1.0)', 'rgba(128, 128, 256, 1.0)', 'rgba(256, 254, 254, 1.0)', 'rgba(256, 126, 126, 1.0)', 'rgba(256, 0, 0, 1.0)'] },
            'cubehelix': { name: 'cubehelix', value: ['rgba(0, 0, 0, 1.0)', 'rgba(21, 83, 76, 1.0)', 'rgba(162, 121, 74, 1.0)', 'rgba(199, 180, 238, 1.0)', 'rgba(256, 256, 256, 1.0)'] },
            'rainbow': { name: 'rainbow', value: ['rgba(128, 0, 256, 1.0)', 'rgba(0, 181, 236, 1.0)', 'rgba(129, 255, 180, 1.0)', 'rgba(256, 179, 96, 1.0)', 'rgba(256, 0, 0, 1.0)'] },

            'gray': { name: "greys", value: ['rgba(255,255,255,1)', 'rgba(0,0,0,1)'] },
            'red': { name: "White to red", value: ['rgba(255,255,255,1)', 'rgba(255,0,0,1)'] },
            'green': { name: "White to green", value: ['rgba(255,255,255,1)', 'rgba(0,255,0,1)'] },
            'blue': { name: "White to blue", value: ['rgba(255,255,255,1)', 'rgba(0,0,255,1)'] },
            'custard': { name: 'custard', value: [
                                          "#FFFFFF",
                                          "#F8E71C",
                                          "rgba(245,166,35,1)",
                                          "rgba(0,0,0,1)"
                                       ]},
            'custom': {
                name: "Custom...",
                componentPickers: {
                    'heatmap': HeatmapOptions
                }
            }
        }
    },

    maxZoom: {
        name: "Zoom limit",
        inlineOptions: {
            'none': { name: "None", value: null },
        },
        generateOptions: track => {
            if (track.maxZoom) {
                let formatter = format('.0s');
                let inlineOptions = [];

                for (let i = 0; i <= track.maxZoom; i++) {
                    let maxWidth = track.maxWidth;
                    let binsPerDimension = track.binsPerDimension;
                    let maxZoom = track.maxZoom;

                    let resolution = track.maxWidth / (2 ** i * track.binsPerDimension)

                    let maxResolutionSize = maxWidth / (2 ** maxZoom * binsPerDimension);
                    let minResolution = maxWidth / binsPerDimension;

                    let pp = precisionPrefix(maxResolutionSize, resolution);
                    let f = formatPrefix('.' + pp, resolution);
                    let formattedResolution = f(resolution);

                    //let formattedName =  ;
                    inlineOptions.push({
                        'name': formattedResolution,
                        value: i.toString()
                    });

                    //
                }

                return inlineOptions;
            } else
                return [];
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
        thumbnail: svgVertical1DAxisIcon,
        minWidth: 100
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
        minHeight: 100,
        minWidth: 100,
        orientation: '2d',
        thumbnail: svg2DHeatmapIcon,
        defaultOptions: {
            labelPosition: 'bottomRight',
            colorRange: ['white', 'rgba(245,166,35,1.0)', 'rgba(208,2,27,1.0)', 'black'], //corresponding to the fall colormap
            maxZoom: null,
            colorbarLabelsPosition: 'inside',
            colorbarPosition: 'topRight'
        },
        availableOptions: [ 'labelPosition', 'labelColor', 'labelTextOpacity', 'labelBackgroundOpacity', 'colorRange', 'maxZoom', 
        'colorbarPosition', 'colorbarLabelsPosition']//, 'colorbarOrientation']
        //exportable: true
    },
    {
        type: 'horizontal-heatmap',
        datatype: ['matrix'],
        local: false,
        minHeight: 40,
        minWidth: 100,
        orientation: '1d-horizontal',
        thumbnail: svg2DHeatmapIcon,
        defaultOptions: {
            labelPosition: 'bottomRight',
            labelColor: 'black',
            colorRange:
                ['white', 'rgba(245,166,35,1.0)', 'rgba(208,2,27,1.0)', 'black'], //corresponding to the fall colormap
            maxZoom: null
        },
        availableOptions: [ 'labelPosition', 'labelColor', 'labelTextOpacity', 'labelBackgroundOpacity', 'colorRange', 'maxZoom', 'oneDHeatmapFlipped',
                            'colorbarPosition', 'colorbarLabelsPosition']
    },
    {
        type: 'vertical-heatmap',
        datatype: ['matrix'],
        local: false,
        minWidth: 50,
        minHeight: 100,
        orientation: '1d-vertical',
        thumbnail: svg2DHeatmapIcon,
        defaultOptions: {
            labelPosition: 'bottomRight',
            labelColor: 'black',
            colorRange: ['white', 'rgba(245,166,35,1.0)', 'rgba(208,2,27,1.0)', 'black'], //corresponding to the fall colormap
            maxZoom: null,
            colorbarLabelsPosition: 'inside',
            colorbarPosition: 'topRight'
        },
        availableOptions: [ 'labelPosition', 'labelColor', 'labelTextOpacity', 'labelBackgroundOpacity', 'colorRange', 'maxZoom', 
                            'oneDHeatmapFlipped', 'colorbarPosition', 'colorbarLabelsPosition' ]
    },
    {
        type: 'horizontal-line',
        datatype: ['vector'],
        local: false,
        orientation: '1d-horizontal',
        thumbnail: svgHorizontalLineIcon,
        availableOptions: [ 'labelPosition', 'labelColor', 'labelTextOpacity', 'labelBackgroundOpacity', 'axisPositionHorizontal', 'lineStrokeWidth', 'lineStrokeColor', 'valueScaling' ],
        defaultOptions: {
            labelColor: 'black',
            labelPosition: 'topLeft',
            axisPositionHorizontal: 'right',
            lineStrokeColor: 'blue',
            lineStrokeWidth: 1,
            valueScaling: 'linear'
        }
    },
    //
    {
        type: 'vertical-line',
        datatype: ['vector'],
        local: false,
        orientation: '1d-vertical',
        thumbnail: svgVerticalLineIcon,
        availableOptions: [ 'labelPosition', 'labelColor', 'labelTextOpacity', 'labelBackgroundOpacity', 'axisPositionVertical', 'lineStrokeWidth', 'lineStrokeColor', 'valueScaling' ],
        defaultOptions: {
            labelColor: 'black',
            labelPosition: 'bottomLeft',
            axisPositionVertical: 'top',
            lineStrokeWidth: 1,
            lineStrokeColor: 'blue',
            valueScaling: 'linear'
        }
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
        type: 'horizontal-1d-value-interval',
        datatype: ['bed-value'],
        local: false,
        orientation: ['1d-horizontal'],
        name: '1D Rectangles',
        availableOptions: [ 'labelPosition', 'labelColor', 'labelTextOpacity', 'labelBackgroundOpacity', 'axisPositionHorizontal' ],
        defaultOptions: {
            labelColor: 'black',
            labelPosition: 'bottomLeft',
            axisPositionHorizontal: 'left',
            lineStrokeColor: 'blue',
            valueScaling: 'linear'
        }
    },
    { 
        type: 'vertical-1d-value-interval',
        datatype: ['bed-value'],
        local: false,
        orientation: ['1d-vertical'],
        name: '1D Rectangles',
        availableOptions: [ 'labelPosition', 'labelColor', 'labelTextOpacity', 'labelBackgroundOpacity', 'axisPositionVertical' ],
        defaultOptions: {
            labelColor: 'black',
            labelPosition: 'bottomLeft',
            axisPositionVertical: 'top',
            lineStrokeColor: 'blue',
            valueScaling: 'linear'
        }
    },
    {
        type: 'top-stacked-interval',
        datatype: ['stacked-interval'],
        local: false,
        orientation: '1d-horizontal',
        thumbnail: 'horizontal-stacked-interval.png',
        availableOptions: [ 'labelPosition', 'labelColor', 'labelTextOpacity', 'labelBackgroundOpacity' ]
    },
    {
        type: 'left-stacked-interval',
        datatype: ['stacked-interval'],
        local: false,
        orientation: '1d-vertical',
        thumbnail: 'vertical-stacked-interval.png',
        availableOptions: [ 'labelPosition', 'labelColor', 'labelTextOpacity', 'labelBackgroundOpacity']
    },
    {
        type: 'viewport-projection-vertical',
        datatype: ['1d-projection'],
        local: true,
        hidden: true,
        orientation: '1d-vertical',
        name: 'Viewport Projection',
        thumbnail: 'viewport-projection-center.png',
        availableOptions: ['projectionFillColor', 'projectionStrokeColor'],
        defaultOptions: {
            projectionFillColor: "#777",
            projectionStrokeColor: "#777",
            projectionFillOpacity: 0.3,
            projectionStrokeOpacity: 0.3
        }
    },
    {
        type: 'viewport-projection-horizontal',
        datatype: ['1d-projection'],
        local: true,
        hidden: true,
        orientation: '1d-horizontal',
        name: 'Viewport Projection',
        thumbnail: 'viewport-projection-center.png',
        availableOptions: ['projectionFillColor', 'projectionStrokeColor'],
        defaultOptions: {
            projectionFillColor: "#777",
            projectionStrokeColor: "#777",
            projectionFillOpacity: 0.3,
            projectionStrokeOpacity: 0.3
        }
    },
    {
        type: 'viewport-projection-center',
        datatype: ['2d-projection'],
        local: true,
        hidden: true,
        orientation: '2d',
        name: 'Viewport Projection',
        thumbnail: 'viewport-projection-center.png',
        availableOptions: ['projectionFillColor', 'projectionStrokeColor'],
        defaultOptions: {
            projectionFillColor: "#777",
            projectionStrokeColor: "#777",
            projectionFillOpacity: 0.3,
            projectionStrokeOpacity: 0.3
        }
    },
    {
        type: 'horizontal-gene-annotations',
        datatype: ['gene-annotation'],
        local: false,
        minHeight: 60,
        orientation: '1d-horizontal',
        name: 'Gene Annotations',
        thumbnail: svgGeneAnnotationsIcon,
        availableOptions: [ 'labelPosition', 'labelColor', 'labelTextOpacity', 'labelBackgroundOpacity', 'plusStrandColor', 'minusStrandColor' ],
        defaultOptions: {
            labelColor: 'black',
            labelPosition: 'hidden',
            plusStrandColor: 'blue',
            minusStrandColor: 'red'
        }
    },
    {
        type: 'vertical-gene-annotations',
        datatype: ['gene-annotation'],
        local: false,
        minWidth: 60,
        orientation: '1d-vertical',
        name: 'Gene Annotations',
        thumbnail: svgVerticalGeneAnnotationsIcon,
        availableOptions: [ 'labelPosition', 'labelColor', 'labelTextOpacity', 'labelBackgroundOpacity', 'plusStrandColor', 'minusStrandColor' ],
        defaultOptions: {
            labelColor: 'black',
            labelPosition: 'hidden',
            plusStrandColor: 'blue',
            minusStrandColor: 'red'
        }
    },

    {
        type: 'arrowhead-domains',
        datatype: ['arrowhead-domains'],
        local: false,
        orientation: '2d',
        name: 'Arrowhead Domains',
        thumbnail: svgArrowheadDomainsIcon,
        availableOptions: [ 'labelPosition', 'labelColor', 'labelTextOpacity', 'labelBackgroundOpacity' ],
        defaultOptions: {
            labelColor: 'black',
            labelPosition: 'hidden',
        }
    },

    {
        type: 'vertical-2d-rectangle-domains',
        datatype: ['2d-rectangle-domains'],
        local: false,
        orientation: '1d-vertical',
        name: 'Vertical 2D Rectangle Domains',
        thumbnail: svgArrowheadDomainsIcon,
        availableOptions: [ 'labelPosition', 'labelColor', 'labelTextOpacity', 'labelBackgroundOpacity' ],
        defaultOptions: {
            labelColor: 'black',
            labelPosition: 'hidden',
        }
    },

    {
        type: 'horizontal-2d-rectangle-domains',
        datatype: ['2d-rectangle-domains'],
        local: false,
        orientation: '1d-horizontal',
        name: 'Horizontal 2D Rectangle Domains',
        thumbnail: svgArrowheadDomainsIcon,
        availableOptions: [ 'labelPosition', 'labelColor', 'labelTextOpacity', 'labelBackgroundOpacity' ],
        defaultOptions: {
            labelColor: 'black',
            labelPosition: 'bottomLeft',
        }
    },

    {
        type: '2d-rectangle-domains',
        datatype: ['2d-rectangle-domains'],
        local: false,
        orientation: '2d',
        name: '2D Rectangle Domains',
        thumbnail: svgArrowheadDomainsIcon,
        availableOptions: [ 'labelPosition', 'labelColor', 'labelTextOpacity', 'labelBackgroundOpacity' ],
        defaultOptions: {
            labelColor: 'black',
            labelPosition: 'hidden',
        }
    },

    {
        type: 'square-markers',
        datatype: ['bedpe'],
        local: false,
        orientation: '2d',
        name: 'Square Markers',
        thumbnail: svgArrowheadDomainsIcon,
        availableOptions: [ 'labelPosition', 'labelColor' ],
        defaultOptions: {
            labelColor: 'black',
            labelPosition: 'hidden',
        }
    },

    {
        type: 'combined',
        datatype: 'any',
        local: true,
        orientation: 'any'
    }
    ,
    {
        type: '2d-chromosome-grid',
        datatype: ['chromosome-2d-grid'],
        local: true,
        orientation: '2d',
        name: 'Chromosome Grid (hg19)',
        chromInfoPath: "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
        thumbnail: null,
        availableOptions: ['lineStrokeWidth', 'lineStrokeColor'],
        defaultOptions: {
            lineStrokeWidth: 1,
            lineStrokeColor: 'grey'
        }
    }
    ,
    {
        type: '2d-chromosome-labels',
        datatype: ['chromosome-2d-labels'],
        local: true,
        orientation: '2d',
        name: 'Pairwise Chromosome Labels (hg19)',
        chromInfoPath: "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
        thumbnail: null
    }
    ,
    {
        type: '2d-chromosome-labels',
        datatype: ['chromosome-2d-labels-mm9'],
        local: true,
        orientation: '2d',
        name: 'Pairwise Chromosome Labels (mm9)',
        chromInfoPath: "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
        thumbnail: null
    }
    ,
    {
        type: '2d-chromosome-annotations',
        local: true,
        orientation: '2d',
        name: '2D Chromosome Annotations',
        thumbnail: null,
        hidden: true
    }
    ,
    {
        type: 'horizontal-chromosome-labels',
        datatype: ['chromosome-1d-labels'],
        local: true,
        orientation: '1d-horizontal',
        minHeight: 30,
        name: 'Chromosome Axis (hg19)',
        chromInfoPath: "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
        thumbnail: null
    }
    ,
    {
        type: 'horizontal-chromosome-labels',
        datatype: ['chromosome-1d-labels-mm9'],
        local: true,
        orientation: '1d-horizontal',
        minHeight: 30,
        name: 'Chromosome Axis (mm9)',
        chromInfoPath: "//s3.amazonaws.com/pkerp/data/mm9/chromSizes.tsv",
        thumbnail: null
    }
    ,
    {
        type: 'vertical-chromosome-labels',
        datatype: ['chromosome-1d-labels'],
        local: true,
        orientation: '1d-vertical',
        minWidth: 30,
        minHeight: 30,
        name: 'Chromosome Axis (hg19)',
        chromInfoPath: "//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv",
        thumbnail: null
    }
    ,
    {
        type: 'vertical-1d-tiles',
        datatype: ['1d-tiles'],
        local: false,
        orientation: '1d-vertical',
        name: 'Vertical 1D Tile Outlines',
        thumbnail: svgVertical1DTilesIcon
    },
    {
        type: 'horizontal-1d-tiles',
        datatype: ['vector', 'stacked-interval', 'gene-annotation'],
        local: false,
        orientation: '1d-horizontal',
        name: 'Horizontal 1D Tile Outlines',
        thumbnail: svg1DTilesIcon
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
export const LONG_DRAG_TIMEOUT = 2000;

export const LOCATION_LISTENER_PREFIX = 'locationListenerPrefix';

export const ZOOM_TRANSITION_DURATION = 1000;

export const defaultServer = "http://test.higlass.io/api/v1"
