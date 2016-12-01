import {range} from 'd3-array';
import slugid from 'slugid';
import urljoin from 'url-join';
import {Pool} from 'threads';
import {workerGetTilesetInfo} from './worker.js';
import {workerFetchTiles} from './worker.js';

class TileProxy  {
    constructor() {
        this.uid = slugid.nice();

        this.threadPool = new Pool();

        //maintain a cache of recently loaded tiles
    }

    fetchTiles(tilesetServer, tilesetIds, done) {
        /** 
         * Retrieve a set of tiles from the server
         * 
         * Plenty of room for optimization and caching here.
         *
         * @param server: A string with the server's url (e.g. "http://127.0.0.1")
         * @param tileIds: The ids of the tiles to fetch (e.g. asdf-sdfs-sdfs.0.0.0)
         */
        console.log('tilesetIds:', tilesetIds);
        // see if any of the tilesetIds are already in the cache
        // if they are, no need to fetch them

        workerFetchTiles(tilesetServer, tilesetIds, (results) => {
            // do some caching here    
            done(results);
        });
    }

    calculateZoomLevel(scale, minX, maxX) {
        /**
         * Calculate the current zoom level.
         */
        let rangeWidth = scale.range()[1] - scale.range()[0];
        let zoomScale = Math.max((maxX - minX) / (scale.domain()[1] - scale.domain()[0]), 1);
        let addedZoom = Math.max(0, Math.ceil(Math.log(rangeWidth / 256) / Math.LN2));
        let zoomLevel = Math.round(Math.log(zoomScale) / Math.LN2) + addedZoom;

        return zoomLevel
    }

    calculateTiles(zoomLevel, scale, minX, maxX, maxZoom, maxWidth) {
        /**
         * Calculate the tiles that should be visible get a data domain 
         * and a tileset info
         *
         * All the parameters except the first should be present in the
         * tileset_info returned by the server.
         *
         * @param zoomLevel: The zoom level at which to find the tiles (can be calculated using
         *                   this.calcaulteZoomLevel, but needs to synchronized across both x
         *                   and y scales so should be calculated externally)
         * @param scale: A d3 scale mapping data domain to visible values
         * @param minX: The minimum possible value in the dataset
         * @param maxX: The maximum possible value in the dataset
         * @param maxZoom: The maximum zoom value in this dataset
         * @param maxWidth: The width of the largest (roughlty equal to 2 ** maxZoom * tileSize * tileResolution)
         */

        if (zoomLevel > maxZoom)
            zoomLevel = maxZoom;

        // the ski areas are positioned according to their
        // cumulative widths, which means the tiles need to also
        // be calculated according to cumulative width
            //

        var tileWidth = maxWidth /  Math.pow(2, zoomLevel);

        let epsilon = 0.0000001;
        let tiles = [];

        let rows = null;

        rows = range(Math.max(0,Math.floor((scale.domain()[0] - minX) / tileWidth)),
                        Math.min(Math.pow(2, zoomLevel), Math.ceil(((scale.domain()[1] - minX) - epsilon) / tileWidth)));

        console.log('scale:', scale.domain(), 'rows:', rows);
        return rows
    }

    trackInfo(server, tilesetUid, done) {
        let outUrl = urljoin(server, 'tilesets/x/tileset_info/?d=' + tilesetUid);

        workerGetTilesetInfo(outUrl, done);
        /*
        console.log('about to run...');
        let jobA = this.threadPool.run(function(input, done) {
                workerGetTilesetInfo(input);
                done(input);
            }, {
                workerGetTilesetInfo: 'worker'
            })

           .on('done', function(job, message) {
                console.log('done', message);
           })
           .on('error', function(job, error) {
                console.log('error', error);
           })
            .send(outUrl);
        */
    }
}

export let tileProxy = new TileProxy();
