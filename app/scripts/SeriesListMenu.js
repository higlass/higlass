import React from 'react';

import ContextMenuContainer from './ContextMenuContainer';
import ContextMenuItem from './ContextMenuItem';
import NestedContextMenu from './NestedContextMenu';

// Configs
import { OPTIONS_INFO, THEME_DARK, TRACKS_INFO_BY_TYPE } from './configs';

// Styles
import '../styles/ContextMenu.module.scss';

export default class SeriesListMenu extends ContextMenuContainer {
  getConfigureSeriesMenu(position, bbox, track) {
    const menuItems = {};

    // plugin tracks can offer their own options
    // if they clash with the default higlass options
    // they will override them
    const pluginOptionsInfo =
      window.higlassTracksByType &&
      window.higlassTracksByType[track.type] &&
      window.higlassTracksByType[track.type].config &&
      window.higlassTracksByType[track.type].config.optionsInfo;

    if (pluginOptionsInfo) {
      for (const key of Object.keys(pluginOptionsInfo)) {
        OPTIONS_INFO[key] = pluginOptionsInfo[key];
      }
    }

    if (
      !TRACKS_INFO_BY_TYPE[track.type] ||
      !TRACKS_INFO_BY_TYPE[track.type].availableOptions
    ) {
      return null;
    }

    for (const optionType of TRACKS_INFO_BY_TYPE[track.type].availableOptions) {
      if (optionType in OPTIONS_INFO) {
        menuItems[optionType] = { name: OPTIONS_INFO[optionType].name };

        // can we dynamically generate some options?
        // should be used if the options depend on tileset info or other current state
        if (OPTIONS_INFO[optionType].generateOptions) {
          const generatedOptions = OPTIONS_INFO[optionType].generateOptions(
            track,
          );

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

            menuItems[optionType].children[
              generatedOption.value
            ] = optionSelectorSettings;
          }
        }

        if (OPTIONS_INFO[optionType].inlineOptions) {
          // we can simply select this option from the menu
          for (const inlineOptionKey in OPTIONS_INFO[optionType]
            .inlineOptions) {
            const inlineOption =
              OPTIONS_INFO[optionType].inlineOptions[inlineOptionKey];

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
            };

            // is there a custom component available for picking this
            // option type value (e.g. 'custom' color scale)
            if (
              inlineOption.componentPickers &&
              inlineOption.componentPickers[track.type]
            ) {
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

            menuItems[optionType].children[
              inlineOptionKey
            ] = optionSelectorSettings;
          }
        } else if (
          OPTIONS_INFO[optionType].componentPickers &&
          OPTIONS_INFO[optionType].componentPickers[track.type]
        ) {
          // there's an option picker registered
          menuItems[optionType].handler = () => {
            this.props.onConfigureTrack(
              track,
              OPTIONS_INFO[optionType].componentPickers[track.type],
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
   * @param (Object) bbox
   *  The bounding box of the parent menu, used to determine whether
   *  to draw the child menu on the left or the right
   *
   * @param (Object) track The track definition for this series (as in the viewconf)
   */
  getTrackTypeItems(position, bbox, track) {
    // get the datatype of the current track
    //

    // if we've loaded external track types, list them here
    if (window.higlassTracksByType) {
      // Extend `TRACKS_INFO_BY_TYPE` with the configs of plugin tracks.
      Object.keys(window.higlassTracksByType).forEach((pluginTrackType) => {
        TRACKS_INFO_BY_TYPE[pluginTrackType] =
          window.higlassTracksByType[pluginTrackType].config;
      });
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
          onClick={() =>
            this.props.onChangeTrackData(this.props.series.uid, newData)
          }
          onMouseEnter={(e) => this.handleOtherMouseEnter(e)}
          styleName="context-menu-item"
        >
          <span styleName="context-menu-span">Remove divisor</span>
        </ContextMenuItem>
      );
    }

    return (
      <ContextMenuItem
        onClick={() => this.props.onAddDivisor(this.props.series)}
        onMouseEnter={(e) => this.handleOtherMouseEnter(e)}
        styleName="context-menu-item"
      >
        <span styleName="context-menu-span">Divide by</span>
      </ContextMenuItem>
    );
  }

  componentWillUnmount() {}

  render() {
    let exportDataMenuItem = null;

    if (
      TRACKS_INFO_BY_TYPE[this.props.series.type] &&
      TRACKS_INFO_BY_TYPE[this.props.series.type].exportable
    ) {
      exportDataMenuItem = (
        <ContextMenuItem
          onClick={() =>
            this.props.onExportData(
              this.props.hostTrack.uid,
              this.props.track.uid,
            )
          }
          onMouseEnter={(e) => this.handleOtherMouseEnter(e)}
          styleName="context-menu-item"
        >
          <span styleName="context-menu-span">Export Data</span>
        </ContextMenuItem>
      );
    }

    // if a track can't be replaced, this.props.onAddSeries
    // will be null so we don't need to display the menu item
    const replaceSeriesItem = this.props.onAddSeries ? (
      <ContextMenuItem
        onClick={() => {
          this.props.onCloseTrack(this.props.series.uid);
          this.props.onAddSeries(this.props.hostTrack.uid);
        }}
        onMouseEnter={(e) => this.handleOtherMouseEnter(e)}
        styleName="context-menu-item"
      >
        <span styleName="context-menu-span">Replace Series</span>
      </ContextMenuItem>
    ) : null;

    let styleNames = 'context-menu';
    if (this.props.theme === THEME_DARK) styleNames += ' context-menu-dark';

    return (
      <div
        ref={(c) => {
          this.div = c;
        }}
        data-menu-type="SeriesListMenu"
        onMouseLeave={this.props.handleMouseLeave}
        style={{
          left: this.state.left,
          top: this.state.top,
        }}
        styleName={styleNames}
      >
        <ContextMenuItem
          onClick={() => {}}
          onMouseEnter={(e) =>
            this.handleItemMouseEnter(e, {
              option: 'configure-series',
              value: this.props.track,
            })
          }
          onMouseLeave={(e) => this.handleMouseLeave(e)}
        >
          {'Configure Series'}
          <svg styleName="play-icon">
            <use xlinkHref="#play" />
          </svg>
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => {}}
          onMouseEnter={(e) =>
            this.handleItemMouseEnter(e, {
              option: 'track-type',
              value: this.props.track,
            })
          }
          onMouseLeave={(e) => this.handleMouseLeave(e)}
          styleName="context-menu-item"
        >
          <span styleName="context-menu-span">
            {'Track Type'}
            <svg styleName="play-icon">
              <use xlinkHref="#play" />
            </svg>
          </span>
        </ContextMenuItem>

        {exportDataMenuItem}

        {this.getDivideByMenuItem()}

        <ContextMenuItem
          onClick={this.props.onCloseTrack}
          onMouseEnter={(e) => this.handleOtherMouseEnter(e)}
          styleName="context-menu-item"
        >
          <span styleName="context-menu-span">Close Series</span>
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
            styleName="context-menu-item"
          >
            <span styleName="context-menu-span">
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
