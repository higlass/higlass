import PropTypes from 'prop-types';
import { rgb as d3rgb } from 'd3-color';
import React from 'react';
import reactCSS from 'reactcss';
import { SketchPicker } from 'react-color';

class SketchInlinePicker extends React.Component {
  constructor(props) {
    super(props);

    const startColor = d3rgb(props.color);

    this.state = {
      displayColorPicker: false,
      color: {
        r: startColor.r,
        g: startColor.g,
        b: startColor.b,
        a: startColor.opacity,
      },
    };
  }

  handleClick() {
    this.setState((prevState) => ({
      displayColorPicker: !prevState.displayColorPicker,
    }));
  }

  handleClose() {
    this.setState({ displayColorPicker: false });
  }

  handleChange(color) {
    const rgb = color.rgb;
    const colorString = `rgba(${rgb.r},${rgb.g},${rgb.b},${rgb.a})`;

    this.props.onChange(colorString);
    this.setState({ color: color.rgb });
  }

  render() {
    const styles = reactCSS({
      default: {
        color: {
          width: '32px',
          height: '14px',
          borderRadius: '2px',
          background: `rgba(${this.state.color.r}, ${this.state.color.g}, ${this.state.color.b}, ${this.state.color.a})`,
        },
        swatch: {
          padding: '5px',
          background: '#fff',
          cursor: 'pointer',
          borderRadius: '1px',
        },
        popover: {
          position: 'absolute',
          zIndex: '2',
        },
        cover: {
          position: 'fixed',
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px',
        },
      },
    });

    return (
      <div>
        <div onClick={this.handleClick.bind(this)} style={styles.swatch}>
          <div style={styles.color} />
        </div>
        {this.state.displayColorPicker ? (
          <div style={styles.popover}>
            <div onClick={this.handleClose.bind(this)} style={styles.cover} />
            <SketchPicker
              color={this.state.color}
              onChange={this.handleChange.bind(this)}
            />
          </div>
        ) : null}
      </div>
    );
  }
}

SketchInlinePicker.propTypes = {
  color: PropTypes.string,
  onChange: PropTypes.func,
};

export default SketchInlinePicker;
