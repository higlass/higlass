import "../styles/TiledPlot.css";
import slugid from 'slugid';
import React from 'react';
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc';
import {VerticalTiledPlot} from './VerticalTiledPlot.jsx';
import {HorizontalTiledPlot} from './HorizontalTiledPlot.jsx';

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
			{items.map((item, index) =>
				<Item
					className={itemClass}
					height={item.height}
					index={index}
					key={slugid.nice()}
					sortingIndex={sortingIndex}
					useDragHandle={useDragHandle}
					value={item.value}
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
                                <HorizontalTiledPlot
                                    width={300}
                                    tracks={this.props.tracks['top']}
                                />
                            </td>
                        <td />
                    </tr>
                    <tr>
                        <td>
                            <VerticalTiledPlot
                                height={300}
                                tracks={this.props.tracks['left']}
                            />

                        </td>
                        <td>
                            {"Middle Tracks"}
                        </td>
                        <td>
                            <VerticalTiledPlot
                                height={300}
                                tracks={this.props.tracks['right']}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td />
                        <td>
                            <HorizontalTiledPlot
                                width={300}
                                tracks={this.props.tracks['bottom']}
                            />
                        </td>
                        <td />
                    </tr>
                </tbody>
            </table>
            );
    }
}
