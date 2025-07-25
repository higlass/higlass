// @ts-nocheck
// TODO: we need to address this cyclic dependency
import { AVAILABLE_FOR_PLUGINS } from '.';
import {
  DataFetcher,
  GBKDataFetcher,
  LocalDataFetcher,
} from '../data-fetchers';

const getDataFetcher = (
  dataConfig,
  pubSub,
  pluginDataFetchers,
  availableForPlugins = AVAILABLE_FOR_PLUGINS,
) => {
  // Check if a plugin data fetcher is available.
  const pluginDataFetcher = pluginDataFetchers[dataConfig.type];
  if (pluginDataFetcher) {
    return new pluginDataFetcher.dataFetcher(
      availableForPlugins,
      dataConfig,
      pubSub,
    );
  }

  if (dataConfig.type === 'genbank') {
    return new GBKDataFetcher(dataConfig, pubSub);
  }

  if (dataConfig.type === 'local-tiles') {
    return new LocalDataFetcher(dataConfig, pubSub);
  }

  return new DataFetcher(dataConfig, pubSub);
};

export default getDataFetcher;
