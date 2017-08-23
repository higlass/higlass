import PropTypes from 'prop-types';
import React from 'react';
import { arrayMove } from 'react-sortable-hoc';

export default class ListWrapper extends React.Component {
  constructor({items}) {
    super();
    this.state = {
      items, isSorting: false
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState ({
      items: nextProps.items
    })
  }

  onSortStart({node, index, collection}, e) {
    e.stopImmediatePropagation();
    let {onSortStart} = this.props;
    this.setState({isSorting: true});

    if (onSortStart) {
      onSortStart(this.ref);
    }

    this.sortingIndex = index;

    this.sortStartTop = e.offsetTop;
    this.sortStartLeft = e.offsetLeft;
  }

  onSortMove() {}

  onSortEnd({oldIndex, newIndex}) {
    let {onSortEnd} = this.props;
    let {items} = this.state;

    this.setState({
      items: arrayMove(items, oldIndex, newIndex),
      isSorting: false
    });

    if (onSortEnd) {
      onSortEnd(this.state.items);
    }

    this.sortingIndex = null;
  }

  render() {
    const Component = this.props.component;
    const {items, isSorting} = this.state;
    const props = {
      isSorting, items,
      onSortEnd: this.onSortEnd.bind(this),
      onSortStart: this.onSortStart.bind(this),
      onSortMove: this.onSortMove.bind(this)
    }

    return (
      <Component
        {...this.props}
        {...props}
        ref={element => this.ref = element}
      />
    );
  }
}

ListWrapper.propTypes = {
  className: PropTypes.string,
  component: PropTypes.func,
  height: PropTypes.number,
  itemClass: PropTypes.string,
  items: PropTypes.array,
  onSortEnd: PropTypes.func,
  onSortStart: PropTypes.func,
  width: PropTypes.number
}

ListWrapper.defaultProps = {
  className: 'list stylizedList',
  itemClass: 'item stylizedItem',
  width: 400,
  height: 600
};
