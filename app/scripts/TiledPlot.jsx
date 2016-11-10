import React from 'react';
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc';

const SortableItem = SortableElement(({value}) => <li>{value}</li>);

const SortableList = SortableContainer(({items}) => {
    return (
        <ul>
            {items.map((value, index) =>
                <SortableItem key={`item-${index}`} index={index} value={value} />
            )}
        </ul>
    );
});


export class TiledPlot extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return(
            <table>
                <tbody>          
                    <tr>
                        <td />
                            <td>
                                <SortableList 
                                    items={this.props.tracks['top']} 
                                />
                            </td>
                        <td />
                    </tr>
                    <tr>
                        <td>
                            {"Left Tracks"}
                        </td>
                        <td>
                            {"Middle Tracks"}
                        </td>
                        <td>
                            {"Right Tracks"}
                        </td>
                    </tr>
                    <tr>
                        <td />
                        <td>
                            {"Bottom Tracks"}
                        </td>
                        <td />
                    </tr>
                </tbody>
            </table>
            );
    }
}
