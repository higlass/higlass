import {select} from 'd3-selection';

export const COG = {
  id: 'cog',
  paths: [
    'M466.895 305.125c-26.863-46.527-10.708-106.152 36.076-133.244l-50.313-87.146c-14.375 8.427-31.088 13.259-48.923 13.259-53.768 0-97.354-43.873-97.354-97.995h-100.629c0.133 16.705-4.037 33.641-12.979 49.126-26.862 46.528-86.578 62.351-133.431 35.379l-50.312 87.146c14.485 8.236 27.025 20.294 35.943 35.739 26.819 46.454 10.756 105.96-35.854 133.112l50.313 87.146c14.325-8.348 30.958-13.127 48.7-13.127 53.598 0 97.072 43.596 97.35 97.479h100.627c-0.043-16.537 4.136-33.285 12.983-48.609 26.818-46.453 86.388-62.297 133.207-35.506l50.313-87.145c-14.39-8.233-26.846-20.249-35.717-35.614zM256 359.666c-57.254 0-103.668-46.412-103.668-103.667 0-57.254 46.413-103.667 103.668-103.667s103.666 46.413 103.666 103.667c-0.001 57.255-46.412 103.667-103.666 103.667z'
  ],
  viewBox: '0 0 512 512'
};

export const CROSS = {
  id: 'cross',
  paths: [
    'M507.331 411.33c-0.002-0.002-0.004-0.004-0.006-0.005l-155.322-155.325 155.322-155.325c0.002-0.002 0.004-0.003 0.006-0.005 1.672-1.673 2.881-3.627 3.656-5.708 2.123-5.688 0.912-12.341-3.662-16.915l-73.373-73.373c-4.574-4.573-11.225-5.783-16.914-3.66-2.080 0.775-4.035 1.984-5.709 3.655 0 0.002-0.002 0.003-0.004 0.005l-155.324 155.326-155.324-155.325c-0.002-0.002-0.003-0.003-0.005-0.005-1.673-1.671-3.627-2.88-5.707-3.655-5.69-2.124-12.341-0.913-16.915 3.66l-73.374 73.374c-4.574 4.574-5.784 11.226-3.661 16.914 0.776 2.080 1.985 4.036 3.656 5.708 0.002 0.001 0.003 0.003 0.005 0.005l155.325 155.324-155.325 155.326c-0.001 0.002-0.003 0.003-0.004 0.005-1.671 1.673-2.88 3.627-3.657 5.707-2.124 5.688-0.913 12.341 3.661 16.915l73.374 73.373c4.575 4.574 11.226 5.784 16.915 3.661 2.080-0.776 4.035-1.985 5.708-3.656 0.001-0.002 0.003-0.003 0.005-0.005l155.324-155.325 155.324 155.325c0.002 0.001 0.004 0.003 0.006 0.004 1.674 1.672 3.627 2.881 5.707 3.657 5.689 2.123 12.342 0.913 16.914-3.661l73.373-73.374c4.574-4.574 5.785-11.227 3.662-16.915-0.776-2.080-1.985-4.034-3.657-5.707z'
  ],
  viewBox: '0 0 512 512'
};

export const ENLARGE = {
  id: 'enlarge',
  paths: [
    'M512 0h-208l80 80-96 96 48 48 96-96 80 80z',
    'M512 512v-208l-80 80-96-96-48 48 96 96-80 80z',
    'M0 512h208l-80-80 96-96-48-48-96 96-80-80z',
    'M0 0v208l80-80 96 96 48-48-96-96 80-80z'
  ],
  viewBox: '0 0 512 512'
};

export const MINUS = {
  id: 'minus',
  paths: [
    'M0 208v96c0 8.836 7.164 16 16 16h480c8.836 0 16-7.164 16-16v-96c0-8.836-7.164-16-16-16h-480c-8.836 0-16 7.164-16 16z'
  ],
  viewBox: '0 0 512 512'
};

export const MOVE = {
  id: 'move',
  paths: [
    'M512,260.096L405.5,161.79v49.155H301.061v-104.45h49.149L251.904,0L160.77,106.495h49.15v104.45H106.495V161.79L0,260.096l106.495,91.135v-49.149h104.45v104.45H161.79L251.904,512l98.306-106.5h-49.149V301.061H405.5v49.149L512,260.096z'
  ],
  viewBox: '0 0 512 512'
};

