// @ts-nocheck

import React from 'react';
import { SortableContainer } from 'react-sortable-hoc';

const SortableList = SortableContainer(
  ({
    className,
    items,
    itemClass,
    itemControlAlignLeft,
    sortingIndex,
    useDragHandle,
    sortableHandlers,
    height,
    width,
    onCloseTrack,
    onCollapseTrack,
    onExpandTrack,
    onCloseTrackMenuOpened,
    onConfigTrackMenuOpened,
    onAddSeries,
    handleConfigTrack,
    editable,
    itemReactClass,
    handleResizeTrack,
    resizeHandles,
  }) => {
    const itemElements = items.map((item, index) =>
      React.createElement(itemReactClass, {
        key: `sci-${item.uid}`,
        className: itemClass,
        controlAlignLeft: itemControlAlignLeft,
        sortingIndex,
        index,
        uid: item.uid,
        height: item.height,
        width: item.width,
        isCollapsed: item.isCollapsed,
        item,
        useDragHandle,
        onCloseTrack,
        onCollapseTrack,
        onExpandTrack,
        onCloseTrackMenuOpened,
        onConfigTrackMenuOpened,
        onAddSeries,
        handleConfigTrack,
        editable,
        handleResizeTrack,
        resizeHandles,
      }),
    );

    return (
      <div
        className={className}
        style={{
          height,
          width,
          background: 'transparent',
        }}
        {...sortableHandlers}
      >
        {itemElements}
      </div>
    );
  },
);

export default SortableList;
