// @ts-nocheck
import PropTypes from 'prop-types';
import React from 'react';
import clsx from 'clsx';

import withTheme from './hocs/with-theme';
import { THEME_DARK } from './configs';

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
            <td
              className={classes['add-track-position-middle-middle']}
              onClick={() => props.onTrackPositionChosen('center')}
            >
              center
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
