export const tracksInfo = [
    {
        type: 'left-axis',
        datatype: ['axis'],
        local: true,
        orientation: '1d-vertical',
        name: 'Left Axis'
    },
    {
        type: 'top-axis',
        datatype: ['axis'],
        local: true,
        orientation: '1d-horizontal',
        name: 'Top Axis'
    },
    {
        type: 'heatmap',
        datatype: ['matrix'],
        local: false,
        orientation: '2d'
    },
    {
        type: 'horizontal-line',
        datatype: ['vector'],
        local: false,
        orientation: '1d-horizontal'
    },
    {
        type: 'vertical-line',
        datatype: ['vector'],
        local: false,
        orientation: '1d-vertical'
    },
    {
        type: 'horizontal-1d-tiles',
        datatype: ['vector', 'stacked-interval'],
        local: false,
        orientation: '1d-horizontal',
        name: 'Horizontal 1D Tile Outlines'
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
        name: '2D Tile Outlines'
    },
    {
        type: 'horizontal-cnv-interval',
        datatype: ['stacked-interval'],
        local: false,
        orientation: '1d-horizontal'
    },
    {
        type: 'combined',
        datatype: 'any',
        local: true,
        orientation: 'any'
    }
]

