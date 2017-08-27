import React from 'react';
import ReactDOM from 'react-dom';
import { SortableHandle } from 'react-sortable-hoc';

import MoveableTrack from './MoveableTrack';

const STYLES = {
  display: 'block',
  marginTop: '5px',
  opacity: .7,
  pointerEvents: 'all',
  position: 'relative'
};

export class VerticalTrack extends MoveableTrack {
  // each image should be 13 pixels below the next one
  getCloseImgStyle() { return STYLES; }

  getMoveImgStyle() { return STYLES; }

  getAddImgStyle() { return STYLES; }

  getSettingsImgStyle() { return STYLES; }

  getControls() {
    let Handle = null;

    if (this.moveable) {
      Handle = SortableHandle(() => (
        <svg
          className="no-zoom"
          height="10px"
          onClick={() => {}}
          style={this.getMoveImgStyle()}
          width="10px"
        >
          <use xlinkHref="#move"></use>
        </svg>
      ));
    } else {
      Handle = SortableHandle(() => <div />)
    }

    return (
      <div
        style={{
          position: 'absolute',
          backgroundColor: "rgba(255,255,255,0.7)",
          left: "3px",
          top: '3px',
          pointerEvents: 'none',
          paddingLeft: 5,
          paddingRight: 5,
          paddingBottom: 5,
          borderRadius: '5px',
          border: '1px solid #dddddd'
        }}
      >
        <svg
          className="no-zoom"
          height="10px"
          onClick={() => {
            let imgDom = ReactDOM.findDOMNode(this.imgClose);
            let bbox = imgDom.getBoundingClientRect();
            this.props.onCloseTrackMenuOpened(this.props.uid, bbox);
          }}
          ref={(c) => { this.imgClose = c; }}
          style={this.getCloseImgStyle()}
          width="10px"
        >
          <use xlinkHref="#cross"></use>
        </svg>

        <svg
          className="no-zoom"
          height="10px"
          onClick={() => {
            this.props.onAddSeries(this.props.uid);
          }}
          ref={(c) => { this.imgAdd = c; }}
          style={this.getAddImgStyle()}
          width="10px"
        >
          <use xlinkHref="#plus"></use>
        </svg>

        <svg
          className="no-zoom"
          height="10px"
          onClick={() => {
            let imgDom = ReactDOM.findDOMNode(this.imgConfig);
            let bbox = imgDom.getBoundingClientRect();
            this.props.onConfigTrackMenuOpened(this.props.uid, bbox);
          }}
          ref={(c) => { this.imgConfig = c; }}
          style={this.getSettingsImgStyle()}
          width="10px"
        >
          <use xlinkHref="#cog"></use>
        </svg>

        <Handle />
      </div>
    );
  }
}

export default VerticalTrack;
