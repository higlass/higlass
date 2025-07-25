import { chromInfo } from '../services';

import objVals from './obj-vals';

/**
 * @param {Record<string, { chromInfoPath: string }>} views
 * @returns {void}
 */
const loadChromInfos = (views) =>
  objVals(views)
    .map((view) => view.chromInfoPath)
    .forEach((chromInfoPath) => chromInfo.get(chromInfoPath));

export default loadChromInfos;
