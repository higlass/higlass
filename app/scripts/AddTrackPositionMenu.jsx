import React from 'react';
import ReactDOM from 'react-dom';

import {ContextMenuContainer, ContextMenuItem} from './ContextMenuContainer.jsx';

export class AddTrackPositionMenu extends React.Component {
    constructor(props) {
        super(props);

        console.log('props:', props);

    }

    render() {
        return(
            <div
                ref={c => this.div = c}
            >
                <table>
                    <tbody>
                        <tr>
                            <td>1</td><td>2</td><td>3</td>
                        </tr>
                        <tr>
                            <td>4</td><td>5</td><td>6</td>
                        </tr>
                        <tr>
                            <td>7</td><td>8</td><td>9</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        )
    }
}
