import React from 'react';
import { SortableContainer } from 'react-sortable-hoc';

export const SortableList = SortableContainer(
  ({
    className,
    items,
    itemClass,
    sortingIndex,
    useDragHandle,
    sortableHandlers,
    height,
    width,
    onCloseTrack,
    onCloseTrackMenuOpened,
    onConfigTrackMenuOpened,
    onAddSeries,
    handleConfigTrack,
    editable,
    itemReactClass,
    handleResizeTrack,
    resizeHandles
  }) => {
    const itemElements = items.map((item, index) => React.createElement(
      itemReactClass,
      {
        key: `sci-${item.uid}`,
        className: itemClass,
        sortingIndex,
        index,
        uid: item.uid,
        height: item.height,
        width: item.width,
        item,
        useDragHandle,
        onCloseTrack,
        onCloseTrackMenuOpened,
        onConfigTrackMenuOpened,
        onAddSeries,
        handleConfigTrack,
        editable,
        handleResizeTrack,
        resizeHandles
      })
    );

    return (
      <div
        className={className}
        style={{
          height: height,
          width: width,
          background: 'transparent'
        }}
        {...sortableHandlers}
      >
        {itemElements}
      </div>
    );
  }
);

export default SortableList;
