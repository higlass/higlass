// @ts-nocheck
const DummyDataFetcher = function DummyDataFetcher(HGC, ...args) {
  if (!new.target) {
    throw new Error(
      'Uncaught TypeError: Class constructor cannot be invoked without "new"',
    );
  }

  class DummyDataFetcherClass extends HGC.factories.DataFetcher {
    constructor(dataConfig, pubSub) {
      super(dataConfig, pubSub);
      this.hgc = HGC;
    }
  }
  return new DummyDataFetcherClass(...args);
};

DummyDataFetcher.config = {
  type: 'dummy',
};

const fetcherDef = {
  name: 'DummyDataFetcher',
  dataFetcher: DummyDataFetcher,
  config: DummyDataFetcher.config,
};

const register = () => {
  window.higlassDataFetchersByType = window.higlassDataFetchersByType || {};
  window.higlassDataFetchersByType[fetcherDef.config.type] = fetcherDef;
};

export default DummyDataFetcher;

export { register };
