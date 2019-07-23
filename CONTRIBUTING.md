# Contributing to HiGlass

🎉 Hooray, it's marvelous to see you here! Thanks for considering to contribute to HiGlass. 👍

## Help! I am lost... 😭

[Join our Slack channel](http://bit.ly/higlass-slack) and we're happy to help.

## Basic Resources 📚

- **Docs**: https://docs.higlass.io
- **Development Docs**: https://docs-develop.higlass.io (related to not-yet-released code)
- **Bugs / Issue Tracker**: https://github.com/higlass/higlass/issues
- **Community**: https://higlass.slack.com [Join Now!](http://bit.ly/higlass-slack)
- **News / Updates**: https://twitter.com/higlass_io

## Contribute Code 👩‍💻👨‍💻

If you have improvements to HiGlass, send us your pull requests! If you're wondering what a _pull request (PR)_ is, please check out [GitHub's how to](https://help.github.com/articles/using-pull-requests/).

HiGlass core members will be assigned to review your pull requests. Once the pull requests are approved and pass continuous integration checks, we will merge your pull request add it to the next scheduled release.

### Pull Request Checklist ✅

- Ensure that the title of incomplete pull requests starts with `[WIP]` (work in progress)
- Ensure that your pull request answers the relevant questions in the [pull request template](PULL_REQUEST_TEMPLATE.md).
- Ensure that your pull requests successfully passes all continuous integration tests on [TravisCI](https://travis-ci.org/higlass).

## Coding Style 🎨

_Note, continuous integration will fail if your code is not compatible with our coding style._

- **JavaScript coding style**: We are following a combination of [ESLint's recommendation](https://eslint.org/docs/rules/), [Airbnb's coding style](https://github.com/airbnb/javascript), [React's recommendation](https://github.com/yannickcr/eslint-plugin-react), and [customizations](https://github.com/higlass/higlass/blob/develop/.eslintrc#L30). The easiest way to ensure you're following our coding style is to automatically run `npm run lint`.

- **Python coding style**: We follow the [PEP 8](https://www.python.org/dev/peps/pep-0008/) style guide and the [numpydoc](https://numpydoc.readthedocs.io/en/latest/format.html) convention for [docstrings](https://www.python.org/dev/peps/pep-0257/).
- **Documentation**:  We use the [Sphinx](http://www.sphinx-doc.org/en/master/) documentation generator, which uses [reStructuredText](http://www.sphinx-doc.org/en/master/usage/restructuredtext/basics.html) as its markup language. We also use Sphinx extensions to support Markdown, API reference generation from docstrings, and rendering of Jupyter Notebooks.
