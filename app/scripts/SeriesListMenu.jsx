import clsx from 'clsx';
import React from 'react';

import ContextMenuContainer from './ContextMenuContainer';
import ContextMenuItem from './ContextMenuItem';
import NestedContextMenu from './NestedContextMenu';

// Configs
import { THEME_DARK, TRACKS_INFO_BY_TYPE } from './configs';
import OPTIONS_INFO from './options-info';

// Styles
import classes from '../styles/ContextMenu.module.scss';
import { isObject } from './utils/type-guards';

/** @import * as t from './types' */
/** @import { TrackRenderer } from './TrackRenderer' */

/**
 * @typedef ContextMenuHandler
 * @property {string} label
 * @property {(evt: unknown, onTrackOptionsChanged: (options: Record<string, unknown>) => void) => void} onClick
 */

/**
 * @param {unknown} x
 * @returns {x is { contextMenuItems: (trackLeft: number, trackRight: number) => Array<ContextMenuHandler> }}}
 */
function hasContextMenuItems(x) {
  return (
    isObject(x) &&
    'contextMenuItems' in x &&
    typeof x.contextMenuItems === 'function'
  );
}

/**
 *  We're going to get the track object to see if it has a
 *  context menu handler that will give use context menu items
 *  to display
 *
 * @param {t.TrackConfig} track The config for the track we're getting context menu
 *  items for
 * @param {TrackRenderer} trackRenderer The track renderer for the view
 *  containing this track. We'll use it to get the track's object
 * @param {{canvasLeft: number, canvasTop: number}} position The position of the track.
 *  Where the track starts relative to the canvas. This is important because all
 *  coordinates within a track are relative to left and top coordinates.
 * @returns {Array<ContextMenuHandler>}
 */
function findTrackContextMenuItems(track, trackRenderer, position) {
  let trackObj = trackRenderer.getTrackObject(track.uid);

  // The track may be a LeftTrackModifier track
  trackObj = trackObj?.originalTrack || trackObj;

  // See if the track will provide us with context menu items
  if (hasContextMenuItems(trackObj)) {
    let trackLeft = position.canvasLeft - trackObj.position[0];
    let trackTop = position.canvasTop - trackObj.position[1];

    if (trackObj.flipText) {
      // This is a left track modifier track so we need to swap the
      // left and right values
      const temp = trackLeft;
      trackLeft = trackTop;
      trackTop = temp;
    }

    const items = trackObj.contextMenuItems(trackLeft, trackTop);

    return items || [];
  }

  // The track doesn't have a contextMenuItems function so we it's
  // obviously not providing any items.
  return [];
}

/**
 * @typedef MenuItem
 * @property {string} name
 * @property {string} [value]
 * @property {Record<string, unknown>} [children]
 * @property {() => void} [handler]
 */

