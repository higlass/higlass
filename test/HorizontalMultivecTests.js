// @ts-nocheck
/* eslint-env mocha */
import Enzyme from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import { expect } from 'chai';

import { select } from 'd3-selection';
import ReactDOM from 'react-dom';

// Utils
import {
  mountHGComponent,
  removeHGComponent,
} from '../app/scripts/test-helpers';
import { getTrackObjectFromHGC } from '../app/scripts/utils';

// View configs
import horizontalMultivecWithSmallerDimensions from './view-configs-more/horizontalMultivecWithSmallerDimensions.json';
import horizontalMultivecWithZeroValueColorOption from './view-configs-more/horizontalMultivecWithZeroValueColorOption.json';
import horizontalMultivecWithFilteredRows from './view-configs-more/horizontalMultivecWithFilteredRows.json';
import horizontalMultivecWithAggregation from './view-configs-more/horizontalMultivecWithAggregation.json';

// Constants
import {
  MIN_HORIZONTAL_HEIGHT,
  MIN_VERTICAL_WIDTH,
} from '../app/scripts/configs';

Enzyme.configure({ adapter: new Adapter() });

describe('Horizontal multivecs', () => {
  let hgc = null;
  let div = null;

  before((done) => {
    [div, hgc] = mountHGComponent(div, hgc, viewConf1, done, {
      style: 'width:800px; height:400px; background-color: lightgreen',
      bounded: true,
    });
  });

  // it('not have errors in the loaded viewconf', (done) => {
  //   done();
  // });

  it('Test horizontal multivec with track containing smaller-than-default width and height', (done) => {
    [div, hgc] = mountHGComponent(
      div,
      hgc,
      horizontalMultivecWithSmallerDimensions,
      () => {
        const track = getTrackObjectFromHGC(
          hgc.instance(),
          'viewConf2_uid',
          'K_0GxgCvQfCHM56neOnHKg',
        ); // uuid of horizontal-multivec
        const width = track.dimensions[0];
        const height = track.dimensions[1];
        if (height === MIN_HORIZONTAL_HEIGHT || width === MIN_VERTICAL_WIDTH)
          return;
        done();
      },
      {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: true,
      },
    );
  });

  it('has a colorbar', () => {
    const track = getTrackObjectFromHGC(
      hgc.instance(),
      'viewConf2_uid',
      'K_0GxgCvQfCHM56neOnHKg',
    ); // uuid of horizontal-multivec
    expect(track.pColorbarArea.x).to.be.lessThan(track.dimensions[0] / 2);

    const selection = select(div).selectAll('.selection');

    // we expect one colorbar selector brush to be present
    expect(selection.size()).to.equal(1);
  });

  it('hides the colorbar', () => {
    const { views } = hgc.instance().state;

    const track = getTrackObjectFromHGC(
      hgc.instance(),
      'viewConf2_uid',
      'K_0GxgCvQfCHM56neOnHKg',
    ); // uuid of horizontal-multivec
    track.options.colorbarPosition = 'hidden';

    hgc.instance().setState({ views });

    // eslint-disable-next-line react/no-find-dom-node
    const selection = select(ReactDOM.findDOMNode(hgc.instance())).selectAll(
      '.selection',
    );

    // we expect the colorbar selector brush to be hidden,
    // and therefore not present
    expect(selection.size()).to.equal(0);

    track.options.colorbarPosition = 'topLeft';
    hgc.instance().setState({ views });
  });

  it('Test horizontal multivec with null zero value color option', (done) => {
    [div, hgc] = mountHGComponent(
      div,
      hgc,
      horizontalMultivecWithZeroValueColorOption,
      () => {
        const track = getTrackObjectFromHGC(
          hgc.instance(),
          'view-0',
          'horizontal-multivec-track-0',
        ); // uuid of horizontal-multivec
        const trackTiles = track.visibleAndFetchedTiles();
        expect(trackTiles.length).to.equal(1);

        const zeroCellCoords = [79, 184];
        const tooltipValue = track.getVisibleData(
          zeroCellCoords[0],
          zeroCellCoords[1],
        );
        // The data at this coordinate should correspond to this particular zero value.
        expect(tooltipValue).to.equal(
          '0.000<br/>Homo sapiens	CHIP-SEQ ANALYSIS OF H3K27AC IN' +
            ' HUMAN INFERIOR TEMPORAL LOBE CELLS; DNA_LIB 1053	G' +
            'SM1112812	GSE17312	None	Inferior Temporal Lobe Cel' +
            'l	Brain	Active Motif, 39133, 31610003	H3K27ac	hm	No' +
            'rmal',
        );

        const canvas = trackTiles[0].canvas;
        const ctx = canvas.getContext('2d');

        expect(canvas.width).to.equal(256);
        expect(canvas.height).to.equal(228);
        expect(track.dimensions[0]).to.equal(805);
        expect(track.dimensions[1]).to.equal(370);

        // Need to scale from screen coordinates to dataset coordinates.
        const scaledCoord = [
          Math.ceil((zeroCellCoords[0] / track.dimensions[0]) * canvas.width),
          Math.floor((zeroCellCoords[1] / track.dimensions[1]) * canvas.height),
        ];
        // Obtain the color at this pixel on the canvas.
        const pixel = ctx.getImageData(
          scaledCoord[0],
          scaledCoord[1],
          canvas.width,
          canvas.height,
        ).data;

        // Pixel should be slightly yellow.
        expect(pixel[0]).to.equal(255); // r
        expect(pixel[1]).to.equal(255); // g
        expect(pixel[2]).to.equal(247); // b // 247, for the faint yellow color.
        expect(pixel[3]).to.equal(255); // a

        done();
      },
      {
        style: 'width:1000px; height:1000px; background-color: lightgreen',
      },
    );
  });

  it('Test horizontal multivec with blue zero value color option', (done) => {
    horizontalMultivecWithZeroValueColorOption.views[0].tracks.center[0].options.zeroValueColor =
      'blue';

    [div, hgc] = mountHGComponent(
      div,
      hgc,
      horizontalMultivecWithZeroValueColorOption,
      () => {
        const track = getTrackObjectFromHGC(
          hgc.instance(),
          'view-0',
          'horizontal-multivec-track-0',
        ); // uuid of horizontal-multivec
        const trackTiles = track.visibleAndFetchedTiles();
        expect(trackTiles.length).to.equal(1);

        const zeroCellCoords = [79, 184];
        const tooltipValue = track.getVisibleData(
          zeroCellCoords[0],
          zeroCellCoords[1],
        );
        // The data at this coordinate should correspond to this particular zero value.
        expect(tooltipValue).to.equal(
          '0.000<br/>Homo sapiens	CHIP-SEQ ANALYSIS OF H3K27AC IN' +
            ' HUMAN INFERIOR TEMPORAL LOBE CELLS; DNA_LIB 1053	G' +
            'SM1112812	GSE17312	None	Inferior Temporal Lobe Cel' +
            'l	Brain	Active Motif, 39133, 31610003	H3K27ac	hm	No' +
            'rmal',
        );

        const canvas = trackTiles[0].canvas;
        const ctx = canvas.getContext('2d');

        expect(canvas.width).to.equal(256);
        expect(canvas.height).to.equal(228);
        expect(track.dimensions[0]).to.equal(805);
        expect(track.dimensions[1]).to.equal(370);

        // Need to scale from screen coordinates to dataset coordinates.
        const scaledCoord = [
          Math.ceil((zeroCellCoords[0] / track.dimensions[0]) * canvas.width),
          Math.floor((zeroCellCoords[1] / track.dimensions[1]) * canvas.height),
        ];
        // Obtain the color at this pixel on the canvas.
        const pixel = ctx.getImageData(
          scaledCoord[0],
          scaledCoord[1],
          canvas.width,
          canvas.height,
        ).data;

        // Pixel should be blue.
        expect(pixel[0]).to.equal(0); // r
        expect(pixel[1]).to.equal(0); // g
        expect(pixel[2]).to.equal(255); // b
        expect(pixel[3]).to.equal(255); // a

        done();
      },
      {
        style: 'width:1000px; height:1000px; background-color: lightgreen',
      },
    );
  });

  it('Test horizontal multivec with transparent zero value color option', (done) => {
    horizontalMultivecWithZeroValueColorOption.views[0].tracks.center[0].options.zeroValueColor =
      'transparent';

    [div, hgc] = mountHGComponent(
      div,
      hgc,
      horizontalMultivecWithZeroValueColorOption,
      () => {
        const track = getTrackObjectFromHGC(
          hgc.instance(),
          'view-0',
          'horizontal-multivec-track-0',
        ); // uuid of horizontal-multivec
        const trackTiles = track.visibleAndFetchedTiles();
        expect(trackTiles.length).to.equal(1);

        const zeroCellCoords = [79, 184];
        const tooltipValue = track.getVisibleData(
          zeroCellCoords[0],
          zeroCellCoords[1],
        );
        // The data at this coordinate should correspond to this particular zero value.
        expect(tooltipValue).to.equal(
          '0.000<br/>Homo sapiens	CHIP-SEQ ANALYSIS OF H3K27AC IN' +
            ' HUMAN INFERIOR TEMPORAL LOBE CELLS; DNA_LIB 1053	G' +
            'SM1112812	GSE17312	None	Inferior Temporal Lobe Cel' +
            'l	Brain	Active Motif, 39133, 31610003	H3K27ac	hm	No' +
            'rmal',
        );

        const canvas = trackTiles[0].canvas;
        const ctx = canvas.getContext('2d');

        expect(canvas.width).to.equal(256);
        expect(canvas.height).to.equal(228);
        expect(track.dimensions[0]).to.equal(805);
        expect(track.dimensions[1]).to.equal(370);

        // Need to scale from screen coordinates to dataset coordinates.
        const scaledCoord = [
          Math.ceil((zeroCellCoords[0] / track.dimensions[0]) * canvas.width),
          Math.floor((zeroCellCoords[1] / track.dimensions[1]) * canvas.height),
        ];
        // Obtain the color at this pixel on the canvas.
        const pixel = ctx.getImageData(
          scaledCoord[0],
          scaledCoord[1],
          canvas.width,
          canvas.height,
        ).data;

        // Pixel should be transparent.
        expect(pixel[3]).to.equal(0); // transparent

        done();
      },
      {
        style: 'width:1000px; height:1000px; background-color: green',
      },
    );
  });

  it('Test horizontal multivec with filtered rows', (done) => {
    [div, hgc] = mountHGComponent(
      div,
      hgc,
      horizontalMultivecWithFilteredRows,
      () => {
        const track = getTrackObjectFromHGC(
          hgc.instance(),
          'UiHlCoxRQ-aITBDi5j8b_w',
          'YafcbvKDQvWoWRT1WrygPA',
        ); // uuid of horizontal-multivec
        const trackTiles = track.visibleAndFetchedTiles();
        expect(trackTiles.length).to.equal(2);
        expect(trackTiles[0].canvas.width).to.equal(256);
        expect(trackTiles[0].canvas.height).to.equal(10);
        expect(trackTiles[1].canvas.width).to.equal(256);
        expect(trackTiles[1].canvas.height).to.equal(10);

        const tooltipValue = track.getVisibleData(100, 100);
        expect(tooltipValue.startsWith('0.676')).to.be.true;
        done();
      },
      {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: true,
      },
    );
  });

  it('Test horizontal multivec without filtered rows', (done) => {
    [div, hgc] = mountHGComponent(
      div,
      hgc,
      horizontalMultivecWithSmallerDimensions,
      () => {
        const track = getTrackObjectFromHGC(
          hgc.instance(),
          'viewConf2_uid',
          'K_0GxgCvQfCHM56neOnHKg',
        ); // uuid of horizontal-multivec
        const trackTiles = track.visibleAndFetchedTiles();
        expect(trackTiles.length).to.equal(3);
        expect(trackTiles[0].canvas.width).to.equal(256);
        expect(trackTiles[0].canvas.height).to.equal(228);
        expect(trackTiles[1].canvas.width).to.equal(256);
        expect(trackTiles[1].canvas.height).to.equal(228);

        const tooltipValue = track.getVisibleData(40, 40);
        expect(tooltipValue).to.equal('647.000');
        done();
      },
      {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: true,
      },
    );
  });

  it('Test horizontal multivec with aggregation of rows', (done) => {
    horizontalMultivecWithAggregation.views[0].tracks.center[0].options.selectRowsAggregationWithRelativeHeight = true;
    [div, hgc] = mountHGComponent(
      div,
      hgc,
      horizontalMultivecWithAggregation,
      () => {
        const track = getTrackObjectFromHGC(
          hgc.instance(),
          'aggregation-view',
          'aggregation-track',
        ); // uuid of horizontal-multivec
        const trackTiles = track.visibleAndFetchedTiles();
        expect(trackTiles.length).to.be.greaterThanOrEqual(1);
        expect(trackTiles[0].canvas.width).to.equal(256);
        expect(trackTiles[0].canvas.height).to.equal(5);

        const trackHeight = track.dimensions[1];
        const itemHeight = trackHeight / 5;

        let tooltipValue;

        tooltipValue = track.getVisibleData(40, itemHeight * 0 + 1);
        expect(tooltipValue.substring(0, 5)).to.equal('6.118');

        tooltipValue = track.getVisibleData(40, itemHeight * 3 - 1);
        expect(tooltipValue.substring(0, 5)).to.equal('6.118');

        tooltipValue = track.getVisibleData(40, itemHeight * 3 + 1);
        expect(tooltipValue.substring(0, 5)).to.equal('0.829');

        tooltipValue = track.getVisibleData(40, itemHeight * 4 - 1);
        expect(tooltipValue.substring(0, 5)).to.equal('0.829');

        tooltipValue = track.getVisibleData(40, itemHeight * 4 + 1);
        expect(tooltipValue.substring(0, 5)).to.equal('0.174');

        tooltipValue = track.getVisibleData(40, itemHeight * 5 - 1);
        expect(tooltipValue.substring(0, 5)).to.equal('0.174');

        done();
      },
      {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: true,
      },
    );
  });

  it('Test horizontal multivec with aggregation of rows and static row height', (done) => {
    horizontalMultivecWithAggregation.views[0].tracks.center[0].options.selectRowsAggregationWithRelativeHeight = false;
    [div, hgc] = mountHGComponent(
      div,
      hgc,
      horizontalMultivecWithAggregation,
      () => {
        const track = getTrackObjectFromHGC(
          hgc.instance(),
          'aggregation-view',
          'aggregation-track',
        ); // uuid of horizontal-multivec
        const trackTiles = track.visibleAndFetchedTiles();
        expect(trackTiles.length).to.be.greaterThanOrEqual(1);
        expect(trackTiles[0].canvas.width).to.equal(256);
        expect(trackTiles[0].canvas.height).to.equal(3);

        const trackHeight = track.dimensions[1];
        const itemHeight = trackHeight / 3;

        let tooltipValue;

        tooltipValue = track.getVisibleData(40, itemHeight * 0 + 1);
        expect(tooltipValue.substring(0, 5)).to.equal('6.118');

        tooltipValue = track.getVisibleData(40, itemHeight * 1 - 1);
        expect(tooltipValue.substring(0, 5)).to.equal('6.118');

        tooltipValue = track.getVisibleData(40, itemHeight * 1 + 1);
        expect(tooltipValue.substring(0, 5)).to.equal('0.829');

        tooltipValue = track.getVisibleData(40, itemHeight * 2 - 1);
        expect(tooltipValue.substring(0, 5)).to.equal('0.829');

        tooltipValue = track.getVisibleData(40, itemHeight * 2 + 1);
        expect(tooltipValue.substring(0, 5)).to.equal('0.174');

        tooltipValue = track.getVisibleData(40, itemHeight * 3 - 1);
        expect(tooltipValue.substring(0, 5)).to.equal('0.174');

        done();
      },
      {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: true,
      },
    );
  });

  it('handles dynamic selectRows values by updating the dataFetcher and fetching new tiles', (done) => {
    horizontalMultivecWithAggregation.views[0].tracks.center[0].options.selectRows =
      [1, 2, 3];
    horizontalMultivecWithAggregation.views[0].tracks.center[0].options.selectRowsAggregationWithRelativeHeight = false;
    horizontalMultivecWithAggregation.views[0].tracks.center[0].options.selectRowsAggregationMethod =
      'client';
    [div, hgc] = mountHGComponent(
      div,
      hgc,
      horizontalMultivecWithAggregation,
      () => {
        const clientAggTrack = getTrackObjectFromHGC(
          hgc.instance(),
          'aggregation-view',
          'aggregation-track',
        );

        // When aggregation method === client, do not expect options in the dataConfig.
        const clientAggDataConfig = clientAggTrack.dataFetcher.dataConfig;
        expect(clientAggDataConfig.options).to.be.undefined;

        // When aggregation method === server, expect options.aggGroups in the dataConfig.
        const serverAggViewConf1 = horizontalMultivecWithAggregation;
        serverAggViewConf1.views[0].tracks.center[0].options.selectRowsAggregationMethod =
          'server';
        const serverAggViews1 = hgc
          .instance()
          .processViewConfig(serverAggViewConf1);
        hgc.setState({
          views: serverAggViews1,
        });
        const serverAggTrack1 = getTrackObjectFromHGC(
          hgc.instance(),
          'aggregation-view',
          'aggregation-track',
        );
        const serverAggDataConfig1 = serverAggTrack1.dataFetcher.dataConfig;
        expect(serverAggDataConfig1.options.aggGroups).to.eql([1, 2, 3]);

        // When selectRows changes, check that options.aggGroups in the dataConfig also changes.
        const serverAggViewConf2 = horizontalMultivecWithAggregation;
        serverAggViewConf2.views[0].tracks.center[0].options.selectRows = [
          4, 5, 6,
        ];
        const serverAggViews2 = hgc
          .instance()
          .processViewConfig(serverAggViewConf2);
        hgc.setState({
          views: serverAggViews2,
        });
        const serverAggTrack2 = getTrackObjectFromHGC(
          hgc.instance(),
          'aggregation-view',
          'aggregation-track',
        );
        const serverAggDataConfig2 = serverAggTrack2.dataFetcher.dataConfig;
        expect(serverAggDataConfig2.options.aggGroups).to.eql([4, 5, 6]);

        done();
      },
      {
        style: 'width:800px; height:400px; background-color: lightgreen',
        bounded: true,
      },
    );
  });

  after(() => {
    removeHGComponent(div);
  });
});

