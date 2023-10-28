// @ts-nocheck
import PropTypes from 'prop-types';
import React from 'react';
import clsx from 'clsx';

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
      <div className={clsx('gallery-tracks', styles['gallery-tracks'])}>
        {this.props.tracks &&
          this.props.tracks.map((track, index) => (
            <div
              key={track.uid || index}
              className={styles['gallery-track']}
              onMouseLeave={this.mouseLeaveHandler.bind(this)}
              style={{
                top: track.height * index,
                right: track.height * index,
                bottom: track.height * index,
                left: track.height * index,
              }}
            >
              <div
                className={styles['gallery-sub-track']}
                onMouseEnter={this.mouseEnterHandler.bind(this)}
                style={{
                  top: 0,
                  right: 0,
                  left: 0,
                  height: track.height,
                }}
              />
              <div
                className={styles['gallery-sub-track']}
                onMouseEnter={this.mouseEnterHandler.bind(this)}
                style={{
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: track.height,
                }}
              />
              <div
                className={styles['gallery-sub-track']}
                onMouseEnter={this.mouseEnterHandler.bind(this)}
                style={{
                  right: 0,
                  bottom: 0,
                  left: 0,
                  height: track.height,
                }}
              />
              <div
                className={styles['gallery-sub-track']}
                onMouseEnter={this.mouseEnterHandler.bind(this)}
                style={{
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: track.height,
                }}
              />
              <div
                className={styles['gallery-invisible-track']}
                onMouseLeave={this.mouseLeaveHandler.bind(this)}
                style={{
                  top: track.height,
                  right: track.height,
                  bottom: track.height,
                  left: track.height,
                }}
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
  editable: PropTypes.bool,
  onCloseTrackMenuOpened: PropTypes.func.isRequired,
  onConfigTrackMenuOpened: PropTypes.func.isRequired,
  tracks: PropTypes.array,
};

export default GalleryTracks;
