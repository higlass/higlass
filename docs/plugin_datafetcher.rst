Plugin Data Fetcher Development
########################

Plugin data fetchers are classes that can be used by HiGlass to fetch track
data, but have an external code base. We strongly recommend to develop new types of data fetchers
as plugin data fetchers and only add very generic data fetchers so the HiGlass core library.

Basic skeleton
==============

A plugin data fetcher consists of a wrapper function which defines and returns an instance
of a data fetcher class. The wrapper function loads HiGlass specific libraries
which can be used in the definition of the plugin data fetcher class.
In the follow you can see a bare minimum example of this structure.

.. code-block:: javascript

    import { registerDataFetcher } from 'higlass-register';

    const MyPluginDataFetcher = function MyPluginDataFetcher(HGC, ...args) {
      if (!new.target) {
        throw new Error(
          'Uncaught TypeError: Class constructor cannot be invoked without "new"'
        );
      }


      // You can extend the base DataFetcher class with your plugin.
      const { DataFetcher } = HGC.dataFetchers;
      
      // You also have access to other built-in data fetchers and getDataFetcher
      const {
        GBKDataFetcher,
        LocalDataFetcher,
        getDataFetcher
      } = HGC.dataFetchers;

      // Other libraries, utils, etc. that are provided by HiGlass (HGC)
      const { ... } = HGC.libraries;
      const { ... } = HGC.utils;
      const { ... } = HGC.services;
      const { ... } = HGC.utils;
      const { ... } = HGC.configs;
      // The base DataFetcher class is also exposed from HGC.factories.
      const { ... } = HGC.factories;

      // The version of HiGlass. Can be used to check for compatibility.
      const hgVersion = HGC.VERSION;

      class MyDataFetcherClass extends HGC.dataFetchers.DataFetcher {
        constructor(dataConfig, pubSub) {
            super(dataConfig, pubSub);
            this.hgc = HGC;
        }
      }
      return new MyDataFetcherClass(...args);
    }

    MyPluginDataFetcher.config = {
      type: 'my-data-fetcher',
    };

    // It's important that you register your plugin data fetcher
    // with HiGlass otherwise HiGlass will not know about it
    registerDataFetcher({
      name: 'MyPluginDataFetcher',
      dataFetcher: MyPluginDataFetcher,
      config: MyPluginDataFetcher.config
    });

    export default MyPluginDataFetcher;

The best way to get start implementing a plugin data fetchers is to take a look at
existing plugin data fetchers and their code. You can find a list of all officially
supported plugin tracks and data fetchers at
`higlass.io/plugins <http://higlass.io/plugins>`_


Available libraries and utils
======================================

Plugin data fetchers have access to many core libraries and internal
utilities.

Please visit the `"available to plugins" page <available_to_plugins.html>`_
for an overview of all available imports that plugin tracks and data fetchers may access.
