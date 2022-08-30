import PropTypes from 'prop-types';
import React from 'react';
import { SortableHandle } from 'react-sortable-hoc';

import withTheme from './hocs/with-theme';
import { THEME_DARK } from './configs';

// Styles
import '../styles/TrackControl.module.scss';

const getClassNames = (props) => {
  let className = props.isVisible ? 'track-control-active' : 'track-control';

  className += props.isAlignLeft ? ' track-control-left' : '';

  className += props.isVertical ? ' track-control-vertical' : '';

  className += props.paddingRight ? ' track-control-padding-right' : '';

  if (props.theme === THEME_DARK) className += ' track-control-dark';

  return className;
};

const getButtonClassNames = (props) => {
  let buttonClassName = 'track-control-button';

  buttonClassName += props.isVertical ? ' track-control-button-vertical' : '';

  return buttonClassName;
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
        className="no-zoom"
        style={Object.assign(
          { height: '20px', width: '20px' },
          props.imgStyleMove,
        )}
        styleName={getButtonClassNames(props)}
      >
        <title>Move track</title>
        <use xlinkHref="#move" />
      </svg>
    ));
  }

  let imgConfig;
  let imgClose;

  return (
    <div styleName={getClassNames(props)}>
      {props.isMoveable && <DragHandle />}

      <svg
        ref={(c) => {
          imgConfig = c;
        }}
        className="no-zoom"
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
        styleName={getButtonClassNames(props)}
      >
        <title>Configure track</title>
        <use xlinkHref="#cog" />
      </svg>

      {props.onAddSeries && (
        <svg
          className="no-zoom"
          onClick={() => props.onAddSeries(props.uid)}
          style={Object.assign(
            { height: '20px', width: '20px' },
            props.imgStyleAdd,
          )}
          styleName={getButtonClassNames(props)}
        >
          <title>Add series</title>
          <use xlinkHref="#plus" />
        </svg>
      )}

      <svg
        ref={(c) => {
          imgClose = c;
        }}
        className="no-zoom"
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
        styleName={getButtonClassNames(props)}
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
