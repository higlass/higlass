import React from 'react';
import {SortableElement} from 'react-sortable-hoc';

import VerticalTrack from './VerticalTrack';

export const VerticalItem = SortableElement(props => (
  <VerticalTrack
    className={props.className}
    editable={props.editable}
    handleConfigTrack={props.handleConfigTrack}
    handleResizeTrack={props.handleResizeTrack}
    height={props.height}
    item={props.item}
    onAddSeries={props.onAddSeries}
    onCloseTrack={props.onCloseTrack}
    onCloseTrackMenuOpened={props.onCloseTrackMenuOpened}
    onConfigTrackMenuOpened={props.onConfigTrackMenuOpened}
    resizeHandles={props.resizeHandles}
    uid={props.uid}
    width={props.width}
  />
));

export default VerticalItem;
