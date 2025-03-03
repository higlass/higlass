// @ts-nocheck
// A better position of this file would be under \configs,
// but this file imports HeatmapOptions that contains React
// components, so having this file near track implementations

import { formatPrefix, precisionPrefix } from 'd3-format';

import HeatmapOptions from './HeatmapOptions';

const valueColumnOptions = (track) => {
  if (!track.header) return [];

  const headerParts = track.header.split('\t');
  const options = [];

  for (let i = 0; i < headerParts.length; i++) {
    options.push({
      name: headerParts[i],
      value: i + 1,
    });
  }

  return options;
};

const sizesInPx = (sizes, unit = '', multiplier = 1) =>
  sizes.reduce((sizeOption, size) => {
    sizeOption[size] = { name: `${size * multiplier}${unit}`, value: size };
    return sizeOption;
  }, {});

const YES_NO = {
  yes: { name: 'Yes', value: true },
  no: { name: 'No', value: false },
};

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

const SPECIAL_COLORS = {
  use_stroke: { name: 'Glyph color', value: '[glyph-color]' },
};

const AVAILABLE_WIDTHS = sizesInPx([1, 2, 3, 5, 8, 13, 21]);
const AVAILABLE_WIDTHS_AND_NONE = Object.assign(AVAILABLE_WIDTHS, {
  none: { name: 'none', value: 'none' },
});

const AVAILABLE_MARGIN = sizesInPx([0, 2, 4, 8, 16, 32, 64, 128, 256]);

const OPACITY_OPTIONS = sizesInPx([0.0, 0.2, 0.4, 0.6, 0.8, 1.0], '%', 100);
const OPACITY_OPTIONS_NO_ZERO = sizesInPx([0.2, 0.4, 0.6, 0.8, 1.0], '%', 100);

