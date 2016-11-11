import React from 'react';
import slugid from 'slugid';

import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc';

const Item = SortableElement((props) => {
    return (
        <div className={props.className} style={{
            height: props.height,
            width: props.width
        }}>
			{props.useDragHandle && <Handle/>}
            {props.value}
        </div>
    )
});

const SortableList = SortableContainer(({className, items, itemClass, sortingIndex, useDragHandle, sortableHandlers,height, width}) => {
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
    height: React.PropTypes.number,
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
                />
        )

    }
}

VerticalTiledPlot.propTypes = {
    tracks: React.PropTypes.array
}
