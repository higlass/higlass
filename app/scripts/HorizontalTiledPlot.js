import PropTypes from 'prop-types';
import React from 'react';

import slugid from 'slugid';

import ListWrapper from './ListWrapper';
import HorizontalItem from './HorizontalItem';
import SortableList from './SortableList';

import {sum} from './utils';


const HorizontalTiledPlot = (props) => (
  <div style={{position: "relative"}}>
    <ListWrapper
      className="list stylizedList"
      component={SortableList}
      editable={props.editable}
      handleConfigTrack={props.handleConfigTrack}
      handleResizeTrack={props.handleResizeTrack}
      height={props.tracks.map(x => x.height).reduce(sum, 0)}
      helperClass="stylizedHelper"
      itemClass="stylizedItem"
      itemReactClass={HorizontalItem}
      items={props.tracks.map(d => ({
        uid: d.uid || slugid.nice(),
        width: props.width,
        height: d.height,
        value: d.value
      }))}
      onAddSeries={props.onAddSeries}
      onCloseTrack={props.onCloseTrack}
      onCloseTrackMenuOpened={props.onCloseTrackMenuOpened}
      onConfigTrackMenuOpened={props.onConfigTrackMenuOpened}
      onSortEnd={props.handleSortEnd}
      referenceAncestor={props.referenceAncestor}
      resizeHandles={props.resizeHandles}
      useDragHandle={true}
      width={props.width}
    />
  </div>
);

HorizontalTiledPlot.propTypes = {
  editable: PropTypes.bool,
  handleConfigTrack: PropTypes.func,
  handleResizeTrack: PropTypes.func,
  handleSortEnd: PropTypes.func,
  onAddSeries: PropTypes.func,
  onCloseTrack: PropTypes.func,
  onCloseTrackMenuOpened: PropTypes.func,
  onConfigTrackMenuOpened: PropTypes.func,
  referenceAncestor: PropTypes.func,
  resizeHandles: PropTypes.object,
  tracks: PropTypes.array,
  width: PropTypes.number
}

export default HorizontalTiledPlot;
