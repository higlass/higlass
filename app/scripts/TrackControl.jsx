import PropTypes from 'prop-types';
import React from 'react';
import { SortableHandle } from 'react-sortable-hoc';

import withTheme from './hocs/with-theme';
import { THEME_DARK } from './configs';

// Styles
import classes from '../styles/TrackControl.module.scss';

const getClassNames = (props) => {
  const classNames = [props.isVisible ? 'track-control-active' : 'track-control'];
  if (props.isAlignLeft) classNames.push('track-control-left');
  if (props.isVertical) classNames.push('track-control-vertical');
  if (props.paddingRight) classNames.push('track-control-padding-right');
  if (props.theme === THEME_DARK) classNames.push('track-control-dark');
  return classNames.map(name => classes[name]);
};

const getButtonClassNames = (props) => {
  const buttonClassNames = ['track-control-button'];
  if (props.isVertical) {
    buttonClassNames.push('track-control-button-vertical');
  }
  return buttonClassNames.map(name => classes[name]);
};

let oldProps = null;
let DragHandle = null;

const TrackControl = (props) => {
  // Avoid constant recreating that button when the props didn't change.
  // Damn React could be a little smarter here...
  if (
    !props ||
    !oldProps ||
    Object.keys(props).some((key) => oldProps[key] !== props[key])
  ) {
    oldProps = props;
    DragHandle = SortableHandle(() => (
      <svg
        className={["no-zoom", ...getButtonClassNames(props)].join(" ")}
        style={Object.assign(
          { height: '20px', width: '20px' },
          props.imgStyleMove,
        )}
      >
        <title>Move track</title>
        <use xlinkHref="#move" />
      </svg>
    ));
  }

  let imgConfig;
  let imgClose;

  return (
    <div className={getClassNames(props).join(" ")}>
      {props.isMoveable && <DragHandle />}

      <svg
        ref={(c) => {
          imgConfig = c;
        }}
        className={["no-zoom", ...getButtonClassNames(props)].join(" ")}
        onClick={() => {
          props.onConfigTrackMenuOpened(
            props.uid,
            imgConfig.getBoundingClientRect(),
          );
        }}
        style={Object.assign(
          { height: '20px', width: '20px' },
          props.imgStyleSettings,
        )}
      >
        <title>Configure track</title>
        <use xlinkHref="#cog" />
      </svg>

      {props.onAddSeries && (
        <svg
          className={["no-zoom", ...getButtonClassNames(props)].join(" ")}
          onClick={() => props.onAddSeries(props.uid)}
          style={Object.assign(
            { height: '20px', width: '20px' },
            props.imgStyleAdd,
          )}
        >
          <title>Add series</title>
          <use xlinkHref="#plus" />
        </svg>
      )}

      <svg
        ref={(c) => {
          imgClose = c;
        }}
        className={["no-zoom", ...getButtonClassNames(props)].join(" ")}
        onClick={() => {
          props.onCloseTrackMenuOpened(
            props.uid,
            imgClose.getBoundingClientRect(),
          );
        }}
        style={Object.assign(
          { height: '20px', width: '20px' },
          props.imgStyleClose,
        )}
      >
        <title>Close track</title>
        <use xlinkHref="#cross" />
      </svg>
    </div>
  );
};

TrackControl.propTypes = {
  imgStyleAdd: PropTypes.object,
  imgStyleClose: PropTypes.object,
  imgStyleMove: PropTypes.object,
  imgStyleSettings: PropTypes.object,
  isAlignLeft: PropTypes.bool,
  isMoveable: PropTypes.bool,
  isVertical: PropTypes.bool,
  isVisible: PropTypes.bool,
  onConfigTrackMenuOpened: PropTypes.func,
  onCloseTrackMenuOpened: PropTypes.func,
  onAddSeries: PropTypes.func,
  paddingRight: PropTypes.bool,
  theme: PropTypes.symbol.isRequired,
  uid: PropTypes.string,
};

export default withTheme(TrackControl);
