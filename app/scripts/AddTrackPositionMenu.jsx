// @ts-nocheck
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import { THEME_DARK } from './configs';
import withTheme from './hocs/with-theme';

import classes from '../styles/AddTrackPositionMenu.module.scss';

function AddTrackPositionMenu(props) {
  return (
    <div>
      <div className={classes['add-track-position-span']}>Add Track...</div>
      <table
        className={clsx(classes['add-track-position-table'], {
          [classes['add-track-position-table-dark']]:
            props.theme === THEME_DARK,
        })}
      >
        <tbody>
          <tr style={{ height: '30px' }}>
            <td
              aria-hidden="true"
              className={classes['add-track-position-other']}
            />
            <td
              className={classes['add-track-position-top-center']}
              onClick={() => props.onTrackPositionChosen('top')}
            >
              top
            </td>
            <td
              aria-hidden="true"
              className={classes['add-track-position-other']}
            />
          </tr>
          <tr style={{ height: '80px' }}>
            <td
              className={classes['add-track-position-middle-left']}
              onClick={() => props.onTrackPositionChosen('left')}
            >
              left
            </td>
            <td className={classes['add-track-position-middle-middle']}>
              <span
                onClick={() => props.onTrackPositionChosen('center')}
                className={classes['add-track-position-middle-middle-full']}
              >
                center
              </span>
              <span
                onClick={() =>
                  props.onTrackPositionChosen('center', 'upper-right')
                }
                className={
                  classes['add-track-position-middle-middle-upper-right']
                }
              />
              <span
                onClick={() =>
                  props.onTrackPositionChosen('center', 'lower-left')
                }
                className={
                  classes['add-track-position-middle-middle-lower-left']
                }
              />
            </td>
            <td
              className={classes['add-track-position-middle-right']}
              onClick={() => props.onTrackPositionChosen('right')}
            >
              right
            </td>
          </tr>
          <tr style={{ height: '30px' }}>
            <td
              aria-hidden="true"
              className={classes['add-track-position-other']}
            />
            <td
              className={classes['add-track-position-bottom-middle']}
              onClick={() => props.onTrackPositionChosen('bottom')}
            >
              bottom
            </td>
            <td
              aria-hidden="true"
              className={classes['add-track-position-other']}
            />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

AddTrackPositionMenu.propTypes = {
  onTrackPositionChosen: PropTypes.func.isRequired,
  theme: PropTypes.symbol.isRequired,
};

export default withTheme(AddTrackPositionMenu);
