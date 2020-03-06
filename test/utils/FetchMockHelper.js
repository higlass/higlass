import fetchMock from 'fetch-mock';

const serverForFM = require('karma-server-side');

class FetchMockHelper {
  constructor(testName) {
    fetchMock.config.fallbackToNetwork = false;
    fetchMock.config.warnOnFallback = false;

    this.testName = testName;

    this.server = serverForFM;

    this.mockedData = [];
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
        return [];
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
    const data = response.json();

    // Switch fetch-mock on again
    fetchMock.config.fallbackToNetwork = false;

    return data;
  }

  async activateFetchMock() {
    this.mockedData = await this.getMockedData();

    // Since we are not using the actual mocking functionality of fetch-mock,
    // catch will intercept every call of the global fetch method
    fetchMock.catch(async (url, headers) => {
      const cleanUrl = this.removeSessionIdFromUrl(url);

      let data;
      // Check if we already have mocked data
      if (this.mockedData.filter(item => item.url === cleanUrl).length > 0) {
        data = this.mockedData.filter(mr => mr.url === cleanUrl)[0].data;
        console.log(`Data for ${url} loaded from local file.`); // eslint-disable-line
      } else {
        // If there is no mocked data, load from server (specified in viewConf)
        data = await this.getOriginalFetchResponse(url, headers);
        this.addToStoredMockedData(cleanUrl, data);
        /* eslint-disable */
        console.log(
          `Data for ${url} loaded from server and has been stored to file.`
        );
        /* eslint-enable */
      }
      return data;
    });
  }

  addToStoredMockedData(cleanUrl, newResponse) {
    const mockedResponseObj = {
      url: cleanUrl,
      data: newResponse
    };

    // If the URL already exists, update new data otherwise add it.
    if (
      this.mockedData.filter(mr => mr.url === mockedResponseObj.url).length > 0
    ) {
      this.mockedData.filter(
        mr => mr.url === mockedResponseObj.url
      )[0] = mockedResponseObj;
    } else {
      this.mockedData.push(mockedResponseObj);
    }

    const mockedResponsesJSON = JSON.stringify(this.mockedData);

    this.server
      .run(this.testName, mockedResponsesJSON, function(testName, data) {
        try {
          const fs = serverRequire('fs-extra'); // eslint-disable-line
          const path = `./test/mocked-responses/${testName}.json`;
          fs.writeFileSync(path, data);
        } catch (error) {
          return error;
        }
        return null;
      })
      .then(function(error) {
        if (error !== null) {
          console.error('Could not store mocked responses', error);
        }
      });
  }

  resetFetchMock() {
    fetchMock.reset();
  }

  removeSessionIdFromUrl(url) {
    const urlParts = url.split('?');
    const params = new URLSearchParams(urlParts[1]);
    params.delete('s');
    return `${urlParts[0]}?${params.toString()}`;
  }
}

export default FetchMockHelper;
