import slugid from 'slugid';
import pako from 'pako';
import genbankParser from 'genbank-parser';

/**
 * @template T, B
 * @typedef {import('../types').AbstractDataFetcher<T, B>} AbstractDataFetcher
 */

/** @typedef {{ start: number, end: number, type: 'filler', strand: "+" | "-" }} FillerSegment */

/**
 * Take a list of genes, which can be any list with elements containing
 * { start, end } fields and return another list of { start, end }
 * fields containing the collapsed genes.
 *
 * The segments should be sorted by their start coordinate.
 *
 * The scale parameter is the number of base pairs per pixels
 *
 * @param {ArrayLike<{ start: number, end: number }>} segments
 * @param {number} scale
 * @param {"+" | "-"} strand
 * @returns {Array<FillerSegment>}
 */
function collapse(segments, scale, strand) {
  /** @type {Array<FillerSegment>} */
  const collapsed = [];

  // the maximum distance we allow between segments before collapsing them
  const MAX_DIST_BETWEEN = 5;

  // no segments in, no segments out
  if (!segments.length) {
    return [];
  }

  // start with the first segment
  let currStart = segments[0].start;
  let currEnd = segments[0].end;

  // continue on to the next segments
  for (let i = 1; i < segments.length; i++) {
    if (segments[i].start < currEnd + (MAX_DIST_BETWEEN * 1) / scale) {
      // this segment is within merging distance -- merge it
      currEnd = Math.max(currEnd, segments[i].end);
    } else {
      // this segment is outside of the merging distance, dump the current
      // collapsed segment and start a new one
      collapsed.push({
        type: 'filler',
        start: currStart,
        end: currEnd,
        strand,
      });

      // start a new collapsed segment
      currStart = segments[i].start;
      currEnd = segments[i].end;
    }
  }

  // add the final segment
  collapsed.push({
    start: currStart,
    end: currEnd,
    type: 'filler',
    strand,
  });

  return collapsed;
}

/**
 * Shuffles array in place.
 * @template T
 * @param {Array<T>} a items An array containing the items.
 * @returns {Array<T>} The (mutated) shuffled array
 */
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const x = a[i];
    a[i] = a[j];
    a[j] = x;
  }
  return a;
}

/** @typedef {import('genbank-parser').ParsedGenbank["features"][number]} GenbankFeature */

/**
 * @typedef FillerGeneAnnotation
 * @prop {number} xStart
 * @prop {number} xEnd
 * @prop {'+' | '-'} strand
 * @prop {string} uid
 * @prop {'filler'} type
 * @prop {[]} fields
 */

/**
 * @typedef CompleteGeneAnnotation
 * @prop {number} xStart
 * @prop {number} xEnd
 * @prop {'+' | '-'} strand
 * @prop {number} chrOffset
 * @prop {number} importance
 * @prop {string} uid
 * @prop {string=} type
 * @prop {[
 *    chr: 'chrom',
 *    start: number,
 *    end: number,
 *    name: string,
 *    importance: number,
 *    strand: '+' | '-',
 *    _unknown0: string,
 *    _unknown1: string,
 *    type: string,
 *    name: string,
 *    start: string,
 *    end: string,
 *    start: string,
 *    end: string,
 *  ]} fields
 */

/** @typedef {CompleteGeneAnnotation | FillerGeneAnnotation} GeneAnnotation */

/**
 * @param {GenbankFeature | FillerSegment} x
 * @returns {x is FillerSegment}
 */
function isFillerSegment(x) {
  return x.type === 'filler';
}

/**
 * Convert a genbank feature to a higlass gene annotation
 *
 * @param {GenbankFeature | FillerSegment} gb
 * @returns {GeneAnnotation}
 */
function genbankFeatureToHiGlassGeneAnnotation(gb) {
  const importance = gb.end - gb.start;
  const strand = gb.strand === 1 ? '+' : '-';
  const uid = slugid.nice();

  if (isFillerSegment(gb)) {
    // this is annotation that was generated by collapsing genes and is
    // only meant to show that there is something there.
    return {
      xStart: gb.start,
      xEnd: gb.end,
      strand: gb.strand,
      fields: [],
      type: 'filler',
      uid,
    };
  }

  return {
    xStart: gb.start,
    xEnd: gb.end,
    strand,
    chrOffset: 0,
    importance: gb.end - gb.start,
    uid,
    type: gb.type,
    fields: [
      'chrom',
      gb.start,
      gb.end,
      gb.name,
      importance,
      strand,
      '',
      '',
      gb.type,
      gb.name,
      gb.start.toString(),
      gb.end.toString(),
      gb.start.toString(),
      gb.end.toString(),
    ],
  };
}

/**
 * Convert genbank text to a JSON representation and extract features
 * @param {string} gbText
 * @returns {{
 *  json: import('genbank-parser').ParsedGenbank[],
 *  features: GenbankFeature[],
 * }}
 */
function gbToJsonAndFeatures(gbText) {
  const gbJson = genbankParser(gbText);
  const features = shuffle(
    gbJson[0].features
      .filter((f) => f.type !== 'source')
      .sort((a, b) => a.start - b.start),
  );
  return { json: gbJson, features };
}

/**
 * Extract the response from a fetch request
 * @param {Response} response
 * @param {{ gzipped: boolean }} options
 * @returns {Promise<string>}
 */
async function extractResponse(response, { gzipped }) {
  if (!gzipped) return response.text();
  const buffer = await response.arrayBuffer();
  return pako.inflate(buffer, { to: 'string' });
}

