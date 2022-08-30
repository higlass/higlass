import PropTypes from 'prop-types';
import React from 'react';

import { viewer } from './hglib';

/**
 * A barebones implementation of a HiGlass view used to display a 2d track.
 * Multiple layers can be used by specifying a `combined` track in `trackConfig`.
 *
 * Defaults to having no label and no colorbar.
 *
 * If the aspect ratio defined by the parameter bounds doesn't match the aspect
 * ration of the enclosing element, the x bounds will be respected and the y
 * y coordinates will be truncated.
 *
 * @param {element|HTMLElement} The element to attach the viewer to
 * @param {[xMin, xMax, yMin, yMax]|Array} The bounds of the track
 * @param {trackConfig: Object} The standard HiGlass track definition type
 * @returns {Object} A {id, hgApi} object
 */
export const trackViewer = (element, [xMin, xMax, yMin, yMax], trackConfig) => {
  if (!trackConfig.options.colorbarPosition) {
    trackConfig.options.colorbarPosition = 'hidden';
  }
  if (!trackConfig.options.labelPosition) {
    trackConfig.options.labelPosition = 'hidden';
  }
  const id = 'arbitary-id';
  const viewConfig = {
    editable: false,
    zoomFixed: false,
    views: [
      {
        uid: id,
        initialXDomain: [xMin, xMax],
        initialYDomain: [yMin, yMax],
        tracks: {
          center: [trackConfig],
        },
        layout: {
          w: 12,
          h: 12,
          x: 0,
          y: 0,
          moved: false,
          static: false,
        },
      },
    ],
  };
  const hgApi = viewer(element, viewConfig, { sizeMode: 'bounded' });
  return { id, hgApi };
};

/**
 * React component wrapper around trackViewer.
 * Accepts x, y, width, and height props, in addition to trackConfig,
 * so HiGlass can be used to provide background imagery for Deck.gl.
 */
export default class HiGlassTrackComponent extends React.Component {
  constructor(props) {
    super(props);
    this.id = `id-${Math.random()}`;
  }

  componentDidMount() {
    this.initTrackViewer();
  }

  shouldComponentUpdate(nextProps) {
    // For now, never re-render the component: Just re-zoom.
    const { x, y, width, height } = nextProps;
    this.zoomTo(x, y, width, height);
    return false;
  }

  initTrackViewer() {
    const { trackConfig, x, y, width, height } = this.props;
    const element = document.getElementById(this.id);
    const { id, hgApi } = trackViewer(
      element,
      [x, x + width, y, y + height],
      trackConfig,
    );
    this.viewUid = id;
    this.viewer = hgApi;
  }

  /**
   * Zoom to a particular position.
   *
   * @param  {Number}  x       Left side of viewport
   * @param  {Number}  y       Top side of viewport
   * @param  {Number}  width   Width of viewport
   * @param  {Number}  height  Height of viewport
   */
  zoomTo(x, y, width, height) {
    this.viewer.zoomTo(this.viewUid, x, x + width, y, y + height);
  }

  render() {
    return <div id={this.id} style={{ height: '100%', width: '100%' }} />;
  }
}

HiGlassTrackComponent.propTypes = {
  trackConfig: PropTypes.object,
  width: PropTypes.number,
  height: PropTypes.number,
  x: PropTypes.number,
  y: PropTypes.number,
};
