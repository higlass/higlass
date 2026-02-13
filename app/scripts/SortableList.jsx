// @ts-nocheck

import {
  DndContext,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import React from 'react';

function SortableList({
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
  onSortEnd,
  onSortStart,
  onSortMove,
  axis,
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const index = items.findIndex((item) => item.uid === active.id);
    if (onSortStart) {
      onSortStart({ index });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.uid === active.id);
    const newIndex = items.findIndex((item) => item.uid === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      onSortEnd({ oldIndex, newIndex });
    }
  };

  const strategy =
    axis === 'x' ? horizontalListSortingStrategy : verticalListSortingStrategy;

  const itemIds = items.map((item) => item.uid);

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
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={strategy}>
        <div
          className={className}
          style={{
            height,
            width,
            background: 'transparent',
          }}
        >
          {itemElements}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export default SortableList;
