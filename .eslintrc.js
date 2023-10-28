// @ts-nocheck
module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  plugins: ['react'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  extends: ['plugin:react/recommended', 'airbnb', 'prettier'],
  rules: {
    // TODOs:
    'no-param-reassign': 'off', // https://github.com/higlass/higlass/issues/483
    'import/no-cycle': 'off',
    'prefer-object-spread': 'warn',
    'react/no-find-dom-node': 'off', // https://github.com/higlass/higlass/issues/510
    'react/require-default-props': 'off', // https://github.com/higlass/higlass/issues/523
    'react/jsx-curly-brace-presence': 'warn',
    'react/jsx-props-no-spreading': 'warn',
    'react/function-component-definition': 'warn',

    // Below, if it's turned off ('off'), we definitely do not care about the rule.
    // If it's turned on ('error'), and you have a violation, either
    //   - fix it
    //   - eslint-disable just your line
    //   - or turn it off globally; we might be too picky.
    // If it's a warning ('warn'), we'd like to turn it either fully on or fully off, eventually.
    'class-methods-use-this': 'off',
    'guard-for-in': 'off',
    'no-bitwise': 'off',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'no-continue': 'off',
    'no-plusplus': 'off',
    'no-prototype-builtins': 'off',
    'no-restricted-syntax': 'off', // allows "for of" loops
    'no-underscore-dangle': 'off', // allows '_variable'
    'no-unused-vars': 'off',
    'prefer-destructuring': 'off',

    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/no-noninteractive-element-interactions': 'off',

    // React
    'react/destructuring-assignment': 'off',
    'react/forbid-prop-types': 'off',
    'react/no-unused-prop-types': 'off',
    'react/no-unused-state': 'off',
    'react/no-unused-class-component-methods': 'off',
    'react/jsx-no-bind': ['off', { ignoreRefs: true }],
    'react/jsx-boolean-value': 'off',
    'react/prop-types': 'warn',
    'react/sort-comp': 'off',
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
      files: ['web-test-runner.config.mjs', 'vite.config.mjs', 'scripts/*'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
