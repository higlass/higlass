/* eslint-env node, jasmine, mocha */
import Ajv from 'ajv';
import schema from '../app/schema.json';
import viewconfNames from '../docs/examples/index.json';
import createElementAndApi from './utils/create-element-and-api';


describe('Viewconf JSON schema', () => {
  const validate = new Ajv().compile(schema);

  viewconfNames.forEach((viewconfName) => {
    it(`validates original of ${viewconfName}`, (done) => {
      // (Extra space in message is to align the output of this test with the next.)
      const viewconfPath = `/base/docs/examples/viewconfs/${viewconfName}`;

      // Just dynamically requiring the JSON would be simpler, but I get this error:
      //   Uncaught SyntaxError: Unexpected token :
      // The file is available, but is being parsed as javascript, not json.
      //
      // const viewconfPath = `../docs/examples/viewconfs/${viewconfName}`;
      // const viewconf = require(viewconfPath);

      fetch(viewconfPath).then((viewconfResponse) => {
        viewconfResponse.json().then((viewconf) => {
          const valid = validate(viewconf);
          if (validate.errors) {
            console.warn(
              `Error in ${viewconfName}`,
              JSON.stringify(validate.errors, null, 2)
            );
          }
          expect(validate.errors).toEqual(null);
          expect(valid).toEqual(true);

          done();
          // If there are errors, the log can be noisy:
          // We could put in special code to handle that, if it's worth it.
        });
      });
    });

    it(`validates re-export of ${viewconfName}`, (done) => {
      const viewconfPath = `/base/docs/examples/viewconfs/${viewconfName}`;

      fetch(viewconfPath).then((viewconfResponse) => {
        viewconfResponse.json().then((originalViewconf) => {
          const [div, api] = createElementAndApi( // eslint-disable-line no-unused-vars
            originalViewconf, { editable: false }
          );

          const viewconf = api.getViewConfig();
          const valid = validate(viewconf);
          if (validate.errors) {
            console.warn(JSON.stringify(validate.errors, null, 2));
          }
          expect(validate.errors).toEqual(null);
          expect(valid).toEqual(true);

          done();
        });
      });
    });
  });
});
