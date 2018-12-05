import PropTypes from 'prop-types';
import React from 'react';

import { getDarkTheme } from './services/is-dark-theme';

import '../styles/AddTrackPositionMenu.module.scss';

class AddTrackPositionMenu extends React.Component {
  render() {
    let tableStyleNames = 'add-track-position-table';
    if (getDarkTheme()) tableStyleNames += ' add-track-position-table-dark';

    return (
      <div>
        <div styleName="add-track-position-span">Add Track...</div>
        <table styleName={tableStyleNames}>
          <tbody>
            <tr style={{ height: '30px' }}>
              <td styleName="add-track-position-other" />
              <td
                onClick={() => this.props.onTrackPositionChosen('top')}
                styleName="add-track-position-top-center"
              >
{'top'}
              </td>
              <td styleName="add-track-position-other" />
            </tr>
            <tr style={{ height: '80px' }}>
              <td
                onClick={() => this.props.onTrackPositionChosen('left')}
                styleName="add-track-position-middle-left"
              >
{'left'}
              </td>
              <td
                onClick={() => this.props.onTrackPositionChosen('center')}
                styleName="add-track-position-middle-middle"
              >
{'center'}
              </td>
              <td
                onClick={() => this.props.onTrackPositionChosen('right')}
                styleName="add-track-position-middle-right"
              >
{'right'}
              </td>
            </tr>
            <tr style={{ height: '30px' }}>
              <td styleName="add-track-position-other" />
              <td
                onClick={() => this.props.onTrackPositionChosen('bottom')}
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
}

AddTrackPositionMenu.propTypes = {
  onTrackPositionChosen: PropTypes.func.isRequired,
};

export default AddTrackPositionMenu;
