import React from 'react';

import HiGlassComponent from './HiGlassComponent';

/**
 * React component for single 2D HiGlass tracks.
 * Accepts x, y, width, and height props, in addition to trackConfig,
 * so HiGlass can be used to provide background imagery for Deck.gl.
 */
export default class HiGlassTrackComponent extends React.Component {
  constructor(props) {
    super(props);

    const {
      trackConfig, x, y, width, height
    } = props;
    const xMin = x;
    const xMax = x + width;
    const yMin = y;
    const yMax = y + height;
    if (!trackConfig.options.colorbarPosition) {
      trackConfig.options.colorbarPosition = 'hidden';
    }
    if (!trackConfig.options.labelPosition) {
      trackConfig.options.labelPosition = 'hidden';
    }
    this.viewUid = 'UID-placeholder';
    this.viewConfig = {
      editable: false,
      zoomFixed: false,
      views: [
        {
          uid: this.viewUid,
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
    this.options = { bounded: true };
    this.HgcRef = React.createRef();
  }

  shouldComponentUpdate(nextProps) {
    // For now, never re-render the component: Just re-zoom.
    const {
      x, y, width, height,
    } = nextProps;
    this.zoomTo(x, y, width, height);
    return false;
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
    this.HgcRef.current.api.zoomTo(this.viewUid, x, x + width, y, y + height);
  }

  render() {
    return (
      <div id={this.id} style={{ height: '100%', width: '100%' }}>
        <HiGlassComponent
          ref={this.HgcRef}
          options={this.options}
          viewConfig={this.viewConfig}
        />
      </div>
    );
  }
}