// these values define the options that are visible in the track config
// menu
const OPTIONS_INFO = {
  axisLabelFormatting: {
    name: 'Axis Label Formatting',
    inlineOptions: {
      normal: {
        name: 'normal',
        value: 'normal',
      },
      scientific: {
        name: 'scientific',
        value: 'scientific',
      },
    },
  },
  flipDiagonal: {
    name: 'Flip Across Diagonal',
    inlineOptions: {
      none: { name: 'No', value: 'none' },
      yes: { name: 'Yes', value: 'yes' },
      copy: { name: 'Copy', value: 'copy' },
    },
  },
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
  extent: {
    name: 'Extent',
    inlineOptions: {
      full: { name: 'Full', value: 'full' },
      upperRight: { name: 'Upper Right', value: 'upper-right' },
      lowerLeft: { name: 'Lower Left', value: 'lower-left' },
    },
  },
  labelLeftMargin: {
    name: 'Label Left Margin',
    inlineOptions: AVAILABLE_MARGIN,
  },
  labelRightMargin: {
    name: 'Label Right Margin',
    inlineOptions: AVAILABLE_MARGIN,
  },
  labelTopMargin: {
    name: 'Label Top Margin',
    inlineOptions: AVAILABLE_MARGIN,
  },
  labelBottomMargin: {
    name: 'Label Bottom Margin',
    inlineOptions: AVAILABLE_MARGIN,
  },
  labelShowResolution: {
    name: 'Label Show Resolution',
    inlineOptions: YES_NO,
  },
  labelShowAssembly: {
    name: 'Label Show Assembly',
    inlineOptions: YES_NO,
  },
  lineStrokeWidth: {
    name: 'Stroke Width',
    inlineOptions: AVAILABLE_WIDTHS,
  },
  strokeWidth: {
    name: 'Stroke Width',
    inlineOptions: AVAILABLE_WIDTHS,
  },
  trackBorderWidth: {
    name: 'Track Border Width',
    inlineOptions: AVAILABLE_WIDTHS,
  },
  separatePlusMinusStrands: {
    name: 'Separate +/- strands',
    inlineOptions: YES_NO,
  },
  sortLargestOnTop: {
    name: 'Sort Largest On Top',
    inlineOptions: YES_NO,
  },
  showTexts: {
    name: 'Show texts',
    inlineOptions: YES_NO,
  },
  staggered: {
    name: 'Staggered',
    inlineOptions: YES_NO,
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
  backgroundColor: {
    name: 'Background Color',
    inlineOptions: {
      white: { name: 'White', value: 'white' },
      lightGrey: { name: 'Light Grey', value: '#eeeeee' },
      grey: { name: 'Grey', value: '#cccccc' },
      black: { name: 'Black', value: 'black' },
      transparent: { name: 'Transparent', value: 'transparent' },
    },
  },
  colorScale: {
    name: 'Color Scale',
    inlineOptions: {
      epilogos: {
        name: 'Epilogos',
        values: [
          '#FF0000',
          '#FF4500',
          '#32CD32',
          '#008000',
          '#006400',
          '#C2E105',
          '#FFFF00',
          '#66CDAA',
          '#8A91D0',
          '#CD5C5C',
          '#E9967A',
          '#BDB76B',
          '#808080',
          '#C0C0C0',
          '#FFFFFF',
        ],
      },
      category10: {
        name: 'D3 Category10',
        values: [
          '#1F77B4',
          '#FF7F0E',
          '#2CA02C',
          '#D62728',
          '#9467BD',
          '#8C564B',
          '#E377C2',
          '#7F7F7F',
          '#BCBD22',
          '#17BECF',
        ],
      },
    },
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
  stroke: {
    name: 'Stroke Color',
    inlineOptions: AVAILABLE_COLORS,
  },
  strokeColor: {
    name: 'Stroke color',
    inlineOptions: AVAILABLE_COLORS,
  },
  fill: {
    name: 'Fill Color',
    inlineOptions: AVAILABLE_COLORS,
  },
  color: {
    name: 'Color',
    inlineOptions: AVAILABLE_COLORS,
  },
  fontColor: {
    name: 'Font color',
    inlineOptions: AVAILABLE_COLORS,
  },
  fillColor: {
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
  zeroLineVisible: {
    name: 'Zero line visible',
    inlineOptions: YES_NO,
  },
  zeroLineColor: {
    name: 'Zero line color',
    inlineOptions: AVAILABLE_COLORS,
  },
  zeroLineOpacity: {
    name: 'Zero line opacity',
    inlineOptions: OPACITY_OPTIONS_NO_ZERO,
  },
  fillOpacity: {
    name: 'Fill Opacity',
    inlineOptions: OPACITY_OPTIONS,
  },
  strokeOpacity: {
    name: 'Stroke Opacity',
    inlineOptions: OPACITY_OPTIONS,
  },
  strokePos: {
    name: 'Stroke Position',
    inlineOptions: {
      aroundInner: { name: 'Around Inner', value: 'around' },
      aroundCenter: { name: 'Around Center', value: null },
      hidden: { name: 'Hidden', value: 'hidden' },
      top: { name: 'Top', value: 'top' },
      right: { name: 'Right', value: 'right' },
      bottom: { name: 'Bottom', value: 'bottom' },
      left: { name: 'Left', value: 'left' },
    },
  },
  barBorder: {
    name: 'Bar border',
    inlineOptions: YES_NO,
  },
  scaledHeight: {
    name: 'Scaled height',
    inlineOptions: YES_NO,
  },
  rectangleDomainStrokeColor: {
    name: 'Stroke color',
    inlineOptions: AVAILABLE_COLORS,
  },
  rectangleDomainFillColor: {
    name: 'Fill color',
    inlineOptions: AVAILABLE_COLORS,
  },
  rectangleDomainFillOpacity: {
    name: 'Fill opacity',
    inlineOptions: OPACITY_OPTIONS,
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
    inlineOptions: YES_NO,
  },
  showTooltip: {
    name: 'Show Tooltip',
    inlineOptions: YES_NO,
  },

  fontSize: {
    name: 'Font Size',
    inlineOptions: sizesInPx([8, 9, 10, 11, 12, 14, 16, 18, 24], 'px'),
  },

  tickPositions: {
    name: 'Tick Positions',
    inlineOptions: {
      even: {
        name: 'Even',
        value: 'even',
      },
      ends: {
        name: 'Ends',
        value: 'ends',
      },
    },
  },

  tickFormat: {
    name: 'Tick Format',
    inlineOptions: {
      plain: {
        name: 'Plain',
        value: 'plain',
      },
      si: {
        name: 'SI',
        value: 'si',
      },
    },
  },

  colorEncoding: {
    name: 'Color Encode Annotations',
    inlineOptions: {
      none: { name: 'None', value: null },
      itemRgb: { name: 'itemRgb', value: 'itemRgb' },
    },
    generateOptions: valueColumnOptions,
  },

  fontIsAligned: {
    name: 'Left-Align Font',
    inlineOptions: YES_NO,
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

  axisMargin: {
    name: 'Axis Margin',
    inlineOptions: sizesInPx([0, 10, 20, 30, 40, 50, 100, 200, 400], 'px'),
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

  colorbarBackgroundColor: {
    name: 'Colorbar Background Color',
    inlineOptions: AVAILABLE_COLORS,
  },

  colorbarBackgroundOpacity: {
    name: 'Colorbar Background Opacity',
    inlineOptions: OPACITY_OPTIONS,
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
    inlineOptions: { ...AVAILABLE_COLORS, ...SPECIAL_COLORS },
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

  geneAnnotationHeight: {
    name: 'Gene Annotation Height',
    inlineOptions: {
      8: { name: '8px', value: 8 },
      10: { name: '10px', value: 10 },
      12: { name: '12px', value: 12 },
      16: { name: '16px', value: 16 },
    },
  },

  annotationHeight: {
    name: 'Annotation Height',
    inlineOptions: {
      5: { name: '5px', value: 5 },
      8: { name: '8px', value: 8 },
      10: { name: '10px', value: 10 },
      12: { name: '12px', value: 12 },
      16: { name: '16px', value: 16 },
      20: { name: '20px', value: 20 },
      scaled: { name: 'scaled', value: 'scaled' },
    },
  },

  maxAnnotationHeight: {
    name: 'Max Annotation Height',
    inlineOptions: {
      5: { name: '5px', value: 5 },
      8: { name: '8px', value: 8 },
      10: { name: '10px', value: 10 },
      12: { name: '12px', value: 12 },
      16: { name: '16px', value: 16 },
      20: { name: '20px', value: 20 },
      none: { name: 'none', value: null },
    },
  },

  annotationStyle: {
    name: 'Annotation Style',
    inlineOptions: {
      box: { name: 'Box', value: 'box' },
      segment: { name: 'Segment', value: 'segment' },
    },
  },

  geneLabelPosition: {
    name: 'Gene Label Position',
    inlineOptions: {
      inside: { name: 'Inside', value: 'inside' },
      outside: { name: 'Outside', value: 'outside' },
    },
  },

  geneStrandSpacing: {
    name: 'Gene Strand Spacing',
    inlineOptions: {
      2: { name: '2px', value: 2 },
      4: { name: '4px', value: 4 },
      8: { name: '8px', value: 8 },
    },
  },

  labelBackgroundColor: {
    name: 'Label Background Color',
    inlineOptions: AVAILABLE_COLORS,
  },

  labelBackgroundOpacity: {
    name: 'Label Background Opacity',
    inlineOptions: OPACITY_OPTIONS,
  },

  viewResolution: {
    name: 'View Resolution',
    inlineOptions: {
      high: { name: 'High', value: 384 },
      medium: { name: 'Medium', value: 1024 },
      low: { name: 'Low', value: 2048 },
    },
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
        value: ['white', 'rgba(245,166,35,1.0)', 'rgba(208,2,27,1.0)', 'black'],
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
        value: ['rgba(255,255,255,1)', 'rgba(0,0,0,1)'],
      },
      red: {
        name: 'White to red',
        value: ['rgba(255,255,255,1)', 'rgba(255,0,0,1)'],
      },
      green: {
        name: 'White to green',
        value: ['rgba(255,255,255,1)', 'rgba(0,255,0,1)'],
      },
      blue: {
        name: 'White to blue',
        value: ['rgba(255,255,255,1)', 'rgba(0,0,255,1)'],
      },
      custard: {
        name: 'custard',
        value: ['#FFFFFF', '#F8E71C', 'rgba(245,166,35,1)', 'rgba(0,0,0,1)'],
      },
      magma: {
        name: 'magma',
        value: [
          'rgba(0,0,3,1)',
          'rgba(0,0,4,1)',
          'rgba(0,0,6,1)',
          'rgba(1,0,7,1)',
          'rgba(1,1,9,1)',
          'rgba(1,1,11,1)',
          'rgba(2,2,13,1)',
          'rgba(2,2,15,1)',
          'rgba(3,3,17,1)',
          'rgba(4,3,19,1)',
          'rgba(4,4,21,1)',
          'rgba(5,4,23,1)',
          'rgba(6,5,25,1)',
          'rgba(7,5,27,1)',
          'rgba(8,6,29,1)',
          'rgba(9,7,32,1)',
          'rgba(10,7,34,1)',
          'rgba(11,8,36,1)',
          'rgba(12,9,38,1)',
          'rgba(13,10,40,1)',
          'rgba(14,10,42,1)',
          'rgba(15,11,45,1)',
          'rgba(16,12,47,1)',
          'rgba(17,12,49,1)',
          'rgba(19,13,51,1)',
          'rgba(20,13,54,1)',
          'rgba(21,14,56,1)',
          'rgba(22,14,58,1)',
          'rgba(23,15,61,1)',
          'rgba(25,15,63,1)',
          'rgba(26,16,66,1)',
          'rgba(27,16,68,1)',
          'rgba(28,16,70,1)',
          'rgba(30,17,73,1)',
          'rgba(31,17,75,1)',
          'rgba(33,17,78,1)',
          'rgba(34,17,80,1)',
          'rgba(36,17,83,1)',
          'rgba(37,17,85,1)',
          'rgba(39,17,87,1)',
          'rgba(40,17,90,1)',
          'rgba(42,17,92,1)',
          'rgba(43,17,94,1)',
          'rgba(45,17,97,1)',
          'rgba(47,16,99,1)',
          'rgba(49,16,101,1)',
          'rgba(50,16,103,1)',
          'rgba(52,16,105,1)',
          'rgba(54,15,107,1)',
          'rgba(55,15,108,1)',
          'rgba(57,15,110,1)',
          'rgba(59,15,112,1)',
          'rgba(61,15,113,1)',
          'rgba(62,15,114,1)',
          'rgba(64,15,116,1)',
          'rgba(66,15,117,1)',
          'rgba(67,15,118,1)',
          'rgba(69,15,119,1)',
          'rgba(71,15,120,1)',
          'rgba(72,16,120,1)',
          'rgba(74,16,121,1)',
          'rgba(76,16,122,1)',
          'rgba(77,17,123,1)',
          'rgba(79,17,123,1)',
          'rgba(81,18,124,1)',
          'rgba(82,18,124,1)',
          'rgba(84,19,125,1)',
          'rgba(85,20,125,1)',
          'rgba(87,20,126,1)',
          'rgba(88,21,126,1)',
          'rgba(90,21,126,1)',
          'rgba(92,22,127,1)',
          'rgba(93,23,127,1)',
          'rgba(95,23,127,1)',
          'rgba(96,24,128,1)',
          'rgba(98,25,128,1)',
          'rgba(99,25,128,1)',
          'rgba(101,26,128,1)',
          'rgba(103,26,128,1)',
          'rgba(104,27,129,1)',
          'rgba(106,28,129,1)',
          'rgba(107,28,129,1)',
          'rgba(109,29,129,1)',
          'rgba(110,30,129,1)',
          'rgba(112,30,129,1)',
          'rgba(113,31,129,1)',
          'rgba(115,32,129,1)',
          'rgba(117,32,129,1)',
          'rgba(118,33,129,1)',
          'rgba(120,33,129,1)',
          'rgba(121,34,130,1)',
          'rgba(123,35,130,1)',
          'rgba(124,35,130,1)',
          'rgba(126,36,130,1)',
          'rgba(128,36,130,1)',
          'rgba(129,37,129,1)',
          'rgba(131,37,129,1)',
          'rgba(132,38,129,1)',
          'rgba(134,39,129,1)',
          'rgba(136,39,129,1)',
          'rgba(137,40,129,1)',
          'rgba(139,40,129,1)',
          'rgba(140,41,129,1)',
          'rgba(142,41,129,1)',
          'rgba(144,42,129,1)',
          'rgba(145,42,129,1)',
          'rgba(147,43,128,1)',
          'rgba(148,43,128,1)',
          'rgba(150,44,128,1)',
          'rgba(152,44,128,1)',
          'rgba(153,45,128,1)',
          'rgba(155,46,127,1)',
          'rgba(157,46,127,1)',
          'rgba(158,47,127,1)',
          'rgba(160,47,127,1)',
          'rgba(161,48,126,1)',
          'rgba(163,48,126,1)',
          'rgba(165,49,126,1)',
          'rgba(166,49,125,1)',
          'rgba(168,50,125,1)',
          'rgba(170,50,125,1)',
          'rgba(171,51,124,1)',
          'rgba(173,51,124,1)',
          'rgba(175,52,123,1)',
          'rgba(176,52,123,1)',
          'rgba(178,53,123,1)',
          'rgba(180,53,122,1)',
          'rgba(181,54,122,1)',
          'rgba(183,55,121,1)',
          'rgba(185,55,121,1)',
          'rgba(186,56,120,1)',
          'rgba(188,56,120,1)',
          'rgba(189,57,119,1)',
          'rgba(191,57,118,1)',
          'rgba(193,58,118,1)',
          'rgba(194,59,117,1)',
          'rgba(196,59,117,1)',
          'rgba(198,60,116,1)',
          'rgba(199,61,115,1)',
          'rgba(201,61,115,1)',
          'rgba(202,62,114,1)',
          'rgba(204,63,113,1)',
          'rgba(206,63,113,1)',
          'rgba(207,64,112,1)',
          'rgba(209,65,111,1)',
          'rgba(210,66,110,1)',
          'rgba(212,67,110,1)',
          'rgba(213,67,109,1)',
          'rgba(215,68,108,1)',
          'rgba(216,69,107,1)',
          'rgba(218,70,107,1)',
          'rgba(219,71,106,1)',
          'rgba(221,72,105,1)',
          'rgba(222,73,104,1)',
          'rgba(223,74,103,1)',
          'rgba(225,75,103,1)',
          'rgba(226,76,102,1)',
          'rgba(227,78,101,1)',
          'rgba(229,79,100,1)',
          'rgba(230,80,100,1)',
          'rgba(231,81,99,1)',
          'rgba(232,83,98,1)',
          'rgba(233,84,97,1)',
          'rgba(234,85,97,1)',
          'rgba(236,87,96,1)',
          'rgba(237,88,95,1)',
          'rgba(238,90,95,1)',
          'rgba(239,91,94,1)',
          'rgba(239,93,94,1)',
          'rgba(240,95,93,1)',
          'rgba(241,96,93,1)',
          'rgba(242,98,93,1)',
          'rgba(243,100,92,1)',
          'rgba(243,101,92,1)',
          'rgba(244,103,92,1)',
          'rgba(245,105,92,1)',
          'rgba(246,107,92,1)',
          'rgba(246,108,92,1)',
          'rgba(247,110,92,1)',
          'rgba(247,112,92,1)',
          'rgba(248,114,92,1)',
          'rgba(248,116,92,1)',
          'rgba(249,118,92,1)',
          'rgba(249,120,92,1)',
          'rgba(250,121,93,1)',
          'rgba(250,123,93,1)',
          'rgba(250,125,94,1)',
          'rgba(251,127,94,1)',
          'rgba(251,129,95,1)',
          'rgba(251,131,95,1)',
          'rgba(252,133,96,1)',
          'rgba(252,135,97,1)',
          'rgba(252,137,97,1)',
          'rgba(252,139,98,1)',
          'rgba(253,140,99,1)',
          'rgba(253,142,100,1)',
          'rgba(253,144,101,1)',
          'rgba(253,146,102,1)',
          'rgba(253,148,103,1)',
          'rgba(254,150,104,1)',
          'rgba(254,152,105,1)',
          'rgba(254,154,106,1)',
          'rgba(254,156,107,1)',
          'rgba(254,157,108,1)',
          'rgba(254,159,109,1)',
          'rgba(254,161,110,1)',
          'rgba(254,163,111,1)',
          'rgba(254,165,112,1)',
          'rgba(255,167,114,1)',
          'rgba(255,169,115,1)',
          'rgba(255,171,116,1)',
          'rgba(255,172,118,1)',
          'rgba(255,174,119,1)',
          'rgba(255,176,120,1)',
          'rgba(255,178,122,1)',
          'rgba(255,180,123,1)',
          'rgba(255,182,124,1)',
          'rgba(255,184,126,1)',
          'rgba(255,185,127,1)',
          'rgba(255,187,129,1)',
          'rgba(255,189,130,1)',
          'rgba(255,191,132,1)',
          'rgba(255,193,133,1)',
          'rgba(255,195,135,1)',
          'rgba(255,197,136,1)',
          'rgba(255,198,138,1)',
          'rgba(255,200,140,1)',
          'rgba(255,202,141,1)',
          'rgba(255,204,143,1)',
          'rgba(254,206,144,1)',
          'rgba(254,208,146,1)',
          'rgba(254,209,148,1)',
          'rgba(254,211,149,1)',
          'rgba(254,213,151,1)',
          'rgba(254,215,153,1)',
          'rgba(254,217,155,1)',
          'rgba(254,219,156,1)',
          'rgba(254,220,158,1)',
          'rgba(254,222,160,1)',
          'rgba(254,224,162,1)',
          'rgba(254,226,163,1)',
          'rgba(253,228,165,1)',
          'rgba(253,230,167,1)',
          'rgba(253,231,169,1)',
          'rgba(253,233,171,1)',
          'rgba(253,235,172,1)',
          'rgba(253,237,174,1)',
          'rgba(253,239,176,1)',
          'rgba(253,241,178,1)',
          'rgba(253,242,180,1)',
          'rgba(253,244,182,1)',
          'rgba(253,246,184,1)',
          'rgba(252,248,186,1)',
          'rgba(252,250,188,1)',
          'rgba(252,251,189,1)',
          'rgba(252,253,191,1)',
        ],
      },
      viridis: {
        name: 'viridis',
        value: [
          'rgba(68,1,84,1)',
          'rgba(68,2,85,1)',
          'rgba(69,3,87,1)',
          'rgba(69,5,88,1)',
          'rgba(69,6,90,1)',
          'rgba(70,8,91,1)',
          'rgba(70,9,93,1)',
          'rgba(70,11,94,1)',
          'rgba(70,12,96,1)',
          'rgba(71,14,97,1)',
          'rgba(71,15,98,1)',
          'rgba(71,17,100,1)',
          'rgba(71,18,101,1)',
          'rgba(71,20,102,1)',
          'rgba(72,21,104,1)',
          'rgba(72,22,105,1)',
          'rgba(72,24,106,1)',
          'rgba(72,25,108,1)',
          'rgba(72,26,109,1)',
          'rgba(72,28,110,1)',
          'rgba(72,29,111,1)',
          'rgba(72,30,112,1)',
          'rgba(72,32,113,1)',
          'rgba(72,33,115,1)',
          'rgba(72,34,116,1)',
          'rgba(72,36,117,1)',
          'rgba(72,37,118,1)',
          'rgba(72,38,119,1)',
          'rgba(72,39,120,1)',
          'rgba(71,41,121,1)',
          'rgba(71,42,121,1)',
          'rgba(71,43,122,1)',
          'rgba(71,44,123,1)',
          'rgba(71,46,124,1)',
          'rgba(70,47,125,1)',
          'rgba(70,48,126,1)',
          'rgba(70,49,126,1)',
          'rgba(70,51,127,1)',
          'rgba(69,52,128,1)',
          'rgba(69,53,129,1)',
          'rgba(69,54,129,1)',
          'rgba(68,56,130,1)',
          'rgba(68,57,131,1)',
          'rgba(68,58,131,1)',
          'rgba(67,59,132,1)',
          'rgba(67,60,132,1)',
          'rgba(67,62,133,1)',
          'rgba(66,63,133,1)',
          'rgba(66,64,134,1)',
          'rgba(65,65,134,1)',
          'rgba(65,66,135,1)',
          'rgba(65,67,135,1)',
          'rgba(64,69,136,1)',
          'rgba(64,70,136,1)',
          'rgba(63,71,136,1)',
          'rgba(63,72,137,1)',
          'rgba(62,73,137,1)',
          'rgba(62,74,137,1)',
          'rgba(61,75,138,1)',
          'rgba(61,77,138,1)',
          'rgba(60,78,138,1)',
          'rgba(60,79,138,1)',
          'rgba(59,80,139,1)',
          'rgba(59,81,139,1)',
          'rgba(58,82,139,1)',
          'rgba(58,83,139,1)',
          'rgba(57,84,140,1)',
          'rgba(57,85,140,1)',
          'rgba(56,86,140,1)',
          'rgba(56,87,140,1)',
          'rgba(55,88,140,1)',
          'rgba(55,89,140,1)',
          'rgba(54,91,141,1)',
          'rgba(54,92,141,1)',
          'rgba(53,93,141,1)',
          'rgba(53,94,141,1)',
          'rgba(52,95,141,1)',
          'rgba(52,96,141,1)',
          'rgba(51,97,141,1)',
          'rgba(51,98,141,1)',
          'rgba(51,99,141,1)',
          'rgba(50,100,142,1)',
          'rgba(50,101,142,1)',
          'rgba(49,102,142,1)',
          'rgba(49,103,142,1)',
          'rgba(48,104,142,1)',
          'rgba(48,105,142,1)',
          'rgba(47,106,142,1)',
          'rgba(47,107,142,1)',
          'rgba(47,108,142,1)',
          'rgba(46,109,142,1)',
          'rgba(46,110,142,1)',
          'rgba(45,111,142,1)',
          'rgba(45,112,142,1)',
          'rgba(45,112,142,1)',
          'rgba(44,113,142,1)',
          'rgba(44,114,142,1)',
          'rgba(43,115,142,1)',
          'rgba(43,116,142,1)',
          'rgba(43,117,142,1)',
          'rgba(42,118,142,1)',
          'rgba(42,119,142,1)',
          'rgba(41,120,142,1)',
          'rgba(41,121,142,1)',
          'rgba(41,122,142,1)',
          'rgba(40,123,142,1)',
          'rgba(40,124,142,1)',
          'rgba(40,125,142,1)',
          'rgba(39,126,142,1)',
          'rgba(39,127,142,1)',
          'rgba(38,128,142,1)',
          'rgba(38,129,142,1)',
          'rgba(38,130,142,1)',
          'rgba(37,131,142,1)',
          'rgba(37,131,142,1)',
          'rgba(37,132,142,1)',
          'rgba(36,133,142,1)',
          'rgba(36,134,142,1)',
          'rgba(35,135,142,1)',
          'rgba(35,136,142,1)',
          'rgba(35,137,142,1)',
          'rgba(34,138,141,1)',
          'rgba(34,139,141,1)',
          'rgba(34,140,141,1)',
          'rgba(33,141,141,1)',
          'rgba(33,142,141,1)',
          'rgba(33,143,141,1)',
          'rgba(32,144,141,1)',
          'rgba(32,145,140,1)',
          'rgba(32,146,140,1)',
          'rgba(32,147,140,1)',
          'rgba(31,147,140,1)',
          'rgba(31,148,140,1)',
          'rgba(31,149,139,1)',
          'rgba(31,150,139,1)',
          'rgba(31,151,139,1)',
          'rgba(30,152,139,1)',
          'rgba(30,153,138,1)',
          'rgba(30,154,138,1)',
          'rgba(30,155,138,1)',
          'rgba(30,156,137,1)',
          'rgba(30,157,137,1)',
          'rgba(30,158,137,1)',
          'rgba(30,159,136,1)',
          'rgba(30,160,136,1)',
          'rgba(31,161,136,1)',
          'rgba(31,162,135,1)',
          'rgba(31,163,135,1)',
          'rgba(31,163,134,1)',
          'rgba(32,164,134,1)',
          'rgba(32,165,134,1)',
          'rgba(33,166,133,1)',
          'rgba(33,167,133,1)',
          'rgba(34,168,132,1)',
          'rgba(35,169,131,1)',
          'rgba(35,170,131,1)',
          'rgba(36,171,130,1)',
          'rgba(37,172,130,1)',
          'rgba(38,173,129,1)',
          'rgba(39,174,129,1)',
          'rgba(40,175,128,1)',
          'rgba(41,175,127,1)',
          'rgba(42,176,127,1)',
          'rgba(43,177,126,1)',
          'rgba(44,178,125,1)',
          'rgba(46,179,124,1)',
          'rgba(47,180,124,1)',
          'rgba(48,181,123,1)',
          'rgba(50,182,122,1)',
          'rgba(51,183,121,1)',
          'rgba(53,183,121,1)',
          'rgba(54,184,120,1)',
          'rgba(56,185,119,1)',
          'rgba(57,186,118,1)',
          'rgba(59,187,117,1)',
          'rgba(61,188,116,1)',
          'rgba(62,189,115,1)',
          'rgba(64,190,114,1)',
          'rgba(66,190,113,1)',
          'rgba(68,191,112,1)',
          'rgba(70,192,111,1)',
          'rgba(72,193,110,1)',
          'rgba(73,194,109,1)',
          'rgba(75,194,108,1)',
          'rgba(77,195,107,1)',
          'rgba(79,196,106,1)',
          'rgba(81,197,105,1)',
          'rgba(83,198,104,1)',
          'rgba(85,198,102,1)',
          'rgba(88,199,101,1)',
          'rgba(90,200,100,1)',
          'rgba(92,201,99,1)',
          'rgba(94,201,98,1)',
          'rgba(96,202,96,1)',
          'rgba(98,203,95,1)',
          'rgba(101,204,94,1)',
          'rgba(103,204,92,1)',
          'rgba(105,205,91,1)',
          'rgba(108,206,90,1)',
          'rgba(110,206,88,1)',
          'rgba(112,207,87,1)',
          'rgba(115,208,85,1)',
          'rgba(117,208,84,1)',
          'rgba(119,209,82,1)',
          'rgba(122,210,81,1)',
          'rgba(124,210,79,1)',
          'rgba(127,211,78,1)',
          'rgba(129,212,76,1)',
          'rgba(132,212,75,1)',
          'rgba(134,213,73,1)',
          'rgba(137,213,72,1)',
          'rgba(139,214,70,1)',
          'rgba(142,215,68,1)',
          'rgba(144,215,67,1)',
          'rgba(147,216,65,1)',
          'rgba(149,216,63,1)',
          'rgba(152,217,62,1)',
          'rgba(155,217,60,1)',
          'rgba(157,218,58,1)',
          'rgba(160,218,57,1)',
          'rgba(163,219,55,1)',
          'rgba(165,219,53,1)',
          'rgba(168,220,51,1)',
          'rgba(171,220,50,1)',
          'rgba(173,221,48,1)',
          'rgba(176,221,46,1)',
          'rgba(179,221,45,1)',
          'rgba(181,222,43,1)',
          'rgba(184,222,41,1)',
          'rgba(187,223,39,1)',
          'rgba(189,223,38,1)',
          'rgba(192,223,36,1)',
          'rgba(195,224,35,1)',
          'rgba(197,224,33,1)',
          'rgba(200,225,32,1)',
          'rgba(203,225,30,1)',
          'rgba(205,225,29,1)',
          'rgba(208,226,28,1)',
          'rgba(211,226,27,1)',
          'rgba(213,226,26,1)',
          'rgba(216,227,25,1)',
          'rgba(219,227,24,1)',
          'rgba(221,227,24,1)',
          'rgba(224,228,24,1)',
          'rgba(226,228,24,1)',
          'rgba(229,228,24,1)',
          'rgba(232,229,25,1)',
          'rgba(234,229,25,1)',
          'rgba(237,229,26,1)',
          'rgba(239,230,27,1)',
          'rgba(242,230,28,1)',
          'rgba(244,230,30,1)',
          'rgba(247,230,31,1)',
          'rgba(249,231,33,1)',
          'rgba(251,231,35,1)',
          'rgba(254,231,36,1)',
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

  align: {
    name: 'Align',
    inlineOptions: {
      white: { name: 'Top', value: 'top' },
      lightGrey: { name: 'Bottom', value: 'bottom' },
    },
  },

  colorRangeGradient: {
    name: 'Color Gradient',
    inlineOptions: YES_NO,
  },

  dataTransform: {
    name: 'Transforms',
    inlineOptions: {
      default: { name: 'Default', value: 'default' },
      None: { name: 'None', value: 'None' },
    },
    generateOptions: (track) => {
      const inlineOptions = [];

      if (track.transforms) {
        for (const transform of track.transforms) {
          inlineOptions.push({
            name: transform.name,
            value: transform.value,
          });
        }
      }

      return inlineOptions;
    },
  },

  aggregationMode: {
    name: 'Aggregation Mode',
    inlineOptions: {},
    generateOptions: (track) => {
      const inlineOptions = [];

      if (track.aggregationModes) {
        Object.values(track.aggregationModes).forEach(({ name, value }) => {
          inlineOptions.push({ name, value });
        });
      } else {
        inlineOptions.push({ name: 'Default', value: 'default' });
      }

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
          const { maxWidth, binsPerDimension, maxZoom } = track;

          let maxResolutionSize = 1;
          let resolution = 1;

          if (track.resolutions) {
            const sortedResolutions = track.resolutions
              .map((x) => +x)
              .sort((a, b) => b - a);
            [maxResolutionSize] = sortedResolutions;
            resolution = sortedResolutions[i];
          } else {
            resolution = track.maxWidth / (2 ** i * track.binsPerDimension);
            maxResolutionSize = maxWidth / (2 ** maxZoom * binsPerDimension);
          }

          const pp = precisionPrefix(maxResolutionSize, resolution);
          const f = formatPrefix(`.${pp}`, resolution);
          const formattedResolution = f(resolution);

          inlineOptions.push({
            name: formattedResolution,
            value: i.toString(),
          });
          //
        }

        return inlineOptions;
      }
      return [];
    },
  },

  valueColumn: {
    name: 'Value column',
    inlineOptions: {
      none: { name: 'None', value: null },
    },
    generateOptions: valueColumnOptions,
  },
  zeroValueColor: {
    name: 'Zero Value Color',
    inlineOptions: AVAILABLE_COLORS,
  },
};

export default OPTIONS_INFO;
