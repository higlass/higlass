import React from 'react';
import {SortableContainer} from 'react-sortable-hoc';

const SortableList = SortableContainer(
  ({
    className,
    items,
    itemClass,
    sortingIndex,
    useDragHandle,
    sortableHandlers,height,
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
    let itemElements = items.map((item, index) => {
        return React.createElement(
          itemReactClass,
          {
            key: "sci-" + item.uid,
            className: itemClass,
            sortingIndex: sortingIndex,
            index: index,
            uid: item.uid,
            height: item.height,
            width: item.width,
            item: item,
            useDragHandle: useDragHandle,
            onCloseTrack: onCloseTrack,
            onCloseTrackMenuOpened: onCloseTrackMenuOpened,
            onConfigTrackMenuOpened: onConfigTrackMenuOpened,
            onAddSeries: onAddSeries,
            handleConfigTrack: handleConfigTrack,
            editable: editable,
            handleResizeTrack: handleResizeTrack,
            resizeHandles: resizeHandles
          })
        })
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
