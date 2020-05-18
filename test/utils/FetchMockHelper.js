import fetchMock from 'fetch-mock';

class FetchMockHelper {
  constructor(viewConf, testName) {
    this.checkViewConf(viewConf);

    this.server = require('karma-server-side'); // eslint-disable-line

    fetchMock.config.fallbackToNetwork = false;
    fetchMock.config.warnOnFallback = false;

    this.testName = testName;

    this.mockedData = {};
    this.writeToFile = false;
  }

  async getMockedData() {
    const mockedResponses = await this.server.run(this.testName, function(
      testName
    ) {
      try {
        const fs = serverRequire('fs-extra'); // eslint-disable-line
        const path = `./test/mocked-responses/${testName}.json`;

        // Read currently available mocked responses
        if (fs.pathExistsSync(path)) {
          return fs.readJsonSync(path);
        }
        return {};
      } catch (error) {
        return error;
      }
    });

    return mockedResponses;
  }

  async getOriginalFetchResponse(url, headers) {
    // This basically disables fetch-moch, so that we can call the original fetch
    fetchMock.config.fallbackToNetwork = 'always';

    const response = await fetch(url, headers);
    let data;

    if (headers.headers['Content-Type'] === 'text/plain') {
      data = response.text();
    } else {
      data = response.json();
    }

    // Switch fetch-mock on again
    fetchMock.config.fallbackToNetwork = false;

    return data;
  }

  async activateFetchMock() {
    this.mockedData = await this.getMockedData();

    // Since we are not using the actual mocking functionality of fetch-mock,
    // catch will intercept every call of the global fetch method
    fetchMock.catch(async (url, headers) => {
      const [requestIds, isTileData] = this.getRequestIds(url);
      let data = {};

      // Check if all the requested data is already mocked
      let isAllDataMocked = true;
      requestIds.forEach(id => {
        if (this.mockedData[id] === undefined) {
          isAllDataMocked = false;
        }
      });

      if (isAllDataMocked) {
        requestIds.forEach(id => {
          if (isTileData) {
            data[id] = this.mockedData[id];
          } else {
            data = this.mockedData[id];
          }
        });
      } else {
        this.writeToFile = true;
        // If there is no mocked data, load from server (specified in viewConf)
        console.warn(
          `Not all requests have been mocked. Loading ${url} from server.`
        );
        data = await this.getOriginalFetchResponse(url, headers);
        this.addToMockedData(data, isTileData ? null : url, requestIds);
      }
      return data;
    });
  }

  addToMockedData(response, customId, requestIds) {
    if (customId === null) {
      // console.warn(ids);
      for (const id of requestIds) {
        // const id = rid.split('/')[1];
        this.mockedData[id] = response[id] === undefined ? {} : response[id];
      }
    } else {
      this.mockedData[customId] = response;
    }
  }

  async storeMockedDataToFile() {
    if (!this.writeToFile) {
      return;
    }

    const mockedResponsesJSON = JSON.stringify(this.mockedData, null, 1);

    const response = await this.server.run(
      this.testName,
      mockedResponsesJSON,
      function(testName, data) {
        try {
          // If the test is run by Travis, don't write the file
          if (!process.env.TRAVIS) {
            const fs = serverRequire('fs-extra'); // eslint-disable-line
            const path = `./test/mocked-responses/${testName}.json`;
            fs.writeFileSync(path, data);
          }
        } catch (error) {
          return error;
        }
        return null;
      }
    );

    if (response !== null) {
      console.error('Could not store mocked responses', response);
    }
  }

  async storeDataAndResetFetchMock() {
    await this.storeMockedDataToFile();
    fetchMock.reset();
  }

  getRequestIds(url) {
    const urlParts = url.split('?');

    const isTileData =
      url.includes('/tileset_info/') || url.includes('/tiles/');
    const tileIds = [];

    if (isTileData) {
      const params = new URLSearchParams(urlParts[1]);

      for (const p of params) {
        if (p[0] === 'd') {
          tileIds.push(p[1]);
        }
      }
    } else {
      tileIds.push(url);
    }

    return [tileIds, isTileData];
  }

  checkViewConf(viewConf) {
    if (viewConf !== null && JSON.stringify(viewConf).includes('"//')) {
      console.warn(
        'Please use full URLs in your view config. // is not supported and might lead to errors.'
      );
    }
  }
}

export default FetchMockHelper;
