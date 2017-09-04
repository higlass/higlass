import PropTypes from 'prop-types';
import React from 'react';

import DraggableDiv from './DraggableDiv';
import TrackArea from './TrackArea';


export class MoveableTrack extends TrackArea {
  constructor(props) {
    super(props);

    this.moveable = true;
  }

  render() {
    return (
      <div
        className={this.props.className}
        onMouseEnter={this.handleMouseEnter.bind(this)}
        onMouseLeave={this.handleMouseLeave.bind(this)}
        style={{
          height: this.props.height,
          width: this.props.width,
        }}
      >
        <DraggableDiv
          height={this.props.height}
          key={this.props.uid}
          resizeHandles={this.props.editable ?
            this.props.resizeHandles : new Set()
          }
          sizeChanged={stuff =>
            this.props.handleResizeTrack(
              this.props.uid,
              stuff.width,
              stuff.height,
            )
          }
          style={{ background: 'transparent' }}
          uid={this.props.uid}
          width={this.props.width}
        />
        {this.props.editable &&
          <div>
            {this.getControls(this.state.controlsVisible)}
          </div>
        }
      </div>
    );
  }
}

MoveableTrack.propTypes = {
  className: PropTypes.string,
  uid: PropTypes.string,
  item: PropTypes.object,
  height: PropTypes.number,
  width: PropTypes.number,
};

export default MoveableTrack;
