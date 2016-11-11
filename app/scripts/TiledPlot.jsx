import "../styles/TiledPlot.css";
import slugid from 'slugid';
import React from 'react';
import ReactDOM from 'react-dom';
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc';
import {VerticalTiledPlot} from './VerticalTiledPlot.jsx';
import {HorizontalTiledPlot} from './HorizontalTiledPlot.jsx';
import {ResizeSensor,ElementQueries} from 'css-element-queries';

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

        // these values should be changed in componentDidMount
        this.state = {
            height: 10,
            width: 10
        }
    }

    componentDidMount() {
        this.element = ReactDOM.findDOMNode(this);
        ElementQueries.listen();
        new ResizeSensor(this.element, function() {
            console.log('resized:', this.element.clientWidth, this.element.clientHeight);
            let heightOffset = this.element.offsetTop - this.element.parentNode.offsetTop

                console.log('heightOffset:', heightOffset);

            this.setState({
                height: this.element.clientHeight - heightOffset,
                width: this.element.clientWidth
            });
        }.bind(this));
    }

    render() {
        // left, top, right, and bottom have fixed heights / widths
        // the center will vary to accomodate their dimensions
        let topHeight = this.props.tracks['top']
            .map((x) => { return x.height; })
            .reduce((a,b) => { return a + b; }, 0);
        let bottomHeight = this.props.tracks['bottom']
            .map((x) => { return x.height; })
            .reduce((a,b) => { return a + b; }, 0);
        let leftWidth = this.props.tracks['left']
            .map((x) => { return x.width; })
            .reduce((a,b) => { return a + b; }, 0);
        let rightWidth = this.props.tracks['right']
            .map((x) => { return x.width; })
            .reduce((a,b) => { return a + b; }, 0);

        let centerHeight = this.state.height - topHeight - bottomHeight;
        let centerWidth = this.state.width - leftWidth - rightWidth;

        console.log('centerWidth:', centerWidth, 'centerHeight', centerHeight);

        return(
            <div style={{width: "100%", height: "100%"}}>
                <table>
                    <tbody>          
                        <tr>
                            <td />
                                <td>
                                    <HorizontalTiledPlot
                                        tracks={this.props.tracks['top']}
                                        width={centerWidth}
                                    />
                                </td>
                            <td />
                        </tr>
                        <tr>
                            <td>
                                <VerticalTiledPlot
                                    height={centerHeight}
                                    tracks={this.props.tracks['left']}
                                />

                            </td>
                            <td>
                                {"Middle Tracks"}
                            </td>
                            <td>
                                <VerticalTiledPlot
                                    height={centerHeight}
                                    tracks={this.props.tracks['right']}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td />
                            <td>
                                <HorizontalTiledPlot
                                    tracks={this.props.tracks['bottom']}
                                    width={centerWidth}
                                />
                            </td>
                            <td />
                        </tr>
                    </tbody>
                </table>
            </div>
            );
    }
}

TiledPlot.propTypes = {
    tracks: React.PropTypes.object,
    "tracks.top": React.PropTypes.array,
    "tracks.bottom": React.PropTypes.array,
    "tracks.left": React.PropTypes.array,
    "tracks.right": React.PropTypes.array
}