/**
 * @typedef GenbankDataConfig
 * @prop {string=} url
 * @prop {string=} text
 */

/**
 * @typedef {Array<GeneAnnotation> & { tilePositionId?: string }} GenbankTile
 */

/** @implements {AbstractDataFetcher<GenbankTile, GenbankDataConfig>} */
class GBKDataFetcher {
  /** @param {GenbankDataConfig} dataConfig */
  constructor(dataConfig) {
    /** @type {GenbankDataConfig} */
    this.dataConfig = dataConfig;
    /** @type {string} */
    this.trackUid = slugid.nice();
    /** @type {string} */
    this.errorTxt = '';

    /** @type {Promise<string>} */
    let textPromise;

    if (dataConfig.url) {
      const extension = dataConfig.url.slice(dataConfig.url.length - 3);
      textPromise = fetch(dataConfig.url, {
        mode: 'cors',
        redirect: 'follow',
        method: 'GET',
      }).then((r) => extractResponse(r, { gzipped: extension === '.gz' }));
    } else if (dataConfig.text) {
      textPromise = Promise.resolve(dataConfig.text);
    } else {
      throw new Error('No data or URL specified');
    }
    /** @type {Promise<ReturnType<typeof gbToJsonAndFeatures>>} */
    this.gbDataPromise = textPromise.then((text) => gbToJsonAndFeatures(text));
  }

  /**
   * @param {import('../types').HandleTilesetInfoFinished} [callback]
   * @returns {Promise<import('../types').LegacyTilesetInfo | undefined>}
   */
  tilesetInfo(callback) {
    this.tilesetInfoLoading = true;
    return this.gbDataPromise
      .then((gbData) => {
        this.tilesetInfoLoading = false;

        const TILE_SIZE = 1024;
        /** @satisfies {import('../types').LegacyTilesetInfo} */
        const retVal = {
          name: `genbank-${this.trackUid}`,
          tile_size: TILE_SIZE,
          max_zoom: Math.ceil(
            Math.log(gbData.json[0].size / TILE_SIZE) / Math.log(2),
          ),
          max_width: gbData.json[0].size,
          min_pos: [0],
          max_pos: [gbData.json[0].size],
        };

        if (callback) {
          callback(retVal);
        }

        return retVal;
      })
      .catch((err) => {
        this.tilesetInfoLoading = false;

        if (callback) {
          callback({
            error: `Error parsing genbank: ${err}`,
          });
        }
        return undefined;
      });
  }

  /**
   * @param {(tiles: Record<string, GenbankTile>) => void} receivedTiles
   * @param {string[]} tileIds
   * @returns {Promise<Record<string, GenbankTile>>}
   */
  async fetchTilesDebounced(receivedTiles, tileIds) {
    /** @type {Record<string, GenbankTile>} */
    const tiles = {};
    /** @type {string[]} */
    const validTileIds = [];
    /** @type {Promise<GeneAnnotation[]>[]} */
    const tilePromises = [];

    for (const tileId of tileIds) {
      const parts = tileId.split('.');
      const z = parseInt(parts[0], 10);
      const x = parseInt(parts[1], 10);

      if (Number.isNaN(x) || Number.isNaN(z)) {
        console.warn('Invalid tile zoom or position:', z, x);
        continue;
      }

      validTileIds.push(tileId);
      tilePromises.push(this.tile(z, x));
    }

    const values = await Promise.all(tilePromises);
    for (let i = 0; i < values.length; i++) {
      const validTileId = validTileIds[i];
      tiles[validTileId] = values[i];
      tiles[validTileId].tilePositionId = validTileId;
    }

    receivedTiles(tiles);
    return tiles;
  }

  /**
   * @param {number} z
   * @param {number} x
   * @returns {Promise<GeneAnnotation[]>}
   */
  async tile(z, x) {
    const [tsInfo, gbData] = await Promise.all([
      this.tilesetInfo(),
      this.gbDataPromise,
    ]);
    if (!tsInfo) {
      throw new Error('No tileset info');
    }

    const tileWidth = +tsInfo.max_width / 2 ** +z;

    // get the bounds of the tile
    const minX = tsInfo.min_pos[0] + x * tileWidth;
    const maxX = tsInfo.min_pos[0] + (x + 1) * tileWidth;

    const filtered = gbData.features.filter(
      (v) => v.end > minX && v.start < maxX,
    );
    const scaleFactor = 1024 / 2 ** (tsInfo.max_zoom - z);

    /** @type {Array<FillerSegment>} */
    const collapsedPlus = collapse(
      filtered.filter((v) => v.strand === 1),
      scaleFactor,
      '+',
    );

    /** @type {Array<FillerSegment>} */
    const collapsedMinus = collapse(
      filtered.filter((v) => v.strand !== 1),
      scaleFactor,
      '-',
    );

    /** @type {Array<GenbankFeature | FillerSegment>} */
    const values = [];
    const TILE_CAPACITY = 20;
    // fill the tile with entries that are within it
    for (let i = 0; i < gbData.features.length; i++) {
      if (values.length >= TILE_CAPACITY) {
        break;
      }
      if (gbData.features[i].end >= minX && gbData.features[i].start <= maxX) {
        values.push(gbData.features[i]);
      }
    }
    return [values, collapsedPlus, collapsedMinus].flatMap((v) =>
      v.map(genbankFeatureToHiGlassGeneAnnotation),
    );
  }
}

export default GBKDataFetcher;
