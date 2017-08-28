import '../styles/AddTrackPositionMenu.css';

import React from 'react';

export class AddTrackPositionMenu extends React.Component {
    constructor(props) {
        super(props);

        // console.log('props:', props);

    }

    render() {
        return(
            <div>
            <div className="add-track-position-span">Add Track...</div>
                <table className="add-track-position-table">
                    <tbody>
                        <tr>
                            <td className='add-track-position-other'></td>
                            <td
                                className="add-track-position-top-center"
                                onClick={e => this.props.onTrackPositionChosen('top') }
                            >{"top"}</td>
                            <td className='add-track-position-other'></td>
                        </tr>
                        <tr style={{height: "80px"}}>
                            <td
                                onClick={e => this.props.onTrackPositionChosen('left')}
                                className="add-track-position-middle-left"
                            >{"left"}</td>
                            <td className="add-track-position-middle-middle"
                                onClick={e => this.props.onTrackPositionChosen('center')}
                            >{"center"}</td>
                            <td className="add-track-position-middle-right"
                                onClick={e => this.props.onTrackPositionChosen('right')}
                            >{"right"}</td>
                        </tr>
                        <tr>
                            <td className='add-track-position-other'></td>
                            <td className="add-track-position-bottom-middle"
                                onClick={e => this.props.onTrackPositionChosen('bottom')}
                            >{"bottom"}</td>
                            <td className='add-track-position-other'></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        )
    }
}

export default AddTrackPositionMenu;
