import React from 'react';
import { findDOMNode } from 'react-dom';
import scrollIntoView from 'dom-scroll-into-view';
import PropTypes from 'prop-types';

const _debugStates = [];

class Autocomplete extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      highlightedIndex: null,
      menuTop: 0,
      menuLeft: 0,
      menuWidth: 0,
      isOpen: false,
    };

    this.keyDownHandlers = {
      ArrowDown(event) {
        event.preventDefault();
        const itemsLength = this.getFilteredItems().length;
        if (!itemsLength) return;
        const { highlightedIndex } = this.state;
        const index =
          highlightedIndex === null || highlightedIndex === itemsLength - 1
            ? 0
            : highlightedIndex + 1;
        this._performAutoCompleteOnKeyUp = true;
        this.setState({
          highlightedIndex: index,
          isOpen: true,
        });
      },

      ArrowUp(event) {
        event.preventDefault();
        const itemsLength = this.getFilteredItems().length;
        if (!itemsLength) return;
        const { highlightedIndex } = this.state;
        const index =
          highlightedIndex === 0 || highlightedIndex === null
            ? itemsLength - 1
            : highlightedIndex - 1;
        this._performAutoCompleteOnKeyUp = true;
        this.setState({
          highlightedIndex: index,
          isOpen: true,
        });
      },

      Enter(event) {
        if (this.state.isOpen === false) {
          // menu is closed so there is no selection to accept -> do nothing
        } else if (this.state.highlightedIndex === null) {
          // input has focus but no menu item is selected + enter is hit
          // -> close the menu, highlight whatever's in input
          this.setState(
            {
              isOpen: false,
            },
            () => {
              this.inputEl.select();
            },
          );
        } else {
          // text entered + menu item has been highlighted + enter is hit
          // -> update value to that of selected menu item, close the menu
          event.preventDefault();
          const item = this.getFilteredItems()[this.state.highlightedIndex];
          const value = this.props.getItemValue(item);
          this.setState(
            {
              isOpen: false,
              highlightedIndex: null,
            },
            () => {
              // this.refs.input.focus() // TODO: file issue
              this.inputEl.setSelectionRange(value.length, value.length);
              this.props.onSelect(value, item);
            },
          );
        }
      },

      Escape() {
        this.setState({
          highlightedIndex: null,
          isOpen: false,
        });
      },
    };
  }

  getInitialState() {
    return {
      isOpen: false,
      highlightedIndex: null,
    };
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount() {
    this._ignoreBlur = false;
    this._performAutoCompleteOnUpdate = false;
    this._performAutoCompleteOnKeyUp = false;
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    this._performAutoCompleteOnUpdate = true;
    // If `items` has changed we want to reset `highlightedIndex`
    // since it probably no longer refers to a relevant item
    if (
      this.props.items !== nextProps.items ||
      // The entries in `items` may have been changed even though the
      // object reference remains the same, double check by seeing
      // if `highlightedIndex` points to an existing item
      this.state.highlightedIndex >= nextProps.items.length
    ) {
      this.setState({ highlightedIndex: null });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.isOpen === true && prevState.isOpen === false) {
      this.setMenuPositions();
    }

    if (this.state.isOpen && this._performAutoCompleteOnUpdate) {
      this._performAutoCompleteOnUpdate = false;
      this.maybeAutoCompleteText();
    }

    this.maybeScrollItemIntoView();
    if (prevState.isOpen !== this.state.isOpen) {
      this.props.onMenuVisibilityChange(this.state.isOpen, this.inputEl);
    }
  }

  maybeScrollItemIntoView() {
    if (this.state.isOpen === true && this.state.highlightedIndex !== null) {
      // eslint-disable-next-line react/no-string-refs
      const itemNode = this.refs[`item-${this.state.highlightedIndex}`];
      // eslint-disable-next-line react/no-string-refs
      const menuNode = this.refs.menu;
      if (itemNode) {
        scrollIntoView(findDOMNode(itemNode), findDOMNode(menuNode), {
          onlyScrollIfNeeded: true,
        });
      }
    }
  }

  handleKeyDown(event) {
    if (this.keyDownHandlers[event.key]) {
      this.keyDownHandlers[event.key].call(this, event);
    } else {
      this.setState({
        highlightedIndex: null,
        isOpen: true,
      });
    }
  }

  handleChange(event) {
    this._performAutoCompleteOnKeyUp = true;
    this.props.onChange(event, event.target.value);
  }

  handleKeyUp() {
    if (this._performAutoCompleteOnKeyUp) {
      this._performAutoCompleteOnKeyUp = false;
      this.maybeAutoCompleteText();
    }
  }

  getFilteredItems() {
    let items = this.props.items;

    if (this.props.shouldItemRender) {
      items = items.filter((item) =>
        this.props.shouldItemRender(item, this.props.value),
      );
    }

    if (this.props.sortItems) {
      items.sort((a, b) => this.props.sortItems(a, b, this.props.value));
    }

    return items;
  }

  maybeAutoCompleteText() {
    if (!this.props.autoHighlight || this.props.value === '') {
      return;
    }
    const { highlightedIndex } = this.state;
    const items = this.getFilteredItems();
    if (items.length === 0) {
      return;
    }
    const matchedItem =
      highlightedIndex !== null ? items[highlightedIndex] : items[0];
    const itemValue = this.props.getItemValue(matchedItem);
    const itemValueDoesMatch =
      itemValue.toLowerCase().indexOf(this.props.value.toLowerCase()) === 0;
    if (itemValueDoesMatch && highlightedIndex === null) {
      this.setState({ highlightedIndex: 0 });
    }
  }

  setMenuPositions() {
    const node = this.inputEl;
    const rect = node.getBoundingClientRect();
    const computedStyle = global.window.getComputedStyle(node);
    const marginBottom = parseInt(computedStyle.marginBottom, 10) || 0;
    const marginLeft = parseInt(computedStyle.marginLeft, 10) || 0;
    const marginRight = parseInt(computedStyle.marginRight, 10) || 0;
    this.setState({
      menuTop: rect.bottom + marginBottom,
      menuLeft: rect.left + marginLeft,
      menuWidth: rect.width + marginLeft + marginRight,
    });
  }

  highlightItemFromMouse(index) {
    this.setState({ highlightedIndex: index });
  }

  selectItemFromMouse(item) {
    const value = this.props.getItemValue(item);
    this.setState(
      {
        isOpen: false,
        highlightedIndex: null,
      },
      () => {
        this.props.onSelect(value, item);
        this.inputEl.focus();
      },
    );
  }

  setIgnoreBlur(ignore) {
    this._ignoreBlur = ignore;
  }

  renderMenu() {
    const items = this.getFilteredItems().map((item, index) => {
      const element = this.props.renderItem(
        item,
        this.state.highlightedIndex === index,
        { cursor: 'default' },
      );
      return React.cloneElement(element, {
        onMouseDown: () => this.setIgnoreBlur(true),
        // Ignore blur to prevent menu from de-rendering before we can process click
        onMouseEnter: () => this.highlightItemFromMouse(index),
        onClick: () => this.selectItemFromMouse(item),
        ref: `item-${index}`,
      });
    });
    const style = {
      left: this.state.menuLeft,
      top: this.state.menuTop,
      minWidth: this.state.menuWidth,
    };
    if (!items.length) return null;
    const menu = this.props.renderMenu(items, this.props.value, style);
    return React.cloneElement(menu, { ref: 'menu' });
  }

  handleInputBlur() {
    if (this.props.onFocus) {
      this.props.onFocus();
    }
    if (this._ignoreBlur) {
      return;
    }
    this.setState({
      isOpen: false,
      highlightedIndex: null,
    });
  }

  handleInputFocus() {
    if (this.props.onFocus) {
      this.props.onFocus(true);
    }
    if (this._ignoreBlur) {
      this.setIgnoreBlur(false);
      return;
    }
    // We don't want `selectItemFromMouse` to trigger when
    // the user clicks into the input to focus it, so set this
    // flag to cancel out the logic in `handleInputClick`.
    // The event order is:  MouseDown -> Focus -> MouseUp -> Click
    this._ignoreClick = true;
    this.setState({ isOpen: true });
  }

  isInputFocused() {
    return (
      this.inputEl.ownerDocument &&
      this.inputEl === this.inputEl.ownerDocument.activeElement
    );
  }

  handleInputClick() {
    // Input will not be focused if it's disabled
    if (this.isInputFocused() && this.state.isOpen === false) {
      this.setState({ isOpen: true });
    } else if (this.state.highlightedIndex !== null && !this._ignoreClick) {
      this.selectItemFromMouse(
        this.getFilteredItems()[this.state.highlightedIndex],
      );
    }
    this._ignoreClick = false;
  }

  composeEventHandlers(internal, external) {
    return external
      ? (e) => {
          internal(e);
          external(e);
        }
      : internal;
  }

  /* ------------------------------ Rendering ------------------------------- */

  render() {
    if (this.props.debug) {
      // you don't like it, you love it
      _debugStates.push({
        id: _debugStates.length,
        state: this.state,
      });
    }

    const { inputProps } = this.props;
    return (
      <div style={{ ...this.props.wrapperStyle }} {...this.props.wrapperProps}>
        <input
          {...inputProps}
          ref={(el) => {
            this.inputEl = el;
          }}
          aria-autocomplete="list"
          autoComplete="off"
          onBlur={this.composeEventHandlers(
            this.handleInputBlur.bind(this),
            inputProps.onBlur && inputProps.onBlur.bind(this),
          )}
          onChange={this.handleChange.bind(this)}
          onClick={this.composeEventHandlers(
            this.handleInputClick.bind(this),
            inputProps.onClick && inputProps.onClick.bind(this),
          )}
          onFocus={this.composeEventHandlers(
            this.handleInputFocus.bind(this),
            inputProps.onFocus && inputProps.onFocus.bind(this),
          )}
          onKeyDown={this.composeEventHandlers(
            this.handleKeyDown.bind(this),
            inputProps.onKeyDown && inputProps.onKeyDown.bind(this),
          )}
          onKeyUp={this.composeEventHandlers(
            this.handleKeyUp.bind(this),
            inputProps.onKeyUp && inputProps.onKeyUp.bind(this),
          )}
          role="combobox"
          value={this.props.value}
        />
        {('open' in this.props ? this.props.open : this.state.isOpen) &&
          this.renderMenu()}
        {this.props.debug && (
          <pre style={{ marginLeft: 300 }}>
            {JSON.stringify(
              _debugStates.slice(_debugStates.length - 5, _debugStates.length),
              null,
              2,
            )}
          </pre>
        )}
      </div>
    );
  }
}

