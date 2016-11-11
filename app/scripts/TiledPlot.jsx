import "../styles/TiledPlot.css";
import slugid from 'slugid';
import React from 'react';
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc';

const Item = SortableElement((props) => {
    return (
        <div className={props.className} style={{
            height: props.height
        }}>
			{props.useDragHandle && <Handle/>}
            Item {props.value}
        </div>
    )
});

const SortableList = SortableContainer(({className, items, itemClass, sortingIndex, useDragHandle, sortableHandlers}) => {
	return (
		<div className={className} {...sortableHandlers}>
			{items.map(({value, height}, index) =>
				<Item
					key={slugid.nice()}
					className={itemClass}
					sortingIndex={sortingIndex}
					index={index}
					value={value}
					height={height}
					useDragHandle={useDragHandle}
				/>
			)}
		</div>
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
                            </td>
                        <td />
                    </tr>
                    <tr>
                        <td>
                            <SortableList 
                                axis={'x'}
                                helperClass={"stylizedHelper"}
                                className={"list stylizedList horizontalList"} 
                                itemClass={"stylizedItem horizontalItem"}
                                items={this.props.tracks['left']} 
                            />
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
