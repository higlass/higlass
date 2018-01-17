import {
  formatPrefix,
  precisionPrefix,
} from 'd3-format';

import HeatmapOptions from '../HeatmapOptions';

const AVAILABLE_COLORS = {
  black: { name: 'Black', value: 'black' },
  blue: { name: 'Blue', value: 'blue' },
  brown: { name: 'Brown', value: 'brown' },
  cyan: { name: 'Cyan', value: 'cyan' },
  green: { name: 'Green', value: 'green' },
  grey: { name: 'Grey', value: 'grey' },
  orange: { name: 'Orange', value: 'orange' },
  purple: { name: 'Purple', value: 'purple' },
  turquoise: { name: 'Turquoise', value: 'turquoise' },
  red: { name: 'Red', value: 'red' },
  white: { name: 'White', value: 'white' },
};

const AVAILABLE_WIDTHS = {
  1: { name: '1', value: 1 },
  2: { name: '2', value: 2 },
  3: { name: '3', value: 3 },
  5: { name: '5', value: 5 },
  8: { name: '8', value: 8 },
  13: { name: '13', value: 13 },
};
const AVAILABLE_WIDTHS_AND_NONE = Object.assign(AVAILABLE_WIDTHS, {
  'none': { name: 'none', value: 'none'}});

const OPACITY_OPTIONS = {
  0: { name: '0%', value: 0.0 },
  0.2: { name: '20%', value: 0.2 },
  0.4: { name: '40%', value: 0.4 },
  0.6: { name: '60%', value: 0.6 },
  0.8: { name: '80%', value: 0.8 },
  '1.0': { name: '100%', value: 1.0 },
};

