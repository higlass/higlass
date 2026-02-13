// @ts-nocheck
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import { THEME_DARK } from './configs';
import withTheme from './hocs/with-theme';

// Styles
import classes from '../styles/TrackControl.module.scss';

const getClassName = (props) =>
  clsx({
    [classes['track-control-active']]: props.isVisible,
    [classes['track-control']]: !props.isVisible,
    [classes['track-control-left']]: props.isAlignLeft,
    [classes['track-control-vertical']]: props.isVertical,
    [classes['track-control-padding-right']]: props.paddingRight,
    [classes['track-control-dark']]: props.theme === THEME_DARK,
  });

const getButtonClassName = (props) =>
  clsx('no-zoom', classes['track-control-button'], {
    [classes['track-control-button-vertical']]: props.isVertical,
  });

function TrackControl(props) {
  const { dragHandleProps } = props;

  let imgConfig;
  let imgClose;

  return (
    <div className={getClassName(props)}>
      {props.isMoveable && (
        <svg
          className={getButtonClassName(props)}
          style={{
            height: '20px',
            width: '20px',
            ...props.imgStyleMove,
          }}
          {...dragHandleProps}
        >
          <title>Move track</title>
          <use xlinkHref="#move" />
        </svg>
      )}

      {/* Show collapse button */}
      {props.expandCollapseAvailable && !props.isCollapsed && (
        <svg
          ref={(c) => {
            imgConfig = c;
          }}
          className={getButtonClassName(props)}
          onClick={() => {
            props.onCollapseTrack(props.uid);
          }}
          style={{
            height: '20px',
            width: '20px',
            ...props.imgStyleSettings,
          }}
        >
          <title>Collapse track</title>
          <use xlinkHref="#collapse" />
        </svg>
      )}

      {/* Show expand button */}
      {props.expandCollapseAvailable && props.isCollapsed && (
        <svg
          ref={(c) => {
            imgConfig = c;
          }}
          className={getButtonClassName(props)}
          onClick={() => {
            props.onExpandTrack(props.uid);
          }}
          style={{
            height: '20px',
            width: '20px',
            ...props.imgStyleSettings,
          }}
        >
          <title>Expand track</title>
          <use xlinkHref="#expand" />
        </svg>
      )}

      <svg
        ref={(c) => {
          imgConfig = c;
        }}
        className={getButtonClassName(props)}
        onClick={() => {
          props.onConfigTrackMenuOpened(
            props.uid,
            imgConfig.getBoundingClientRect(),
          );
        }}
        style={{
          height: '20px',
          width: '20px',
          ...props.imgStyleSettings,
        }}
      >
        <title>Configure track</title>
        <use xlinkHref="#cog" />
      </svg>

      {props.onAddSeries && (
        <svg
          className={getButtonClassName(props)}
          onClick={() => props.onAddSeries(props.uid)}
          style={{
            height: '20px',
            width: '20px',
            ...props.imgStyleAdd,
          }}
        >
          <title>Add series</title>
          <use xlinkHref="#plus" />
        </svg>
      )}

      <svg
        ref={(c) => {
          imgClose = c;
        }}
        className={getButtonClassName(props)}
        onClick={() => {
          props.onCloseTrackMenuOpened(
            props.uid,
            imgClose.getBoundingClientRect(),
          );
        }}
        style={{
          height: '20px',
          width: '20px',
          ...props.imgStyleClose,
        }}
      >
        <title>Close track</title>
        <use xlinkHref="#cross" />
      </svg>
    </div>
  );
}

TrackControl.propTypes = {
  imgStyleAdd: PropTypes.object,
  imgStyleClose: PropTypes.object,
  imgStyleMove: PropTypes.object,
  imgStyleSettings: PropTypes.object,
  isAlignLeft: PropTypes.bool,
  isMoveable: PropTypes.bool,
  isVertical: PropTypes.bool,
  isVisible: PropTypes.bool,
  onCollapseTrack: PropTypes.func,
  onExpandTrack: PropTypes.func,
  onConfigTrackMenuOpened: PropTypes.func,
  onCloseTrackMenuOpened: PropTypes.func,
  onAddSeries: PropTypes.func,
  paddingRight: PropTypes.bool,
  theme: PropTypes.symbol.isRequired,
  uid: PropTypes.string,
};

export default withTheme(TrackControl);