export default class SeriesListMenu extends ContextMenuContainer {
  /**
   * @param {unknown} position
   * @param {unknown} bbox
   * @param {{ type: string, options: Record<string, unknown>, uid: string, }} track
   */
  getConfigureSeriesMenu(position, bbox, track) {
    /** @type {Record<string, MenuItem>} */
    const menuItems = {};

    // plugin tracks can offer their own options
    // if they clash with the default higlass options
    // they will override them
    const pluginOptionsInfo =
      window.higlassTracksByType?.[track.type] &&
      window.higlassTracksByType[track.type].config &&
      window.higlassTracksByType[track.type].config.optionsInfo;

    if (pluginOptionsInfo) {
      for (const key of Object.keys(pluginOptionsInfo)) {
        // @ts-expect-error - extends OPTIONS_INFO with new data
        OPTIONS_INFO[key] = pluginOptionsInfo[key];
      }
    }

    const trackinfo = TRACKS_INFO_BY_TYPE[track.type];

    if (!trackinfo?.availableOptions) {
      return null;
    }

    for (const optionType of trackinfo.availableOptions) {
      if (optionType in OPTIONS_INFO) {
        const optionInfo =
          OPTIONS_INFO[/** @type {keyof typeof OPTIONS_INFO} */ (optionType)];
        menuItems[optionType] = { name: optionInfo.name };

        // can we dynamically generate some options?
        // should be used if the options depend on tileset info or other current state
        if ('generateOptions' in optionInfo) {
          const generatedOptions = optionInfo.generateOptions(track);

          if (!menuItems[optionType].children) {
            menuItems[optionType].children = {};
          }

          for (const generatedOption of generatedOptions) {
            const optionSelectorSettings = {
              name: generatedOption.name,
              value: generatedOption.value,
              handler: () => {
                track.options[optionType] = generatedOption.value;
                this.props.onTrackOptionsChanged(track.uid, track.options);
                this.props.closeMenu();
              },
            };

            menuItems[optionType].children[generatedOption.value] =
              optionSelectorSettings;
          }
        }

        if ('inlineOptions' in optionInfo) {
          // we can simply select this option from the menu
          for (const inlineOptionKey in optionInfo.inlineOptions) {
            /** @type {Record<string, Record<string, { name: string, value: unknown }>>} */
            const inlineOption = optionInfo.inlineOptions[inlineOptionKey];

            // check if there's already available options (e.g.
            // "Top right") for this option type (e.g. "Label
            // position")
            if (!menuItems[optionType].children) {
              menuItems[optionType].children = {};
            }

            const optionSelectorSettings = {
              name: inlineOption.name,
              value: inlineOption.value,
              // missing handler to be filled in below
              handler: () => {},
            };

            // is there a custom component available for picking this
            // option type value (e.g. 'custom' color scale)
            if (inlineOption.componentPickers && track.type in inlineOption.componentPickers) {
              optionSelectorSettings.handler = () => {
                this.props.onConfigureTrack(
                  track,
                  inlineOption.componentPickers[track.type],
                );
                this.props.closeMenu();
              };
            } else {
              // the menu option defines a potential value for this option
              // type (e.g. "top right")
              optionSelectorSettings.handler = () => {
                track.options[optionType] = inlineOption.value;
                this.props.onTrackOptionsChanged(track.uid, track.options);
                this.props.closeMenu();
              };
            }

            menuItems[optionType].children[inlineOptionKey] =
              optionSelectorSettings;
          }
          // @ts-expect-error - mutated from a plugin
        } else if (track.type in optionInfo.componentPickers) {
          // there's an option picker registered
          menuItems[optionType].handler = () => {
            this.props.onConfigureTrack(
              track,
              // @ts-expect-error - mutated from a plugin
              optionInfo.componentPickers[track.type],
            );
            this.props.closeMenu();
          };
        }
      }
    }

    return (
      <NestedContextMenu
        key="config-series-menu"
        closeMenu={this.props.closeMenu}
        menuItems={menuItems}
        orientation={this.state.orientation}
        parentBbox={bbox}
        position={position}
        theme={this.props.theme}
      />
    );
  }

  /**
   * Return a list of track types that can be used
   * with the data for this track
   *
   * @param {Object} position The position where to draw ths menu (e.g. {left: 42, top: 88})
   *
   * @param {Object} bbox
   *  The bounding box of the parent menu, used to determine whether
   *  to draw the child menu on the left or the right
   *
   * @param {{ uid: string, type: string, datatype: string }} track The track definition for this series (as in the viewconf)
   */
  getTrackTypeItems(position, bbox, track) {
    // if we've loaded external track types, list them here
    if (window.higlassTracksByType) {
      // Extend `TRACKS_INFO_BY_TYPE` with the configs of plugin tracks.
      for (const pluginTrackType of Object.keys(window.higlassTracksByType)) {
        TRACKS_INFO_BY_TYPE[pluginTrackType] =
          window.higlassTracksByType[pluginTrackType].config;
      }
    }

    let { datatype } = track;

    let orientation = null;
    // make sure that this is a valid track type before trying to
    // look up other tracks that can substitute for it
    if (track.type in TRACKS_INFO_BY_TYPE) {
      if (!datatype) {
        datatype = TRACKS_INFO_BY_TYPE[track.type].datatype[0];
      }
      ({ orientation } = TRACKS_INFO_BY_TYPE[track.type]);
    }

    // see which other tracks can display a similar datatype
    const availableTrackTypes = Object.values(TRACKS_INFO_BY_TYPE)
      .filter((x) => x.datatype)
      .filter((x) => x.orientation)
      .filter((x) => x.datatype.includes(datatype))
      .filter((x) => x.orientation === orientation)
      .map((x) => x.type);

    /** @type {Record<string, MenuItem>} */
    const menuItems = {};
    for (let i = 0; i < availableTrackTypes.length; i++) {
      menuItems[availableTrackTypes[i]] = {
        value: availableTrackTypes[i],
        name: availableTrackTypes[i],
        handler: () => {
          this.props.onChangeTrackType(track.uid, availableTrackTypes[i]);
        },
      };
    }

    return (
      <NestedContextMenu
        key="track-type-items"
        closeMenu={this.props.closeMenu}
        menuItems={menuItems}
        orientation={this.state.orientation}
        parentBbox={bbox}
        position={position}
        theme={this.props.theme}
      />
    );
  }

