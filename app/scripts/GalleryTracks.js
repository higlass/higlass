import PropTypes from 'prop-types';
import React from 'react';

import TrackControl from './TrackControl';

// Styles
import styles from '../styles/GalleryTracks.module.scss'; // eslint-disable-line no-unused-vars
import stylesPlot from '../styles/TiledPlot.module.scss'; // eslint-disable-line no-unused-vars
import stylesTrack from '../styles/Track.module.scss'; // eslint-disable-line no-unused-vars

const STYLES = {
  pointerEvents: 'all',
};

class GalleryTracks extends React.Component {
  constructor(props) {
    super(props);

    this.state = { hovering: false };
  }

  mouseEnterHandler() {
    this.setState({ hovering: true });
  }

  mouseLeaveHandler() {
    this.setState({ hovering: false });
  }

  render() {
    return (
      <div className="gallery-tracks" styleName="styles.gallery-tracks">
        {this.props.tracks &&
          this.props.tracks.map((track, index) => (
            <div
              key={track.uid || index}
              onMouseLeave={this.mouseLeaveHandler.bind(this)}
              style={{
                top: track.height * index,
                right: track.height * index,
                bottom: track.height * index,
                left: track.height * index,
              }}
              styleName="styles.gallery-track"
            >
              <div
                onMouseEnter={this.mouseEnterHandler.bind(this)}
                style={{
                  top: 0,
                  right: 0,
                  left: 0,
                  height: track.height,
                }}
                styleName="styles.gallery-sub-track"
              />
              <div
                onMouseEnter={this.mouseEnterHandler.bind(this)}
                style={{
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: track.height,
                }}
                styleName="styles.gallery-sub-track"
              />
              <div
                onMouseEnter={this.mouseEnterHandler.bind(this)}
                style={{
                  right: 0,
                  bottom: 0,
                  left: 0,
                  height: track.height,
                }}
                styleName="styles.gallery-sub-track"
              />
              <div
                onMouseEnter={this.mouseEnterHandler.bind(this)}
                style={{
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: track.height,
                }}
                styleName="styles.gallery-sub-track"
              />
              <div
                onMouseLeave={this.mouseLeaveHandler.bind(this)}
                style={{
                  top: track.height,
                  right: track.height,
                  bottom: track.height,
                  left: track.height,
                }}
                styleName="styles.gallery-invisible-track"
              />
              {this.props.editable && (
                <TrackControl
                  configMenuVisible={true}
                  imgStyleAdd={STYLES}
                  imgStyleClose={STYLES}
                  imgStyleMove={STYLES}
                  imgStyleSettings={STYLES}
                  isMoveable={false}
                  isVisible={this.state.hovering}
                  onCloseTrackMenuOpened={this.props.onCloseTrackMenuOpened}
                  onConfigTrackMenuOpened={this.props.onConfigTrackMenuOpened}
                  uid={track.uid || index}
                />
              )}
            </div>
          ))}
      </div>
    );
  }
}

GalleryTracks.propTypes = {
  editable: PropTypes.bool.isRequired,
  onCloseTrackMenuOpened: PropTypes.func.isRequired,
  onConfigTrackMenuOpened: PropTypes.func.isRequired,
  tracks: PropTypes.array.isRequired,
};

export default GalleryTracks;
