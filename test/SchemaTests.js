/* eslint-env node, jasmine, mocha */
import Ajv from 'ajv';
import schema from '../app/schema.json';
import viewconfNames from '../docs/examples/index.json';

describe('Viewconf JSON schema', () => {
  const validate = new Ajv().compile(schema);

  viewconfNames.forEach((viewconfName) => {
    it(`validates ${viewconfName}`, (done) => {
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
            console.warn(JSON.stringify(validate.errors, null, 2));
          }
          expect(validate.errors).toEqual(null);
          expect(valid).toEqual(true);

          done();
          // If there are errors, the log can be noisy:
          // We could put in special code to handle that, if it's worth it.
        });
      });
    });
  });
});
