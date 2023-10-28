// @ts-nocheck
import { chromInfo } from '../services';

import objVals from './obj-vals';

const loadChromInfos = (views) =>
  objVals(views)
    .map((view) => view.chromInfoPath)
    .forEach((chromInfoPath) => chromInfo.get(chromInfoPath));

export default loadChromInfos;
