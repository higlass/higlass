import GBKDataFetcher from './genbank-fetcher';
import DataFetcher from '../DataFetcher';

const getDataFetcher = (dataConfig, pubSub) => {
  if (dataConfig.type === 'genbank') {
    return new GBKDataFetcher(dataConfig, pubSub);
  }

  return new DataFetcher(dataConfig, pubSub);
};

export default getDataFetcher;
