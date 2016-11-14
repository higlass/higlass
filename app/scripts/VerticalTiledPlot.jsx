import React from 'react';
import slugid from 'slugid';

import {SortableContainer, SortableElement, SortableHandle, arrayMove} from 'react-sortable-hoc';

class VerticalTrack extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            controlsVisible: false
        }
    }

    handleMouseEnter() {
        this.setState({
            controlsVisible: true
        });
    }

    handleMouseLeave() {
        this.setState({
            controlsVisible: false
        });
    }

    render() {
        let closeImgStyle = { right: 5,
                         top: 5,
                         position: 'absolute',
                         opacity: .5}
        let moveImgStyle = { right: 5,
                         top: 18,
                         position: 'absolute',
                         opacity: .5}

        let Handle = SortableHandle(() => 
                <img 
                    onClick={() => { this.handleCloseView(view.uid)}}
                    src="images/enlarge.svg" 
                    style={moveImgStyle}
                    width="8px" 
                />
                )
        let controls = null;

        if (this.state.controlsVisible) {
            controls = (<div><img 
                        onClick={() => { this.handleCloseView(view.uid)}}
                        src="images/cross.svg" 
                        style={closeImgStyle}
                        width="8px" 
                    />
                    <Handle />
                    </div>)
        }

        return (
            <div className={this.props.className} 
                style={{
                    height: this.props.height,
                    width: this.props.width,
                    position: "relative" }}
                onMouseEnter={this.handleMouseEnter.bind(this)}
                onMouseLeave={this.handleMouseLeave.bind(this)}
            >
                {this.props.value}
                {controls}
            </div>
        )

    }
}

const Item = SortableElement((props) => { 
    return (<VerticalTrack 
                                                    height={props.height}
                                                    width={props.width}
                                                    value={props.value}
                                                    className={props.className}
                                                />)});

const SortableList = SortableContainer(({className, items, itemClass, sortingIndex, useDragHandle, sortableHandlers,height, 
                                         width, handleCloseTrack}) => {
	return (
		<div className={className} 
            style={{height: height,
                    width: width}}
            {...sortableHandlers}>
			{items.map((item, index) =>
				<Item
					key={slugid.nice()}
					className={itemClass}
					sortingIndex={sortingIndex}
					index={index}
					value={item.value}
					height={height}
                    width={item.width}
					useDragHandle={useDragHandle}
                    handleCloseTrack={handleCloseTrack}
				/>
			)}
		</div>
	);
});

class ListWrapper extends React.Component {
	constructor({items}) {
		super();
		this.state = {
			items, isSorting: false
		};
	}

	onSortStart() {
		let {onSortStart} = this.props;
		this.setState({isSorting: true});

		if (onSortStart) {
			onSortStart(this.refs.component);
		}
	};

    onSortEnd({oldIndex, newIndex}) {
		let {onSortEnd} = this.props;
        let {items} = this.state;

        this.setState({items: arrayMove(items, oldIndex, newIndex), isSorting: false});

		if (onSortEnd) {
			onSortEnd(this.refs.component);
		}
    };
	render() {
		const Component = this.props.component;
		const {items, isSorting} = this.state;
		const props = {
			isSorting, items,
			onSortEnd: this.onSortEnd.bind(this),
			onSortStart: this.onSortStart.bind(this),
			ref: "component"
		}

		return <Component {...this.props} {...props} />
	}
}

ListWrapper.propTypes = {
    items: React.PropTypes.array,
    className: React.PropTypes.string,
    itemClass: React.PropTypes.string,
    width: React.PropTypes.number,

    onSortEnd: React.PropTypes.func,
    component: React.PropTypes.func
}

ListWrapper.defaultProps = {
    className: "list stylizedList",
    itemClass: "item stylizedItem",
    width: 400,
    height: 600
};


export class VerticalTiledPlot extends React.Component {
    constructor(props) {
        super(props);
    }


    render() {
        let thisWidth = this.props.tracks
            .map((x) => { return x.width; })
            .reduce((a,b) => { return a + b; }, 0);

        return (
                <ListWrapper
                    component={SortableList}
                    axis={'x'}
                    helperClass={"stylizedHelper"}
                    className={"list stylizedList horizontalList"} 
                    itemClass={"stylizedItem horizontalItem"}
                    items={this.props.tracks} 
                    height={this.props.height}
                    width={thisWidth}
                    useDragHandle={true}
                    closeTrack={this.props.handleCloseTrack}
                />
        )

    }
}

VerticalTiledPlot.propTypes = {
    tracks: React.PropTypes.array
}