export const PLAY = {
  id: 'play',
  paths: [
    'M96 64l320 192-320 192z'
  ],
  viewBox: '0 0 512 512'
};

export const PLUS = {
  id: 'plus',
  paths: [
    'M496 192h-176v-176c0-8.836-7.164-16-16-16h-96c-8.836 0-16 7.164-16 16v176h-176c-8.836 0-16 7.164-16 16v96c0 8.836 7.164 16 16 16h176v176c0 8.836 7.164 16 16 16h96c8.836 0 16-7.164 16-16v-176h176c8.836 0 16-7.164 16-16v-96c0-8.836-7.164-16-16-16z'
  ],
  viewBox: '0 0 512 512'
};

export const CONTENT_COPY = {
  id: "copy",
  paths: ["M607.5 672v-448.5h-351v448.5h351zM607.5 160.5c34.5 0 64.5 28.5 64.5 63v448.5c0 34.5-30 64.5-64.5 64.5h-351c-34.5 0-64.5-30-64.5-64.5v-448.5c0-34.5 30-63 64.5-63h351zM511.5 31.5v64.5h-384v448.5h-63v-448.5c0-34.5 28.5-64.5 63-64.5h384z"],
  viewBox: '0 0 712 712'
}

export const TRACK_LINE = {
  id: "trackLine",
  paths: ["M60 20 L50 52 L40 26 L34 46 L24 30 L14 50 L4 12"],
  viewBox: '0 0 60 60'
}

export const all = [
  COG,
  CROSS,
  ENLARGE,
  MINUS,
  MOVE,
  PLAY,
  PLUS,
  CONTENT_COPY
];

let parser = new DOMParser();

let horizontalLineStr = `
<svg width="20px" height="20px" viewBox="0 0 135 85" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <title>line</title>
    <defs></defs>
    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <polyline id="Path" stroke="#4990E2" stroke-width="8" points="2 45.5625 20.7460938 6.3359375 36.828125 86.6484375 59.8945312 17.5742188 79.0390625 70.703125 99.9335938 27 112.769531 81.1601562 132.078125 3"></polyline>
    </g>
</svg>
`

export const svgHorizontalLineIcon = parser.parseFromString(horizontalLineStr, 'text/xml').documentElement;
export const svgVerticalLineIcon = select(parser.parseFromString(horizontalLineStr, 'text/xml').documentElement)
                                                .style('transform', 'rotate(90deg)')
                                                .node();

let tiles2DIconStr = `
<svg width="20px" height="20px" viewBox="0 0 60 60" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 41 (35326) - http://www.bohemiancoding.com/sketch -->
    <title>2d-tiles-icon</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <rect id="tiles2DIconStr-path-1" x="0" y="0" width="30" height="30"></rect>
        <mask id="tiles2DIconStr-mask-2" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="30" height="30" fill="white">
            <use xlink:href="#tiles2DIconStr-path-1"></use>
        </mask>
        <rect id="tiles2DIconStr-path-3" x="0" y="30" width="30" height="30"></rect>
        <mask id="tiles2DIconStr-mask-4" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="30" height="30" fill="white">
            <use xlink:href="#tiles2DIconStr-path-3"></use>
        </mask>
        <rect id="tiles2DIconStr-path-5" x="30" y="0" width="30" height="30"></rect>
        <mask id="tiles2DIconStr-mask-6" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="30" height="30" fill="white">
            <use xlink:href="#tiles2DIconStr-path-5"></use>
        </mask>
        <rect id="tiles2DIconStr-path-7" x="30" y="30" width="30" height="30"></rect>
        <mask id="tiles2DIconStr-mask-8" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="30" height="30" fill="white">
            <use xlink:href="#tiles2DIconStr-path-7"></use>
        </mask>
    </defs>
    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <use id="Rectangle" stroke="#979797" mask="url(#tiles2DIconStr-mask-2)" stroke-width="6" fill="#EEE0E0" xlink:href="#tiles2DIconStr-path-1"></use>
        <use id="Rectangle" stroke="#979797" mask="url(#tiles2DIconStr-mask-4)" stroke-width="6" fill="#EEE0E0" xlink:href="#tiles2DIconStr-path-3"></use>
        <use id="Rectangle" stroke="#979797" mask="url(#tiles2DIconStr-mask-6)" stroke-width="6" fill="#EEE0E0" xlink:href="#tiles2DIconStr-path-5"></use>
        <use id="Rectangle" stroke="#979797" mask="url(#tiles2DIconStr-mask-8)" stroke-width="6" fill="#EEE0E0" xlink:href="#tiles2DIconStr-path-7"></use>
    </g>
</svg>
`

