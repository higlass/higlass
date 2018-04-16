import { select } from 'd3-selection';

export const COG = {
  id: 'cog',
  paths: [
    'M466.895 305.125c-26.863-46.527-10.708-106.152 36.076-133.244l-50.313-87.146c-14.375 8.427-31.088 13.259-48.923 13.259-53.768 0-97.354-43.873-97.354-97.995h-100.629c0.133 16.705-4.037 33.641-12.979 49.126-26.862 46.528-86.578 62.351-133.431 35.379l-50.312 87.146c14.485 8.236 27.025 20.294 35.943 35.739 26.819 46.454 10.756 105.96-35.854 133.112l50.313 87.146c14.325-8.348 30.958-13.127 48.7-13.127 53.598 0 97.072 43.596 97.35 97.479h100.627c-0.043-16.537 4.136-33.285 12.983-48.609 26.818-46.453 86.388-62.297 133.207-35.506l50.313-87.145c-14.39-8.233-26.846-20.249-35.717-35.614zM256 359.666c-57.254 0-103.668-46.412-103.668-103.667 0-57.254 46.413-103.667 103.668-103.667s103.666 46.413 103.666 103.667c-0.001 57.255-46.412 103.667-103.666 103.667z',
  ],
  viewBox: '0 0 512 512',
};

export const CROSS = {
  id: 'cross',
  paths: [
    'M507.331 411.33c-0.002-0.002-0.004-0.004-0.006-0.005l-155.322-155.325 155.322-155.325c0.002-0.002 0.004-0.003 0.006-0.005 1.672-1.673 2.881-3.627 3.656-5.708 2.123-5.688 0.912-12.341-3.662-16.915l-73.373-73.373c-4.574-4.573-11.225-5.783-16.914-3.66-2.080 0.775-4.035 1.984-5.709 3.655 0 0.002-0.002 0.003-0.004 0.005l-155.324 155.326-155.324-155.325c-0.002-0.002-0.003-0.003-0.005-0.005-1.673-1.671-3.627-2.88-5.707-3.655-5.69-2.124-12.341-0.913-16.915 3.66l-73.374 73.374c-4.574 4.574-5.784 11.226-3.661 16.914 0.776 2.080 1.985 4.036 3.656 5.708 0.002 0.001 0.003 0.003 0.005 0.005l155.325 155.324-155.325 155.326c-0.001 0.002-0.003 0.003-0.004 0.005-1.671 1.673-2.88 3.627-3.657 5.707-2.124 5.688-0.913 12.341 3.661 16.915l73.374 73.373c4.575 4.574 11.226 5.784 16.915 3.661 2.080-0.776 4.035-1.985 5.708-3.656 0.001-0.002 0.003-0.003 0.005-0.005l155.324-155.325 155.324 155.325c0.002 0.001 0.004 0.003 0.006 0.004 1.674 1.672 3.627 2.881 5.707 3.657 5.689 2.123 12.342 0.913 16.914-3.661l73.373-73.374c4.574-4.574 5.785-11.227 3.662-16.915-0.776-2.080-1.985-4.034-3.657-5.707z',
  ],
  viewBox: '0 0 512 512',
};

export const ENLARGE = {
  id: 'enlarge',
  paths: [
    'M512 0h-208l80 80-96 96 48 48 96-96 80 80z',
    'M512 512v-208l-80 80-96-96-48 48 96 96-80 80z',
    'M0 512h208l-80-80 96-96-48-48-96 96-80-80z',
    'M0 0v208l80-80 96 96 48-48-96-96 80-80z',
  ],
  viewBox: '0 0 512 512',
};

export const MINUS = {
  id: 'minus',
  paths: [
    'M0 208v96c0 8.836 7.164 16 16 16h480c8.836 0 16-7.164 16-16v-96c0-8.836-7.164-16-16-16h-480c-8.836 0-16 7.164-16 16z',
  ],
  viewBox: '0 0 512 512',
};

