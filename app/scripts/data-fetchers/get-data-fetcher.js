import GBKDataFetcher from './genbank-fetcher';
import LocalDataFetcher from './local-tile-fetcher';
import DataFetcher from '../DataFetcher';

const getDataFetcher = (dataConfig, pubSub) => {
  if (dataConfig.type === 'genbank') {
    return new GBKDataFetcher(dataConfig, pubSub);
  }

  if (dataConfig.type === 'local-tiles') {
    return new LocalDataFetcher(dataConfig, pubSub);
  }

  return new DataFetcher(dataConfig, pubSub);
};

export default getDataFetcher;