  getSubmenu() {
    if (this.state.submenuShown) {
      // the bounding box of the element which initiated the subMenu
      // necessary so that we can position the submenu next to the initiating
      // element
      /** @type {DOMRect} */
      // @ts-expect-error - parent class ContextMenuContainer requires typing
      const bbox = this.state.submenuSourceBbox;
      const position =
        this.state.orientation === 'left'
          ? {
              left: this.state.left,
              top: bbox.top,
            }
          : {
              left: this.state.left + bbox.width + 7,
              top: bbox.top,
            };

      // When a submenu is requested, the onMouseEnter handler of the
      // item that requested it provides a structure containing the option
      // picked as well as some data associated with it
      // e.g. {"option": "configure-series", data: track}
      /** @type {{option:  string, value: { uid: string, type: string, datatype: string, options: Record<string, unknown> }}} */
      const subMenuData = this.state.submenuShown;
      const track = subMenuData.value;

      if (subMenuData.option === 'track-type') {
        return this.getTrackTypeItems(position, bbox, track);
      }
      return this.getConfigureSeriesMenu(position, bbox, track);
    }

    return <div />;
  }

  getDivideByMenuItem() {
    if (this.props.series.data && this.props.series.data.type === 'divided') {
      const newData = {
        tilesetUid: this.props.series.data.children[0].tilesetUid,
        server: this.props.series.data.children[0].server,
      };

      // this track is already being divided
      return (
        <ContextMenuItem
          className={classes['context-menu-item']}
          onClick={() =>
            this.props.onChangeTrackData(this.props.series.uid, newData)
          }
          onMouseEnter={(e) => this.handleOtherMouseEnter()}
        >
          <span className={classes['context-menu-span']}>Remove divisor</span>
        </ContextMenuItem>
      );
    }

    return (
      <ContextMenuItem
        className={classes['context-menu-item']}
        onClick={() => this.props.onAddDivisor(this.props.series)}
        onMouseEnter={(e) => this.handleOtherMouseEnter()}
      >
        <span className={classes['context-menu-span']}>Divide by</span>
      </ContextMenuItem>
    );
  }

  componentWillUnmount() {}

