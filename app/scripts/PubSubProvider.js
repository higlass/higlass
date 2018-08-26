import PropTypes from 'prop-types';
import { Component } from 'react';

class PubSubProvider extends Component {
  getChildContext() {
    return {
      pubSub: this.props.pubSub,
    };
  }
  render() {
    return this.props.children;
  }
}

PubSubProvider.propTypes = {
  children: PropTypes.node.isRequired,
  pubSub: PropTypes.object.isRequired,
};

PubSubProvider.childContextTypes = {
  pubSub: PropTypes.object,
};

export default PubSubProvider;
