import PropTypes from 'prop-types';
import React from 'react';
import { arrayMove } from 'react-sortable-hoc';

class ListWrapper extends React.Component {
  constructor({ items }) {
    super();
    this.state = {
      items,
      isSorting: false,
    };
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      items: nextProps.items,
    });
  }

  onSortStart({ node, index, collection }, e) {
    e.stopImmediatePropagation();
    const { onSortStart } = this.props;
    this.setState({ isSorting: true });

    if (onSortStart) {
      onSortStart(this.ref);
    }

    this.sortingIndex = index;

    this.sortStartTop = e.offsetTop;
    this.sortStartLeft = e.offsetLeft;
  }

  onSortMove() {}

  onSortEnd({ oldIndex, newIndex }) {
    const { onSortEnd } = this.props;
    const { items } = this.state;

    this.setState({
      items: arrayMove(items, oldIndex, newIndex),
      isSorting: false,
    });

    if (onSortEnd) {
      onSortEnd(this.state.items);
    }

    this.sortingIndex = null;
  }

  render() {
    const Component = this.props.component;
    const { items, isSorting } = this.state;
    const props = {
      isSorting,
      items,
      onSortEnd: this.onSortEnd.bind(this),
      onSortStart: this.onSortStart.bind(this),
      onSortMove: this.onSortMove.bind(this),
    };

    return (
      <Component
        {...this.props}
        {...props}
        ref={(element) => {
          this.ref = element;
        }}
      />
    );
  }
}

ListWrapper.propTypes = {
  axis: PropTypes.string,
  className: PropTypes.string,
  component: PropTypes.func,
  editable: PropTypes.bool,
  handleConfigTrack: PropTypes.func,
  handleResizeTrack: PropTypes.func,
  height: PropTypes.number,
  helperClass: PropTypes.string,
  itemClass: PropTypes.string,
  itemControlAlignLeft: PropTypes.bool,
  itemReactClass: PropTypes.func,
  items: PropTypes.array,
  onAddSeries: PropTypes.func,
  onCloseTrack: PropTypes.func,
  onCloseTrackMenuOpened: PropTypes.func,
  onConfigTrackMenuOpened: PropTypes.func,
  onSortEnd: PropTypes.func,
  onSortStart: PropTypes.func,
  referenceAncestor: PropTypes.string,
  resizeHandles: PropTypes.object,
  useDragHandle: PropTypes.bool,
  width: PropTypes.number,
};

ListWrapper.defaultProps = {
  className: 'list stylizedList',
  itemClass: 'item stylizedItem',
  width: 400,
  height: 600,
};

export default ListWrapper;