export const svg2DTilesIcon = parser.parseFromString(tiles2DIconStr, 'text/xml').documentElement;

let heatmap2DStr = `
<svg width="20px" height="20px" viewBox="0 0 90 90" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 41 (35326) - http://www.bohemiancoding.com/sketch -->
    <title>2d-heatmap</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <rect id="heatmap2DStr-path-1" x="0" y="0" width="30" height="30"></rect>
        <rect id="heatmap2DStr-path-2" x="30" y="0" width="30" height="30"></rect>
        <rect id="heatmap2DStr-path-3" x="60" y="0" width="30" height="30"></rect>
        <rect id="heatmap2DStr-path-4" x="0" y="30" width="30" height="30"></rect>
        <rect id="heatmap2DStr-path-5" x="30" y="30" width="30" height="30"></rect>
        <rect id="heatmap2DStr-path-6" x="60" y="30" width="30" height="30"></rect>
        <rect id="heatmap2DStr-path-7" x="0" y="60" width="30" height="30"></rect>
        <rect id="heatmap2DStr-path-8" x="30" y="60" width="30" height="30"></rect>
        <rect id="heatmap2DStr-path-9" x="60" y="60" width="30" height="30"></rect>
    </defs>
    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <use id="Rectangle" fill="#858372" xlink:href="#heatmap2DStr-path-1"></use>
        <use id="Rectangle" fill="#BBBAA4" xlink:href="#heatmap2DStr-path-2"></use>
        <use id="Rectangle" fill="#ECECD5" xlink:href="#heatmap2DStr-path-3"></use>
        <use id="Rectangle" fill="#BCBD9E" xlink:href="#heatmap2DStr-path-4"></use>
        <use id="Rectangle" fill="#817C7C" xlink:href="#heatmap2DStr-path-5"></use>
        <use id="Rectangle" fill="#BBBAA4" xlink:href="#heatmap2DStr-path-6"></use>
        <use id="Rectangle" fill="#ECECD5" xlink:href="#heatmap2DStr-path-7"></use>
        <use id="Rectangle" fill="#BBBAA4" xlink:href="#heatmap2DStr-path-8"></use>
        <use id="Rectangle" fill="#7B7777" xlink:href="#heatmap2DStr-path-9"></use>
    </g>
</svg>
`

export const svg2DHeatmapIcon = parser.parseFromString(heatmap2DStr, 'text/xml').documentElement;

let axis1D = `
<svg width="20px" height="20px" viewBox="0 0 77 33" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 41 (35326) - http://www.bohemiancoding.com/sketch -->
    <title>axis-1d</title>
    <desc>Created with Sketch.</desc>
    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <polyline id="Path" stroke="#979797" stroke-width="8" transform="translate(38.258485, 27.557860) scale(1, -1) translate(-38.258485, -27.557860) " points="4 27.05786 36.7512307 27.05786 72.5169695 27.05786"></polyline>
        <path d="M38,24.484375 L38,3" id="Path-2" stroke="#979797" stroke-width="4"></path>
    </g>
</svg>
`

export const svg1DAxisIcon = parser.parseFromString(axis1D, 'text/xml').documentElement;
export const svgVertical1DAxisIcon = select(parser.parseFromString(axis1D, 'text/xml').documentElement)
                                                .style('transform', 'rotate(90deg)')
                                                .node();

