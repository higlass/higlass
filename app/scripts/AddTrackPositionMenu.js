import PropTypes from 'prop-types';
import React from 'react';

import '../styles/AddTrackPositionMenu.module.scss';

export const AddTrackPositionMenu = props => (
  <div>
    <div styleName="add-track-position-span">{'Add Track...'}</div>
    <table styleName="add-track-position-table">
      <tbody>
        <tr>
          <td styleName="add-track-position-other"></td>
          <td
            onClick={() => props.onTrackPositionChosen('top')}
            styleName="add-track-position-top-center"
          >{"top"}</td>
          <td styleName="add-track-position-other"></td>
        </tr>
        <tr style={{height: "80px"}}>
          <td
            onClick={() => props.onTrackPositionChosen('left')}
            styleName="add-track-position-middle-left"
          >{"left"}</td>
          <td
            onClick={() => props.onTrackPositionChosen('center')}
            styleName="add-track-position-middle-middle"
          >{"center"}</td>
          <td
            onClick={() => props.onTrackPositionChosen('right')}
            styleName="add-track-position-middle-right"
          >{"right"}</td>
        </tr>
        <tr>
          <td styleName="add-track-position-other"></td>
          <td
            onClick={() => props.onTrackPositionChosen('bottom')}
            styleName="add-track-position-bottom-middle"
          >{"bottom"}</td>
          <td styleName="add-track-position-other"></td>
        </tr>
      </tbody>
    </table>
  </div>
);

AddTrackPositionMenu.propTypes = {
  onTrackPositionChosen: PropTypes.func
};

export default AddTrackPositionMenu;
