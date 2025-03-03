// @ts-nocheck
import React from 'react';
import TrackArea from './TrackArea';

export default class FixedTrack extends TrackArea {
  render() {
    let controls = null;

    if (
      this.props.editable &&
      (this.state.controlsVisible || this.props.item.configMenuOpen)
    ) {
      controls = this.getControls();
    }

    let classNames = 'track';

    classNames += this.props.className ? ` ${this.props.className}` : '';

    return (
      <div
        className={classNames}
        onMouseEnter={this.handleMouseEnter.bind(this)}
        onMouseLeave={this.handleMouseLeave.bind(this)}
        style={{
          height: this.props.height,
          width: this.props.width,
          position: 'relative',
          background: 'transparent',
        }}
      >
        <div
          key={this.props.uid}
          style={{
            height: this.props.height,
            width: this.props.width,
          }}
        />
        {controls}
      </div>
    );
  }
}