export const BROKEN_LINK = {
  id: 'broken-link',
  paths: [
    'M9.365 6.635c1.197 1.198 1.274 3.1.228 4.387-.146.18-.065.09-1.99 2.016-1.283 1.282-3.358 1.283-4.64 0-1.283-1.282-1.284-3.358 0-4.64.767-.77 1.214-1.217 1.485-1.488.175-.174.477-.055.48.192.005.3.042.596.11.887.024.093-.005.193-.074.26L3.89 9.327c-.768.768-.77 2.013 0 2.784.768.768 2.013.77 2.784 0l1.762-1.762c.767-.767.77-2.016 0-2.785-.155-.156-.336-.284-.534-.38-.11-.052-.17-.17-.154-.29.032-.26.148-.512.347-.712l.103-.102c.085-.085.215-.107.322-.053.305.153.59.356.845.61zm3.673-3.673c-1.283-1.284-3.358-1.282-4.64 0-1.926 1.925-1.845 1.835-1.99 2.016-1.047 1.286-.97 3.19.227 4.386.254.254.54.458.845.61.107.055.237.032.322-.053l.103-.1c.2-.2.315-.453.347-.714.015-.12-.045-.237-.154-.29-.198-.095-.38-.224-.534-.38-.77-.768-.767-2.017 0-2.784L9.326 3.89c.77-.77 2.016-.768 2.784 0 .77.77.768 2.016 0 2.784l-1.074 1.074c-.07.07-.098.168-.075.263.07.29.107.59.112.887.003.248.305.367.48.192L13.038 7.6c1.283-1.283 1.282-3.36 0-4.64z',
    'M11 12.25c0-.138-.112-.25-.25-.25h-.5c-.138 0-.25.112-.25.25v2.5c0 .138.112.25.25.25h.5c.138 0 .25-.112.25-.25v-2.5zM15 10.25c0-.138-.112-.25-.25-.25h-2.5c-.138 0-.25.112-.25.25v.5c0 .138.112.25.25.25h2.5c.138 0 .25-.112.25-.25v-.5zM4 5.25C4 5.112 3.888 5 3.75 5h-2.5c-.138 0-.25.112-.25.25v.5c0 .138.112.25.25.25h2.5c.138 0 .25-.112.25-.25v-.5zM6 1.25C6 1.112 5.888 1 5.75 1h-.5c-.138 0-.25.112-.25.25v2.5c0 .138.112.25.25.25h.5c.138 0 .25-.112.25-.25v-2.5z'
  ],
  viewBox: '0 0 16 16',
};

export const MOVE = {
  id: 'move',
  paths: [
    'M512,260.096L405.5,161.79v49.155H301.061v-104.45h49.149L251.904,0L160.77,106.495h49.15v104.45H106.495V161.79L0,260.096l106.495,91.135v-49.149h104.45v104.45H161.79L251.904,512l98.306-106.5h-49.149V301.061H405.5v49.149L512,260.096z',
  ],
  viewBox: '0 0 512 512',
};

export const PLAY = {
  id: 'play',
  paths: [
    'M96 64l320 192-320 192z',
  ],
  viewBox: '0 0 512 512',
};

export const PLUS = {
  id: 'plus',
  paths: [
    'M496 192h-176v-176c0-8.836-7.164-16-16-16h-96c-8.836 0-16 7.164-16 16v176h-176c-8.836 0-16 7.164-16 16v96c0 8.836 7.164 16 16 16h176v176c0 8.836 7.164 16 16 16h96c8.836 0 16-7.164 16-16v-176h176c8.836 0 16-7.164 16-16v-96c0-8.836-7.164-16-16-16z',
  ],
  viewBox: '0 0 512 512',
};

export const CONTENT_COPY = {
  id: 'copy',
  paths: ['M607.5 672v-448.5h-351v448.5h351zM607.5 160.5c34.5 0 64.5 28.5 64.5 63v448.5c0 34.5-30 64.5-64.5 64.5h-351c-34.5 0-64.5-30-64.5-64.5v-448.5c0-34.5 30-63 64.5-63h351zM511.5 31.5v64.5h-384v448.5h-63v-448.5c0-34.5 28.5-64.5 63-64.5h384z'],
  viewBox: '0 0 712 712',
};

export const TRACK_LINE = {
  id: 'trackLine',
  paths: ['M60 20 L50 52 L40 26 L34 46 L24 30 L14 50 L4 12'],
  viewBox: '0 0 60 60',
};

export const RESET = {
  id: 'reset',
  viewBox: '-2 -2 20 20',
  paths: ['M15.29 8.145c-.392-.05-.747.24-.8.63-.172 1.463-.833 2.807-1.872 3.847-2.552 2.552-6.723 2.568-9.275.017-.24-.24-.476-.512-.68-.785l.968.02c.412 0 .734-.324.717-.718 0-.407-.323-.73-.714-.714l-3.37-.03-.17 3.535c-.017.223.066.41.202.548.12.117.29.186.48.2.39.018.73-.29.747-.678l.103-1.157c.204.272.442.545.698.798 3.113 3.114 8.2 3.133 11.333 0 1.275-1.274 2.058-2.908 2.28-4.697.036-.407-.237-.78-.646-.815zM.26 7.515c.104.103.258.188.41.204.392.05.768-.222.82-.614.186-1.445.833-2.74 1.853-3.76 2.553-2.553 6.723-2.57 9.292 0 .22.22.426.458.613.715l-.972-.018c-.407 0-.73.323-.714.716.002.204.086.39.204.508.138.138.31.206.51.206l3.372.033.152-3.487c.017-.39-.29-.735-.682-.75-.39-.018-.73.29-.75.68l-.05 1.14c-.203-.27-.408-.51-.647-.747-3.113-3.113-8.2-3.132-11.332 0C1.098 3.585.296 5.168.075 6.92c-.05.223.034.445.186.597z']
};

