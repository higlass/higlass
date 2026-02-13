// @ts-nocheck

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React from 'react';

import HorizontalTrack from './HorizontalTrack';

function HorizontalItem(props) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.uid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <HorizontalTrack
        className={props.className}
        dragHandleProps={{ ...attributes, ...listeners }}
        editable={props.editable}
        handleConfigTrack={props.handleConfigTrack}
        handleResizeTrack={props.handleResizeTrack}
        height={props.height}
        isCollapsed={props.isCollapsed}
        item={props.item}
        onAddSeries={props.onAddSeries}
        onCollapseTrack={props.onCollapseTrack}
        onExpandTrack={props.onExpandTrack}
        onCloseTrack={props.onCloseTrack}
        onCloseTrackMenuOpened={props.onCloseTrackMenuOpened}
        onConfigTrackMenuOpened={props.onConfigTrackMenuOpened}
        resizeHandles={props.resizeHandles}
        uid={props.uid}
        width={props.width}
      />
    </div>
  );
}

export default HorizontalItem;
