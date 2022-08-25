import PropTypes from 'prop-types';
import React from 'react';

import withTheme from './hocs/with-theme';
import { THEME_DARK } from './configs';

import '../styles/AddTrackPositionMenu.module.scss';

function AddTrackPositionMenu(props) {
  let tableStyleNames = 'add-track-position-table';
  if (props.theme === THEME_DARK)
    tableStyleNames += ' add-track-position-table-dark';
  return (
    <div>
      <div styleName="add-track-position-span">Add Track...</div>
      <table styleName={tableStyleNames}>
        <tbody>
          <tr style={{ height: '30px' }}>
            <td styleName="add-track-position-other" />
            <td
              onClick={() => props.onTrackPositionChosen('top')}
              styleName="add-track-position-top-center"
            >
              top
            </td>
            <td styleName="add-track-position-other" />
          </tr>
          <tr style={{ height: '80px' }}>
            <td
              onClick={() => props.onTrackPositionChosen('left')}
              styleName="add-track-position-middle-left"
            >
              left
            </td>
            <td
              onClick={() => props.onTrackPositionChosen('center')}
              styleName="add-track-position-middle-middle"
            >
              center
            </td>
            <td
              onClick={() => props.onTrackPositionChosen('right')}
              styleName="add-track-position-middle-right"
            >
              right
            </td>
          </tr>
          <tr style={{ height: '30px' }}>
            <td styleName="add-track-position-other" />
            <td
              onClick={() => props.onTrackPositionChosen('bottom')}
              styleName="add-track-position-bottom-middle"
            >
              bottom
            </td>
            <td styleName="add-track-position-other" />
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
