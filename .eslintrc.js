module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'plugin:react/recommended',
    'airbnb',
    'prettier',
  ],
  plugins: [
    'react',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // TODOs:
    'no-param-reassign': 'off', // https://github.com/higlass/higlass/issues/483
    'import/no-cycle': 'off',

    // Below, if it's turned off ('off'), we definitely do not care about the rule.
    // If it's turned on ('error'), and you have a violation, either
    //   - fix it
    //   - eslint-disable just your line
    //   - or turn it off globally; we might be too picky.
    // If it's a warning ('warn'), we'd like to turn it either fully on or fully off, eventually.
    'class-methods-use-this': 'off',
    'no-bitwise': 'off',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-continue': 'off',
    'no-plusplus': 'off',
    'no-restricted-syntax': 'off', // allows "for of" loops
    'no-underscore-dangle': 'off', // allows '_variable'
    'no-unused-vars': 'off',
    'prefer-destructuring': 'off',
  },
  overrides: [
    {
      files: ['test/**/*.{js,jsx}'],
      rules: {
        'no-use-before-define': 'off', // So viewconfs can be below the body of the test.
        'no-undef': 'off',
        'no-unused-expressions': 'off', // for Mocha's expect(foo).to.be.ok syntax
      },
    },
    {
      files: [
        'web-test-runner.config.mjs',
        'vite.config.js',
        'scripts/*',
      ],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