let geneAnnotations = `
<svg width="20px" height="20px" viewBox="0 0 171 116" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 41 (35326) - http://www.bohemiancoding.com/sketch -->
    <title>gene-annotations</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <rect id="geneAnnotations-path-1" x="34" y="0" width="24" height="116"></rect>
        <mask id="geneAnnotations-mask-2" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="24" height="116" fill="white">
            <use xlink:href="#geneAnnotations-path-1"></use>
        </mask>
        <rect id="geneAnnotations-path-3" x="80" y="0" width="56" height="116"></rect>
        <mask id="geneAnnotations-mask-4" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="56" height="116" fill="white">
            <use xlink:href="#geneAnnotations-path-3"></use>
        </mask>
        <rect id="geneAnnotations-path-5" x="147" y="40" width="24" height="35"></rect>
        <mask id="geneAnnotations-mask-6" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="24" height="35" fill="white">
            <use xlink:href="#geneAnnotations-path-5"></use>
        </mask>
    </defs>
    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <path d="M12.71875,58 L147.10172,58" id="Path" stroke="#979797" stroke-width="8"></path>
        <use id="Rectangle" stroke="#979797" mask="url(#geneAnnotations-mask-2)" stroke-width="4" fill="#DDDD66" xlink:href="#geneAnnotations-path-1"></use>
        <use id="Rectangle" stroke="#979797" mask="url(#geneAnnotations-mask-4)" stroke-width="4" fill="#DDDD66" xlink:href="#geneAnnotations-path-3"></use>
        <use id="Rectangle" stroke="#979797" mask="url(#geneAnnotations-mask-6)" stroke-width="4" fill="#DDDD66" xlink:href="#geneAnnotations-path-5"></use>
        <polygon id="Triangle" stroke="#979797" fill="#D8D8D8" points="25 57.5 1 75 1 40"></polygon>
    </g>
</svg>
`

export const svgGeneAnnotationsIcon = parser.parseFromString(geneAnnotations, 'text/xml').documentElement;
export const svgVerticalGeneAnnotationsIcon = select(parser.parseFromString(geneAnnotations, 'text/xml').documentElement)
                                                .style('transform', 'rotate(90deg)')
                                                .node();

let tiles1DIconStr = `
<svg width="20px" height="20px" viewBox="0 0 180 90" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 42 (36781) - http://www.bohemiancoding.com/sketch -->
    <title>1d-tiles-icon</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <rect id="tiles1DIconStr-path-1" x="0" y="0" width="90" height="90"></rect>
        <mask id="tiles1DIconStr-mask-2" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="90" height="90" fill="white">
            <use xlink:href="#tiles1DIconStr-path-1"></use>
        </mask>
        <rect id="tiles1DIconStr-path-3" x="90" y="0" width="90" height="90"></rect>
        <mask id="tiles1DIconStr-mask-4" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="90" height="90" fill="white">
            <use xlink:href="#tiles1DIconStr-path-3"></use>
        </mask>
    </defs>
    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <use id="Rectangle" stroke="#979797" mask="url(#tiles1DIconStr-mask-2)" stroke-width="12" fill="#E6D5D5" xlink:href="#tiles1DIconStr-path-1"></use>
        <use id="Rectangle" stroke="#979797" mask="url(#tiles1DIconStr-mask-4)" stroke-width="12" fill="#E6D5D5" xlink:href="#tiles1DIconStr-path-3"></use>
    </g>
</svg>
`

export const svg1DTilesIcon = parser.parseFromString(tiles1DIconStr, 'text/xml').documentElement;
export const svgVertical1DTilesIcon = select(parser.parseFromString(tiles1DIconStr, 'text/xml').documentElement)
                                                .style('transform', 'rotate(90deg)')
                                                .node();

let arrowHeadDomainsStr = `
<svg width="20px" height="20px" viewBox="0 0 111 111" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 42 (36781) - http://www.bohemiancoding.com/sketch -->
    <title>arrowhead-domains</title>
    <desc>Created with Sketch.</desc>
    <defs>
        <rect id="arrowHeadDomainsStr-path-1" x="0" y="0" width="90" height="90"></rect>
        <mask id="arrowHeadDomainsStr-mask-2" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="90" height="90" fill="white">
            <use xlink:href="#arrowHeadDomainsStr-path-1"></use>
        </mask>
        <rect id="arrowHeadDomainsStr-path-3" x="52" y="52" width="59" height="59"></rect>
        <mask id="arrowHeadDomainsStr-mask-4" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="59" height="59" fill="white">
            <use xlink:href="#arrowHeadDomainsStr-path-3"></use>
        </mask>
    </defs>
    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" fill-opacity="0">
        <use id="Rectangle" stroke="#979797" mask="url(#arrowHeadDomainsStr-mask-2)" stroke-width="22" fill="#D8D8D8" xlink:href="#arrowHeadDomainsStr-path-1"></use>
        <use id="Rectangle" stroke="#979797" mask="url(#arrowHeadDomainsStr-mask-4)" stroke-width="22" fill="#D8D8D8" xlink:href="#arrowHeadDomainsStr-path-3"></use>
    </g>
</svg>
`

export const svgArrowheadDomainsIcon = parser.parseFromString(arrowHeadDomainsStr, 'text/xml').documentElement;