export const OPTIONS_INFO = {
  heatmapValueScaling: {
    name: 'Value Scaling',
    inlineOptions: {
      linear: { name: 'Linear', value: 'linear' },
      log: { name: 'Log', value: 'log' },
    },
  },
  valueScaling: {
    name: 'Value Scaling',
    inlineOptions: {
      linear: { name: 'Linear', value: 'linear' },
      log: { name: 'Log', value: 'log' },
    },
  },
  lineStrokeWidth: {
    name: 'Stroke Width',
    inlineOptions: AVAILABLE_WIDTHS,
  },
  trackBorderWidth: {
    name: 'Track Border Width',
    inlineOptions: AVAILABLE_WIDTHS,
  },
  minSquareSize: {
    name: 'Minimum size',
    inlineOptions: AVAILABLE_WIDTHS_AND_NONE,
  },
  pointSize: {
    name: 'Point Size',
    inlineOptions: AVAILABLE_WIDTHS,
  },
  pointColor: {
    name: 'Point Color',
    inlineOptions: AVAILABLE_COLORS,
  },
  trackBorderColor: {
    name: 'Track Border Color',
    inlineOptions: AVAILABLE_COLORS,
  },
  minusStrandColor: {
    name: '- Strand Color',
    inlineOptions: AVAILABLE_COLORS,
  },
  plusStrandColor: {
    name: '+ Strand Color',
    inlineOptions: AVAILABLE_COLORS,
  },
  lineStrokeColor: {
    name: 'Stroke color',
    inlineOptions: AVAILABLE_COLORS,
  },
  projectionStrokeColor: {
    name: 'Stroke color',
    inlineOptions: AVAILABLE_COLORS,
  },
  projectionFillColor: {
    name: 'Fill color',
    inlineOptions: AVAILABLE_COLORS,
  },
  barFillColor: {
    name: 'Fill color',
    inlineOptions: AVAILABLE_COLORS,
  },
  barFillColorTop: {
    name: 'Top Fill color',
    inlineOptions: AVAILABLE_COLORS,
  },
  barFillColorBottom: {
    name: 'Bottom Fill color',
    inlineOptions: AVAILABLE_COLORS,
  },
  barOpacity: {
    name: 'Bar opacity',
    inlineOptions: OPACITY_OPTIONS,
  },
  rectangleDomainStrokeColor: {
    name: 'Stroke color',
    inlineOptions: AVAILABLE_COLORS,
  },
  rectangleDomainFillColor: {
    name: 'Fill color',
    inlineOptions: AVAILABLE_COLORS,
  },
  rectangleDomainOpacity: {
    name: 'Opacity',
    inlineOptions: OPACITY_OPTIONS,
  },
  mapboxStyle: {
    name: 'Map style',
    inlineOptions: {
      streets: {
        name: 'streets',
        value: 'mapbox.streets',
      },
      light: {
        name: 'light',
        value: 'mapbox.light',
      },
      dark: {
        name: 'dark',
        value: 'mapbox.dark',
      },
      satellite: {
        name: 'satellite',
        value: 'mapbox.satellite',
      },
      'streets-satellite': {
        name: 'streets-satellite',
        value: 'mapbox.streets-satellite',
      },
      wheatpaste: {
        name: 'wheatpaste',
        value: 'mapbox.wheatpaste',
      },
      'streets-basic': {
        name: 'streets-basic',
        value: 'mapbox.streets-basic',
      },
      comic: {
        name: 'comic',
        value: 'mapbox.comic',
      },
      outdoors: {
        name: 'outdoors',
        value: 'mapbox.outdoors',
      },
      'run-bike-hike': {
        name: 'run-bike-hike',
        value: 'mapbox.run-bike-hike',
      },
      pencil: {
        name: 'pencil',
        value: 'mapbox.pencil',
      },
      pirates: {
        name: 'pirates',
        value: 'mapbox.pirates',
      },
      emerald: {
        name: 'emerald',
        value: 'mapbox.emerald',
      },
      'high-contrast': {
        name: 'high-contrast',
        value: 'mapbox.high-contrast',
      },
    },
  },
  oneDHeatmapFlipped: {
    name: 'Flip Heatmap',
    inlineOptions: {
      yes: { name: 'Yes', value: 'yes' },
      no: { name: 'No', value: null },
    },
  },
  showMousePosition: {
    name: 'Show Mouse Position',
    inlineOptions: {
      yes: { name: 'Yes', value: true},
      no: { name: 'No', value: false },
    },
  },
  axisPositionHorizontal: {
    name: 'Axis Position',
    inlineOptions: {
      left: { name: 'Left', value: 'left' },
      outsideLeft: { name: 'Outside left', value: 'outsideLeft' },
      right: { name: 'Right', value: 'right' },
      outsideRight: { name: 'Outside right', value: 'outsideRight' },
      hidden: { name: 'Hidden', value: null },
    },
  },

  axisPositionVertical: {
    name: 'Axis Position',
    inlineOptions: {
      top: { name: 'Top', value: 'top' },
      outsideTop: { name: 'Outside top', value: 'outsideTop' },
      bottom: { name: 'Bottom', value: 'bottom' },
      outsideBottom: { name: 'Outside bottom', value: 'outsideBottom' },
      hidden: { name: 'Hidden', value: null },
    },
  },

  colorbarPosition: {
    name: 'Colorbar Position',
    inlineOptions: {
      topLeft: { name: 'Top Left', value: 'topLeft' },
      topRight: { name: 'Top Right', value: 'topRight' },
      bottomLeft: { name: 'Bottom Left', value: 'bottomLeft' },
      bottomRight: { name: 'Bottom Right', value: 'bottomRight' },
      hidden: { name: 'Hidden', value: null },
    },
  },

  /*
  colorbarOrientation: {
    name: 'Colorbar Orientation',
    inlineOptions: {
      'horizontal': { name: 'Horizontal', value: 'horizontal' },
      'vertical': { name: 'Vertical', value: 'vertical' },
    }
  },
  */

  // This will default to 'inside' if it's not set when colorbarPosition
  // is set
  colorbarLabelsPosition: {
    name: 'Colorbar Labels Position',
    inlineOptions: {
      inside: { name: 'Inside', value: 'inside' },
      outside: { name: 'Outside', value: 'outside' },
    },
  },

  labelColor: {
    name: 'Label Color',
    inlineOptions: AVAILABLE_COLORS,
  },

  labelPosition: {
    name: 'Label Position',
    inlineOptions: {
      ol: { name: 'Outer left', value: 'outerLeft' },
      or: { name: 'Outer right', value: 'outerRight' },
      ot: { name: 'Outer top', value: 'outerTop' },
      ob: { name: 'Outer bottom', value: 'outerBottom' },
      tl: { name: 'Top left', value: 'topLeft' },
      tr: { name: 'Top right', value: 'topRight' },
      bl: { name: 'Bottom left', value: 'bottomLeft' },
      br: { name: 'Bottom right', value: 'bottomRight' },
      hidden: { name: 'Hidden', value: 'hidden' },
    },
  },

  labelTextOpacity: {
    name: 'Label Text Opacity',
    inlineOptions: OPACITY_OPTIONS,
  },

  labelBackgroundOpacity: {
    name: 'Label Background Opacity',
    inlineOptions: OPACITY_OPTIONS,
  },

  // colormaps are mostly taken from here:
  // http://matplotlib.org/api/pyplot_summary.html?highlight=colormaps#matplotlib.pyplot.colormaps
  colorRange: {
    name: 'Color map',
    inlineOptions: {
      afmhot: {
        name: 'afmhot',
        value: [
          'rgba(0,0,0,1.0)',
          'rgba(128,0,0,1.0)',
          'rgba(256,129,1,1.0)',
          'rgba(256,256,129,1.0)',
          'rgba(256,256,256,1.0)',
        ],
      },
      fall: {
        name: 'fall',
        value: [
          'white',
          'rgba(245,166,35,1.0)',
          'rgba(208,2,27,1.0)',
          'black',
        ],
      },
      hot: {
        name: 'hot',
        value: [
          'rgba(10,0,0,1.0)',
          'rgba(179,0,0,1.0)',
          'rgba(256,91,0,1.0)',
          'rgba(256,256,6,1.0)',
          'rgba(256,256,256,1.0)',
        ],
      },
      jet: {
        name: 'jet',
        value: [
          'rgba(0,0,128,1.0)',
          'rgba(0,129,256,1.0)',
          'rgba(125,256,122,1.0)',
          'rgba(256,148,0,1.0)',
          'rgba(128,0,0,1.0)',
        ],
      },

      bwr: {
        name: 'bwr',
        value: [
          'rgba(0,0,256,1.0)',
          'rgba(128,128,256,1.0)',
          'rgba(256,254,254,1.0)',
          'rgba(256,126,126,1.0)',
          'rgba(256,0,0,1.0)',
        ],
      },
      cubehelix: {
        name: 'cubehelix',
        value: [
          'rgba(0,0,0,1.0)',
          'rgba(21,83,76,1.0)',
          'rgba(162,121,74,1.0)',
          'rgba(199,180,238,1.0)',
          'rgba(256,256,256,1.0)',
        ],
      },
      rainbow: {
        name: 'rainbow',
        value: [
          'rgba(128,0,256,1.0)',
          'rgba(0,181,236,1.0)',
          'rgba(129,255,180,1.0)',
          'rgba(256,179,96,1.0)',
          'rgba(256,0,0,1.0)',
        ],
      },

      gray: {
        name: 'greys',
        value: [
          'rgba(255,255,255,1)',
          'rgba(0,0,0,1)',
        ],
      },
      red: {
        name: 'White to red',
        value: [
          'rgba(255,255,255,1)',
          'rgba(255,0,0,1)',
        ],
      },
      green: {
        name: 'White to green',
        value: [
          'rgba(255,255,255,1)',
          'rgba(0,255,0,1)',
        ],
      },
      blue: {
        name: 'White to blue',
        value: [
          'rgba(255,255,255,1)',
          'rgba(0,0,255,1)',
        ],
      },
      custard: {
        name: 'custard',
        value: [
          '#FFFFFF',
          '#F8E71C',
          'rgba(245,166,35,1)',
          'rgba(0,0,0,1)',
        ],
      },
      custom: {
        name: 'Custom...',
        componentPickers: {
          heatmap: HeatmapOptions,
          'horizontal-heatmap': HeatmapOptions,
        },
      },
    },
  },

  dataTransform: {
    name: 'Transforms',
    inlineOptions: {
      default: { name: 'Default', value: 'default' },
      None: { name: 'None', value: 'None' },
    },
    generateOptions: (track) => {
      const inlineOptions = [];

      // console.log('track:',track);
      // console.log('track.tilesetInfo:', track.tilesetInfo);

      if (track.transforms) {
        for (const transform of track.transforms) {
          inlineOptions.push({
            name: transform.name,
            value: transform.value,
          });
        }
      }

      // console.log('inlineOptions:', inlineOptions);
      return inlineOptions;
    },
  },

  maxZoom: {
    name: 'Zoom limit',
    inlineOptions: {
      none: { name: 'None', value: null },
    },
    generateOptions: (track) => {
      if (track.maxZoom) {
        const inlineOptions = [];

        for (let i = 0; i <= track.maxZoom; i++) {
          const maxWidth = track.maxWidth;
          const binsPerDimension = track.binsPerDimension;
          const maxZoom = track.maxZoom;

          const resolution = track.maxWidth / (2 ** i * track.binsPerDimension);

          const maxResolutionSize = maxWidth / (2 ** maxZoom * binsPerDimension);

          const pp = precisionPrefix(maxResolutionSize, resolution);
          const f = formatPrefix(`.${pp}`, resolution);
          const formattedResolution = f(resolution);

          // const formattedName =  ;
          inlineOptions.push({
            name: formattedResolution,
            value: i.toString(),
          });

          //
        }

        return inlineOptions;
      } return [];
    },
  },

  valueColumn: {
    name: 'Value column',
    inlineOptions: {
      none: { name: 'None', value: null },
    },
    generateOptions: (track) => {
      if (!track.header)
        return [];

      let headerParts = track.header.split('\t');
      let options = [];

      for (let i = 0; i < headerParts.length; i++) {
        options.push({
          name: headerParts[i],
          value: i+1,
        });
      }

        /*
      console.log('headerParts:', headerParts);
      console.log('options:', options);
      */

      return options;
    }
  }
};

export default OPTIONS_INFO;
