import PropTypes from 'prop-types';
import React from 'react';

import slugid from 'slugid';

import ListWrapper from './ListWrapper';
import SortableList from './SortableList';
import VerticalItem from './VerticalItem';

import { sum } from './utils';


const VerticalTiledPlot = props => (
  <ListWrapper
    axis="x"
    className="list stylizedList horizontalList"
    component={SortableList}
    editable={props.editable}
    handleConfigTrack={props.handleConfigTrack}
    handleResizeTrack={props.handleResizeTrack}
    height={props.height}
    helperClass="stylizedHelper"
    itemClass="stylizedItem horizontalItem"
    itemReactClass={VerticalItem}
    items={props.tracks.map(d => ({
      uid: d.uid || slugid.nice(),
      height: props.height,
      width: d.width,
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
    width={props.tracks.map((x) => x.width).reduce(sum, 0)}
  />
);


VerticalTiledPlot.propTypes = {
  editable: PropTypes.bool,
  handleConfigTrack: PropTypes.func,
  handleResizeTrack: PropTypes.func,
  handleSortEnd: PropTypes.func,
  height: PropTypes.number,
  onAddSeries: PropTypes.func,
  onCloseTrack: PropTypes.func,
  onCloseTrackMenuOpened: PropTypes.func,
  onConfigTrackMenuOpened: PropTypes.func,
  referenceAncestor: PropTypes.func,
  resizeHandles: PropTypes.object,
  tracks: PropTypes.array
}

export default VerticalTiledPlot
