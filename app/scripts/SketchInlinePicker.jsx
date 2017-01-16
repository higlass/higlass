'use strict'

import {rgb} from 'd3-color';
import React from 'react'
import reactCSS from 'reactcss'
import { SketchPicker } from 'react-color'

class SketchInlinePicker extends React.Component {
    constructor(props) {
      super(props);

      let startColor = rgb(props.color);
      
      console.log('startColor:', startColor);

      this.state = {
        displayColorPicker: false,
        color: {
          r: startColor.r,
          g: startColor.g,
          b: startColor.b,
          a: startColor.opacity
        },
      };
    }

  handleClick() {
    this.setState({ displayColorPicker: !this.state.displayColorPicker })
  };

  handleClose() {
    this.setState({ displayColorPicker: false })
  };

  handleChange(color) {
      let rgb = color.rgb;
      let colorString = `rgba(${rgb.r},${rgb.g},${rgb.b},${rgb.a})`;

    this.props.onChange(colorString);
    this.setState({ color: color.rgb })
  };

  render() {

    const styles = reactCSS({
      'default': {
        color: {
          width: '36px',
          height: '14px',
          borderRadius: '2px',
          background: `rgba(${ this.state.color.r }, ${ this.state.color.g }, ${ this.state.color.b }, ${ this.state.color.a })`,
        },
        swatch: {
          padding: '5px',
          background: '#fff',
          borderRadius: '1px',
          boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
          display: 'inline-block',
          cursor: 'pointer',
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
        <div style={ styles.swatch } onClick={ this.handleClick.bind(this) }>
          <div style={ styles.color } />
        </div>
        { this.state.displayColorPicker ? <div style={ styles.popover }>
          <div style={ styles.cover } onClick={ this.handleClose.bind(this) }/>
          <SketchPicker color={ this.state.color } onChange={ this.handleChange.bind(this) } />
        </div> : null }

      </div>
    )
  }
}

export default SketchInlinePicker;