  render() {
    let exportDataMenuItem = null;

    const trackContextMenuItems = findTrackContextMenuItems(
      this.props.track,
      this.props.trackRenderer,
      this.props.position,
    );

    if (
      TRACKS_INFO_BY_TYPE[this.props.series.type] &&
      TRACKS_INFO_BY_TYPE[this.props.series.type].exportable
    ) {
      exportDataMenuItem = (
        <ContextMenuItem
          className={classes['context-menu-item']}
          onClick={() =>
            this.props.onExportData(
              this.props.hostTrack.uid,
              this.props.track.uid,
            )
          }
          onMouseEnter={(e) => this.handleOtherMouseEnter()}
        >
          <span className={classes['context-menu-span']}>Export Data</span>
        </ContextMenuItem>
      );
    }

    // if a track can't be replaced, this.props.onAddSeries
    // will be null so we don't need to display the menu item
    const replaceSeriesItem = this.props.onAddSeries ? (
      <ContextMenuItem
        className={classes['context-menu-item']}
        onClick={() => {
          this.props.onCloseTrack(this.props.series.uid);
          this.props.onAddSeries(this.props.hostTrack.uid);
        }}
        onMouseEnter={(e) => this.handleOtherMouseEnter()}
      >
        <span className={classes['context-menu-span']}>Replace Series</span>
      </ContextMenuItem>
    ) : null;

    return (
      <div
        ref={(c) => {
          this.div = c;
        }}
        className={clsx(classes['context-menu'], {
          [classes['context-menu-dark']]: this.props.theme === THEME_DARK,
        })}
        data-menu-type="SeriesListMenu"
        onMouseLeave={this.props.handleMouseLeave}
        style={{
          left: this.state.left,
          top: this.state.top,
        }}
      >
        {trackContextMenuItems.map((x) => (
          <ContextMenuItem
            key={x.label}
            onClick={(evt) => {
              x.onClick(evt, (newOptions) => {
                // We're going to pass in a handler to that the track
                // can use to change its options
                this.props.onTrackOptionsChanged(this.props.track.uid, {
                  ...this.props.track.options,
                  ...newOptions,
                });
              });
              this.props.closeMenu();
            }}
            onMouseEnter={(e) => this.handleOtherMouseEnter()}
            className={classes['context-menu-item']}
          >
            <span className={classes['context-menu-span']}>{x.label}</span>
          </ContextMenuItem>
        ))}
        {trackContextMenuItems.length > 0 && (
          <hr className={classes['context-menu-hr']} />
        )}
        <ContextMenuItem
          onClick={() => {}}
          onMouseEnter={(e) =>
            this.handleItemMouseEnter(e, {
              option: 'configure-series',
              value: this.props.track,
            })
          }
          onMouseLeave={(e) => this.handleMouseLeave()}
        >
          Configure Series
          <svg className={classes['play-icon']}>
            <title>Play</title>
            <use xlinkHref="#play" />
          </svg>
        </ContextMenuItem>

        <ContextMenuItem
          className={classes['context-menu-item']}
          onClick={() => {}}
          onMouseEnter={(e) =>
            this.handleItemMouseEnter(e, {
              option: 'track-type',
              value: this.props.track,
            })
          }
          onMouseLeave={(e) => this.handleMouseLeave()}
        >
          <span className={classes['context-menu-span']}>
            Track Type
            <svg className={classes['play-icon']}>
              <title>Play</title>
              <use xlinkHref="#play" />
            </svg>
          </span>
        </ContextMenuItem>

        <ContextMenuItem
          className={classes['context-menu-item']}
          onClick={() => {
            this.props.apiPublish('datasetInfo', this.props.track);
            this.props.closeMenu();
          }}
          onMouseEnter={(e) => this.handleOtherMouseEnter()}
        >
          <span className={classes['context-menu-span']}>Dataset Info</span>
        </ContextMenuItem>

        {exportDataMenuItem}

        {this.getDivideByMenuItem()}

        <ContextMenuItem
          className={classes['context-menu-item']}
          onClick={this.props.onCloseTrack}
          onMouseEnter={(e) => this.handleOtherMouseEnter()}
        >
          <span className={classes['context-menu-span']}>Close Series</span>
        </ContextMenuItem>

        {replaceSeriesItem}

        {/*
          this.props.series.type === 'heatmap' ?
          <ContextMenuItem
            onClick={() => {
              this.props.onDivideSeries(this.props.series.uid);
              // this.props.onCloseTrack(this.props.series.uid);
              // this.props.onAddSeries(this.props.hostTrack.uid);
            }}
            onMouseEnter={e => this.handleOtherMouseEnter(e)}
            className={classes["context-menu-item"]}
          >
            <span className={classes["context-menu-span"]}>
              {'Divide Series By'}
            </span>
          </ContextMenuItem>
          : null
        */}

        {this.getSubmenu()}
      </div>
    );
  }
}
