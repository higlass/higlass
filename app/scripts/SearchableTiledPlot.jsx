import React from 'react';

export class SearchableTiledPlot extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(
            <table>
                <tbody>          
                    <tr>
                        <td />
                        <td>{"Top Tracks"}</td>
                        <td />
                    </tr>
                    <tr>
                        <td>{"Left Tracks"}</td>
                        <td>{"Middle Tracks"}</td>
                        <td>{"Right Tracks"}</td>
                    </tr>
                    <tr>
                        <td />
                        <td>{"Bottom Tracks"}</td>
                        <td />
                    </tr>
                </tbody>
            </table>
            )
    }
}
