import React from 'react';

import ContextMenuItem from './ContextMenuItem';

import { TRACKS_INFO } from './configs';

import '../styles/ContextMenu.module.scss';

/**
 * Return a list of all the tracks and subtracks from
 * the list of tracks
 *
 * @param {array} tracks: A list of tracks to go through
 */
export const getAllTracksAndSubtracks = (tracks) => {
  let series = [];

  // check if this is a combined track (has contents)
  for (let track of tracks) {
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
  onItemClick
) => {
  if (!tracks) return null;

  const trackTypeToInfo = {};

  TRACKS_INFO.forEach((ti) => {
    trackTypeToInfo[ti.type] = ti;
  });

  return getAllTracksAndSubtracks(tracks).map((x) => {
    let thumbnail = null;
    if (x.type in trackTypeToInfo) {
      thumbnail = trackTypeToInfo[x.type].thumbnail;
    }
    const imgTag = thumbnail ? (
      <div
        dangerouslySetInnerHTML={{ __html: thumbnail.outerHTML }}
        style={{
          display: 'inline-block',
          marginRight: 10,
          verticalAlign: 'middle',
        }}
      />
    ) : (
      <div
        style={{
          display: 'inline-block',
          marginRight: 10,
          verticalAlign: 'middle',
        }}
      >
        <svg
          height={20}
          width={30}
        />
      </div>
    );

    return (
      <ContextMenuItem
        key={x.uid}
        onClick={() => { if (onItemClick) onItemClick(x.uid); }}
        onMouseEnter={(e) => { if (onItemMouseEnter) onItemMouseEnter(e, x); }}
        onMouseLeave={(e) => { if (onItemMouseLeave) onItemMouseLeave(e); }}
        styleName="context-menu-item"
      >
        {imgTag}
        <span
          styleName="context-menu-span"
        >
          {(x.name && x.name.length) ? x.name : x.uid}
          { onItemMouseEnter && onItemMouseLeave ?
            <svg styleName="play-icon" >
              <use xlinkHref="#play" />
            </svg>
            :
            null
          }
        </span>
      </ContextMenuItem>
    );
  });
};