const viewConf1 = {
  zoomFixed: false,
  views: [
    {
      layout: {
        w: 12,
        h: 9,
        x: 0,
        y: 0,
        i: 'aa',
        moved: false,
        static: false,
      },
      uid: 'aa',
      initialYDomain: [2936293269.9661727, 3260543052.0694017],
      autocompleteSource: '/api/v1/suggest/?d=OHJakQICQD6gTD7skx4EWA&',
      initialXDomain: [-1109178825.081832, 3692212179.1390653],
      tracks: {
        left: [],
        top: [
          {
            uid: 'genes',
            tilesetUid: 'OHJakQICQD6gTD7skx4EWA',
            server: 'http://higlass.io/api/v1',
            type: 'horizontal-gene-annotations',
            height: 48,
            options: {
              labelColor: 'black',
              plusStrandColor: 'black',
              name: 'Gene Annotations (hg19)',
              labelPosition: 'hidden',
              minusStrandColor: 'black',
              fontSize: 11,
              trackBorderWidth: 0,
              trackBorderColor: 'black',
              showMousePosition: true,
              mousePositionColor: '#000000',
              geneAnnotationHeight: 10,
              geneLabelPosition: 'outside',
              geneStrandSpacing: 4,
              labelLeftMargin: 0,
              labelRightMargin: 0,
              labelTopMargin: 0,
              labelBottomMargin: 0,
            },
            width: 793,
          },
          {
            uid: 'R_trrhWOQG2UcXvAutdl7Q',
            tilesetUid: 'PjIJKXGbSNCalUZO21e_HQ',
            height: 20,
            width: 793,
            server: 'http://higlass.io/api/v1',
            type: 'horizontal-vector-heatmap',
            options: {
              name: 'GM12878-E116-H3K27ac.fc.signal',
              valueScaling: 'linear',
              lineStrokeWidth: 2,
              lineStrokeColor: '#4a35fc',
              labelPosition: 'topLeft',
              labelColor: 'black',
              axisPositionHorizontal: 'right',
              trackBorderWidth: 0,
              trackBorderColor: 'black',
              labelTextOpacity: 0.4,
              showMousePosition: true,
              mousePositionColor: '#000000',
              showTooltip: false,
              labelLeftMargin: 0,
              labelRightMargin: 0,
              labelTopMargin: 0,
              labelBottomMargin: 0,
              axisLabelFormatting: 'scientific',
              heatmapValueScaling: 'log',
            },
            name: 'GM12878-E116-H3K27ac.fc.signal',
          },
          {
            server: '//higlass.io/api/v1',
            tilesetUid: 'ClhFclOOQMWKSebXaXItoA',
            uid: 'E11eXWkwRb22aKBbj_45_A',
            type: 'horizontal-vector-heatmap',
            options: {
              labelPosition: 'topLeft',
              labelColor: 'black',
              labelTextOpacity: 0.4,
              valueScaling: 'exponential',
              trackBorderWidth: 0,
              trackBorderColor: 'black',
              backgroundColor: 'white',
              barBorder: true,
              sortLargestOnTop: true,
              colorScale: [
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
              name: 'Epilogos (hg19)',
              labelLeftMargin: 0,
              labelRightMargin: 0,
              labelTopMargin: 0,
              labelBottomMargin: 0,
              heatmapValueScaling: 'log',
            },
            width: 770,
            height: 153,
          },
          {
            uid: 'chroms',
            height: 35,
            width: 793,
            chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
            type: 'horizontal-chromosome-labels',
            options: {
              color: '#777777',
              stroke: '#FFFFFF',
              fontSize: 11,
              fontIsLeftAligned: true,
              showMousePosition: true,
              mousePositionColor: '#000000',
              fontIsAligned: false,
            },
            name: 'Chromosome Labels (hg19)',
          },
        ],
        right: [],
        center: [],
        bottom: [],
        whole: [],
        gallery: [],
      },
      chromInfoPath: '//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv',
      genomePositionSearchBoxVisible: false,
      genomePositionSearchBox: {
        visible: true,
        chromInfoServer: 'http://higlass.io/api/v1',
        chromInfoId: 'hg19',
        autocompleteServer: 'http://higlass.io/api/v1',
        autocompleteId: 'OHJakQICQD6gTD7skx4EWA',
      },
    },
  ],
  editable: true,
  viewEditable: true,
  tracksEditable: true,
  exportViewUrl: '/api/v1/viewconfs',
  zoomLocks: {
    locksByViewUid: {},
    locksDict: {},
  },
  trackSourceServers: ['http://higlass.io/api/v1'],
  locationLocks: {
    locksByViewUid: {
      aa: 'PkNgAl3mSIqttnSsCewngw',
      ewZvJwlDSei_dbpIAkGMlg: 'PkNgAl3mSIqttnSsCewngw',
    },
    locksDict: {
      PkNgAl3mSIqttnSsCewngw: {
        aa: [1550000000, 1550000000, 3380588.876772046],
        ewZvJwlDSei_dbpIAkGMlg: [
          1550000000.0000002, 1549999999.9999993, 3380588.876772046,
        ],
        uid: 'PkNgAl3mSIqttnSsCewngw',
      },
    },
  },
  valueScaleLocks: {
    locksByViewUid: {},
    locksDict: {},
  },
};
