import React from 'react';
import slugid from 'slugid';

import {SortableContainer, SortableElement, SortableHandle, arrayMove} from 'react-sortable-hoc';


class HorizontalTrack extends React.Component {
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
        let moveImgStyle = { right: 18,
                         top: 5,
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

        console.log('controls:', controls);
        console.log('className:', this.props.className);

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
    return (<HorizontalTrack 
                                                    height={props.height}
                                                    width={props.width}
                                                    value={props.value}
                                                    className={props.className}
                                                />)});

const SortableList = SortableContainer(({className, items, itemClass, sortingIndex, useDragHandle, sortableHandlers,height, width}) => {
            console.log('horizontal useDragHandle:', useDragHandle);
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
					height={item.height}
                    width={width}
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


export class HorizontalTiledPlot extends React.Component {
    constructor(props) {
        super(props);
    }


    render() {
        let thisHeight = this.props.tracks
            .map((x) => { return x.height; })
            .reduce((a,b) => { return a + b; }, 0);
        let imgStyle = { right: 5,
                         top: 5,
                         position: 'absolute',
                         opacity: .5}

        return (
                <div style={{position: "relative"}}>
                    <ListWrapper
                        component={SortableList}
                        helperClass={"stylizedHelper"}
                        className={"list stylizedList"} 
                        itemClass={"stylizedItem"}
                        items={this.props.tracks} 
                        height={thisHeight}
                        width={this.props.width}
                        useDragHandle={true}
                    />
                </div>
        )

    }
}

HorizontalTiledPlot.propTypes = {
    tracks: React.PropTypes.array
}