Autocomplete.defaultProps = {
  value: '',
  wrapperProps: {},
  wrapperStyle: {
    display: 'inline-block',
  },
  inputProps: {},
  onChange() {},
  onSelect() {},
  renderMenu(items, value, style) {
    return (
      /* eslint-disable react/no-this-in-sfc */
      <div style={{ ...style, ...this.menuStyle }}>{items}</div>
      /* eslint-enable react/no-this-in-sfc */
    );
  },
  shouldItemRender() {
    return true;
  },
  menuStyle: {
    borderRadius: '3px',
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.1)',
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '2px 0',
    fontSize: '90%',
    position: 'fixed',
    overflow: 'auto',
    maxHeight: '50%', // TODO: don't cheat, let it flow to the bottom
  },
  autoHighlight: true,
  onMenuVisibilityChange() {},
};

Autocomplete.propTypes = {
  autoHighlight: PropTypes.bool,
  debug: PropTypes.bool,
  getItemValue: PropTypes.func.isRequired,
  inputProps: PropTypes.object,
  items: PropTypes.array,
  menuStyle: PropTypes.object,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onMenuVisibilityChange: PropTypes.func,
  onSelect: PropTypes.func,
  open: PropTypes.bool,
  renderItem: PropTypes.func.isRequired,
  renderMenu: PropTypes.func,
  shouldItemRender: PropTypes.func,
  sortItems: PropTypes.func,
  value: PropTypes.any,
  wrapperProps: PropTypes.object,
  wrapperStyle: PropTypes.object,
};

export default Autocomplete;
