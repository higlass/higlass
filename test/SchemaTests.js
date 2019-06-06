/* eslint-env node, jasmine, mocha */
import Ajv from 'ajv';
import schema from '../app/schema.json';


describe('Viewconf JSON schema', () => {
  const validate = new Ajv().compile(schema);

  [
    '1d-annotations.json',
  ].forEach((viewconfName) => {
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
          // console.log('viewconf:', viewconf);
          const valid = validate(viewconf);
          expect(validate.errors).toEqual(null);
          expect(valid).toEqual(true);

          done();
        });
      });
    });
  });
});
