// @ts-nocheck
import React from 'react';

import ContextMenuItem from './ContextMenuItem';

import { TRACKS_INFO_BY_TYPE } from './configs';

import classes from '../styles/ContextMenu.module.scss';

/**
 * Return a list of all the tracks and subtracks from
 * the list of tracks
 *
 * @param {array} tracks: A list of tracks to go through
 */
export const getAllTracksAndSubtracks = (tracks) => {
  let series = [];

  // check if this is a combined track (has contents)
  for (const track of tracks) {
    if (track.contents) {
      series = series.concat(track.contents);
    } else {
      series.push(track);
    }
  }

  return series;
};

/**
 * Get a list of menu items corresponding to the
 * series present in a set of tracks. If any of
 * the tracks a combined tracks, this function will
 * return individual menu items for each of the
 * combined tracks.
 *
 * @param {object} tracks: An array of track definitions (from the viewconf)
 * @param {func} onItemMouseEnter: Event handler for mouseEnter
 * @param {func} onItemMouseLeave: Event handler for mouseLeave
 * @param {func} onItemClick: Event handler for mouseLeave
 *
 * @returns {array} A list of ReactComponents for the generated ContextMenuItems
 */
export const getSeriesItems = (
  tracks,
  onItemMouseEnter,
  onItemMouseLeave,
  onItemClick,
) => {
  if (!tracks) return null;

  if (window.higlassTracksByType) {
    Object.keys(window.higlassTracksByType).forEach((pluginTrackType) => {
      TRACKS_INFO_BY_TYPE[pluginTrackType] =
        window.higlassTracksByType[pluginTrackType].config;
    });
  }

  return getAllTracksAndSubtracks(tracks).map((x) => {
    const thumbnail = TRACKS_INFO_BY_TYPE[x.type]
      ? TRACKS_INFO_BY_TYPE[x.type].thumbnail
      : null;

    const imgTag = thumbnail ? (
      <div
        className={classes['context-menu-icon']}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Defined by plugins
        dangerouslySetInnerHTML={{ __html: thumbnail.outerHTML }}
      />
    ) : (
      <div className={classes['context-menu-icon']}>
        <svg />
      </div>
    );

    return (
      <ContextMenuItem
        key={x.uid}
        className={classes['context-menu-item']}
        onClick={() => {
          if (onItemClick) onItemClick(x.uid);
        }}
        onMouseEnter={(e) => {
          if (onItemMouseEnter) onItemMouseEnter(e, x);
        }}
        onMouseLeave={(e) => {
          if (onItemMouseLeave) onItemMouseLeave(e);
        }}
      >
        {imgTag}
        <span className={classes['context-menu-span']}>
          {x.options?.name?.length ? x.options.name : x.type}
          {onItemMouseEnter && onItemMouseLeave ? (
            <svg className={classes['play-icon']}>
              <title>Play</title>
              <use xlinkHref="#play" />
            </svg>
          ) : null}
        </span>
      </ContextMenuItem>
    );
  });
};