export const SELECT = {
  id: 'select',
  viewBox: '0 0 16 16',
  paths: ['M2 14h2v1H1v-3h1v2zm8 1H6v-1h4v1zm5 0h-3v-1h2v-2h1v3zm0-5h-1V6h1v4zM2 10H1V6h1v4zm13-6h-1V2h-2V1h3v3zM4 2H2v2H1V1h3v1zm6 0H6V1h4.03L10 2z'],
};

export const all = [
  COG,
  CROSS,
  ENLARGE,
  MINUS,
  MOVE,
  PLAY,
  PLUS,
  CONTENT_COPY,
  SELECT,
];

const parser = new DOMParser();

const horizontalLineStr = `
<svg width="20px" height="20px" viewBox="0 0 135 85" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <title>line</title>
    <defs></defs>
    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <polyline id="Path" stroke="#4990E2" stroke-width="8" points="2 45.5625 20.7460938 6.3359375 36.828125 86.6484375 59.8945312 17.5742188 79.0390625 70.703125 99.9335938 27 112.769531 81.1601562 132.078125 3"></polyline>
    </g>
</svg>
`;

export const svgHorizontalLineIcon = parser.parseFromString(horizontalLineStr, 'text/xml').documentElement;
export const svgVerticalLineIcon = select(parser.parseFromString(horizontalLineStr, 'text/xml').documentElement)
  .style('transform', 'rotate(90deg)')
  .node();

const tiles2DIconStr = `
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
`;

export const svg2DTilesIcon = parser.parseFromString(tiles2DIconStr, 'text/xml').documentElement;

const heatmap2DStr = `
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
`;

export const svg2DHeatmapIcon = parser.parseFromString(heatmap2DStr, 'text/xml').documentElement;

const axis1D = `
<svg width="20px" height="20px" viewBox="0 0 77 33" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <!-- Generator: Sketch 41 (35326) - http://www.bohemiancoding.com/sketch -->
    <title>axis-1d</title>
    <desc>Created with Sketch.</desc>
    <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <polyline id="Path" stroke="#979797" stroke-width="8" transform="translate(38.258485, 27.557860) scale(1, -1) translate(-38.258485, -27.557860) " points="4 27.05786 36.7512307 27.05786 72.5169695 27.05786"></polyline>
        <path d="M38,24.484375 L38,3" id="Path-2" stroke="#979797" stroke-width="4"></path>
    </g>
</svg>
`;

export const svg1DAxisIcon = parser.parseFromString(axis1D, 'text/xml').documentElement;
export const svgVertical1DAxisIcon = select(parser.parseFromString(axis1D, 'text/xml').documentElement)
  .style('transform', 'rotate(90deg)')
  .node();

const geneAnnotations = `
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
`;

export const svgGeneAnnotationsIcon = parser.parseFromString(geneAnnotations, 'text/xml').documentElement;
export const svgVerticalGeneAnnotationsIcon = select(parser.parseFromString(geneAnnotations, 'text/xml').documentElement)
  .style('transform', 'rotate(90deg)')
  .node();

const tiles1DIconStr = `
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
`;

export const svg1DTilesIcon = parser.parseFromString(tiles1DIconStr, 'text/xml').documentElement;
export const svgVertical1DTilesIcon = select(parser.parseFromString(tiles1DIconStr, 'text/xml').documentElement)
  .style('transform', 'rotate(90deg)')
  .node();

const arrowHeadDomainsStr = `
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
`;

export const svgArrowheadDomainsIcon = parser.parseFromString(arrowHeadDomainsStr, 'text/xml').documentElement;

const insetsStr = '<svg width="20px" height="20px" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="1.414"><path d="M6 26v6H0v-6h6zm-1 1H1v4h4v-4z" fill="#666"/><path d="M4.5 26.086l5.793-5.793 1.414 1.414L5.914 27.5z"/><path d="M32 0v22H10V0h22zm-2 2H12v18h18V2z"/><path fill="#262626" d="M18 8h6v6h-6z"/><path fill="#737373" d="M18 2h6v6h-6zM24 8h6v6h-6zM18 14h6v6h-6z"/><path fill="#BFBFBF" d="M12 14h6v6h-6zM24 14h6v6h-6zM24 2h6v6h-6zM12 2h6v6h-6z"/><path fill="#737373" d="M12 8h6v6h-6z"/></svg>';

export const svgInsetsIcon = parser.parseFromString(insetsStr, 'text/xml').documentElement;
