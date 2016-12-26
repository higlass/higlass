import slugid from 'slugid';
import React from 'react';
import ReactDOM from 'react-dom';
import {Resizable,ResizableBox} from 'react-resizable';
import {DraggableDiv} from './DraggableDiv.js';
import {select,event,mouse} from 'd3-selection';
import {SortableContainer, SortableElement, SortableHandle, arrayMove} from 'react-sortable-hoc';
import {contextMenu} from './d3-context-menu.js';


class TrackArea extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            controlsVisible: true
        }
    }

    componentDidMount() {

    }

    shouldComponentUpdate() {
        return ! this.resizing;
    }

    componentWillUnmount() {
        console.log('unmounting:', this.props.uid);
    }

    handleMouseEnter() {
        this.setState({
            controlsVisible: true
        });
    }

    handleMouseLeave() {
        this.setState({
            controlsVisible: true
        });
    }

    getControls() {
        let controls = (<div>
                        <img 
                            ref={(c) => { this.imgClose = c; }}
                            className="no-zoom"
                            src="images/cross.svg" 
                            style={this.getCloseImgStyle()}
                            width="10px" 
                            onClick={() => { 
                                let imgDom = ReactDOM.findDOMNode(this.imgClose);
                                let bbox = imgDom.getBoundingClientRect();
                                this.props.handleCloseSeries(this.props.uid, bbox);
                            }}
                        />

                        <img 
                            ref={(c) => { this.imgAdd = c; }}
                            className="no-zoom"
                            src="images/plus.svg" 
                            style={this.getAddImgStyle()}
                            width="10px" 
                            onClick={() => { 
                                // display a menu at the position of the button
                                let imgDom = ReactDOM.findDOMNode(this.imgAdd);
                                let bbox = imgDom.getBoundingClientRect();
                                this.props.handleAddSeries(this.props.uid, bbox);
                                
                            }}
                        />

                        <img 
                            ref={(c) => { this.imgConfig = c; }}
                            className="no-zoom"
                            onClick={(e) => { 
                                let imgDom = ReactDOM.findDOMNode(this.imgConfig);
                                let bbox = imgDom.getBoundingClientRect();
                                this.props.handleConfigTrack(this.props.uid, bbox);
                                ; }}
                            src="images/cog.svg" 
                            style={this.getSettingsImgStyle()}
                            width="10px" 
                        />
                </div>)

        return controls;
    }
}


function callback(item) {
        console.log('item clicked', item);
}

export class FixedTrack extends TrackArea {
    constructor(props) {
        super(props);
    }

    handleClick(e, data) {
          console.log(data);
    }


    render() {
        let controls = null;

        if (this.state.controlsVisible) {
            controls = this.getControls();
        }

        return (
            <div 
                className={this.props.className} 
                onMouseEnter={this.handleMouseEnter.bind(this)}
                onMouseLeave={this.handleMouseLeave.bind(this)}
                style={{
                    height: this.props.height,
                    width: this.props.width,
                    position: "relative",
                    background: 'transparent'
                }}
            >

            <div 
                key={this.props.uid}
                style={{
                    height: this.props.height,
                    width: this.props.width
                }}
            />
                {controls}
            </div>
        )

    }
}

class MoveableTrack extends TrackArea {
    constructor(props) {
        super(props);
    }

    render() {
        let Handle = SortableHandle(() => 
                <img 
                    className="no-zoom"
                    onClick={() => {}}
                    src="images/enlarge.svg" 
                    style={this.getMoveImgStyle()}
                    width="10px" 
                />
                )
        let controls = null;

        if (this.state.controlsVisible) {
            controls = ( <div>
                        { this.getControls() }
                    <Handle />
                </div>)
        }

        return (
            <div 
                className={this.props.className} 
                onMouseEnter={this.handleMouseEnter.bind(this)}
                onMouseLeave={this.handleMouseLeave.bind(this)}
                style={{
                    height: this.props.height,
                    width: this.props.width,
                    position: "relative",
                    background: 'transparent'
                }}
            >
            <DraggableDiv 
                height={this.props.height}
                key={this.props.uid}
                sizeChanged={(stuff) => { return this.props.handleResizeTrack(this.props.uid, stuff.width, stuff.height); }}
                style={{background: 'transparent'}}
                uid={this.props.uid}
                width={this.props.width}
            />
                {controls}
            </div>
        )

    }
}

MoveableTrack.propTypes = {
    className: React.PropTypes.string,
    uid: React.PropTypes.string,
    item: React.PropTypes.object,
    height: React.PropTypes.number,
    width: React.PropTypes.number,
}

export class CenterTrack extends FixedTrack {
    // should be the same as a vertical track
    getCloseImgStyle() {
        let closeImgStyle = { right: 15,
                         top: 5,
                         position: 'absolute',
                         opacity: .5}

        return closeImgStyle;
    }
    getSettingsImgStyle() {
        let closeImgStyle = { right: 41,
                         top: 5,
                         position: 'absolute',
                         opacity: .5}

        return closeImgStyle;
    }

    getAddImgStyle() {
        return  { right: 28,
                    top: 5,
                    position: 'absolute',
                    opacity: .5}
    }
}

class VerticalTrack extends MoveableTrack {
    constructor(props) {
        super(props);
    }

    // each image should be 13 pixels below the next one
    getCloseImgStyle() {
        let closeImgStyle = { right: 5,
                         top: 5,
                         position: 'absolute',
                         opacity: .5}

        return closeImgStyle;
    }

    getMoveImgStyle() {
        let moveImgStyle = { right: 5,
                         top: 44,
                         position: 'absolute',
                         opacity: .5}

        return moveImgStyle;
    }

    getAddImgStyle() {
        return { right: 5,
                    top: 18,
                    position: 'absolute',
                    opacity: .5}
    }

    getSettingsImgStyle() {
        let closeImgStyle = { right: 5,
                         top: 31,
                         position: 'absolute',
                         opacity: .5}

        return closeImgStyle;
    }

}


const VerticalItem = SortableElement((props) => { 

    return (<VerticalTrack 
                className={props.className}
                handleCloseTrack={props.handleCloseTrack}
                handleConfigTrack={props.handleConfigTrack}
                handleResizeTrack={props.handleResizeTrack}
                height={props.height}
                item={props.item}
                uid={props.uid}
                width={props.width}
            />)});

class HorizontalTrack extends MoveableTrack {
    constructor(props) {
        super(props);

    }

    getCloseImgStyle() {
        let closeImgStyle = { right: 15,
                         top: 5,
                         position: 'absolute',
                         opacity: .5}

        return closeImgStyle;
    }

    getMoveImgStyle() {
        let moveImgStyle = { right: 54,
                         top: 5,
                         position: 'absolute',
                         opacity: .5}

        return moveImgStyle;
    }

    getAddImgStyle() {
        return { right: 28,
                    top: 5,
                    position: 'absolute',
                    opacity: .5}
    }

    getSettingsImgStyle() {
        let moveImgStyle = { right: 41,
                         top: 5,
                         position: 'absolute',
                         opacity: .5}

        return moveImgStyle;
    }
}

const HorizontalItem = SortableElement((props) => { 
    return (<HorizontalTrack 
                className={props.className}
                handleCloseTrack={props.handleCloseTrack}
                handleConfigTrack={props.handleConfigTrack}
                handleResizeTrack={props.handleResizeTrack}
                height={props.height}
                item={props.item}
                uid={props.uid}
                width={props.width}
            />)});

const SortableList = SortableContainer(({className, items, itemClass, sortingIndex, useDragHandle, 
                                         sortableHandlers,height, width, handleCloseTrack,handleConfigTrack,itemReactClass,
                                         handleResizeTrack}) => {
    let itemElements = items.map((item, index) => {
            return React.createElement(itemReactClass,
                {   key: "sci-" + item.uid,
				    className: itemClass,
					sortingIndex: sortingIndex,
					index: index,
					uid: item.uid,
					height: item.height,
                    width: item.width,
                    item: item,
					useDragHandle: useDragHandle,
                    handleCloseTrack: handleCloseTrack,
                    handleConfigTrack, handleConfigTrack,
                    handleResizeTrack: handleResizeTrack
                })
            })
	return (
        <div 
            className={className} 
            style={{height: height,
                    width: width,
                    background: 'transparent'
            }}
            {...sortableHandlers}
        >
			{itemElements}
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

    componentWillReceiveProps(nextProps) {
        this.setState ({
            items: nextProps.items
        })
    }

	onSortStart({node, index, collection}, e) {
        e.stopImmediatePropagation();
		let {onSortStart} = this.props;
		this.setState({isSorting: true});

		if (onSortStart) {
			onSortStart(this.refs.component);
		}

        this.sortingIndex = index;

        this.sortStartTop = e.offsetTop;
        this.sortStartLeft = e.offsetLeft;
	};

    onSortMove(event) {

    }

    onSortEnd({oldIndex, newIndex}) {
		let {onSortEnd} = this.props;
        let {items} = this.state;

        this.setState({items: arrayMove(items, oldIndex, newIndex), isSorting: false});

		if (onSortEnd) {
			onSortEnd(this.state.items);
		}


        this.sortingIndex = null;
    };

	render() {

		const Component = this.props.component;
		const {items, isSorting} = this.state;
		const props = {
			isSorting, items,
			onSortEnd: this.onSortEnd.bind(this),
			onSortStart: this.onSortStart.bind(this),
            onSortMove: this.onSortMove.bind(this),
			ref: "component"
		}

		return (
                <Component 
                    {...this.props} 
                    {...props} 
                />)
	}
}

ListWrapper.propTypes = {
    items: React.PropTypes.array,
    className: React.PropTypes.string,
    itemClass: React.PropTypes.string,
    width: React.PropTypes.number,
    height: React.PropTypes.number,
    onSortStart: React.PropTypes.func,
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

    componentWillUnmount() {
        console.log('unmounting horizontal');
    }


    render() {
        let thisHeight = this.props.tracks
            .map((x) => { return x.height; })
            .reduce((a,b) => { return a + b; }, 0);
        let imgStyle = { right: 5,
                         top: 5,
                         position: 'absolute',
                         opacity: .5}

        let newItems = this.props.tracks.map((d) => {
            let uid = d.uid;
            if (!uid)
                uid = slugid.nice();

            return {uid: uid, width: this.props.width, 
                    height: d.height, value: d.value };
        });


        return (
                <div style={{position: "relative"}}>
                    <ListWrapper
                        className={"list stylizedList"} 
                        component={SortableList}
                        handleCloseTrack={this.props.handleCloseTrack}
                        handleConfigTrack={this.props.handleConfigTrack}
                        handleResizeTrack={this.props.handleResizeTrack}
                        height={thisHeight}
                        helperClass={"stylizedHelper"}
                        itemClass={"stylizedItem"}
                        itemReactClass={HorizontalItem}
                        items={newItems} 
                        onSortEnd={this.props.handleSortEnd}
                        useDragHandle={true}
                        width={this.props.width}
                        referenceAncestor={this.props.referenceAncestor}
                    />
                </div>
        )

    }
}

HorizontalTiledPlot.propTypes = {
    width: React.PropTypes.number,
    height: React.PropTypes.number,
}

export class VerticalTiledPlot extends React.Component {
    constructor(props) {
        super(props);
    }


    render() {
        let thisWidth = this.props.tracks
            .map((x) => { return x.width; })
            .reduce((a,b) => { return a + b; }, 0);

        let newItems = this.props.tracks.map((d) => {
            let uid = d.uid;
            if (!uid)
                uid = slugid.nice();

            return {uid: uid, height: this.props.height, width: d.width, value: d.value };
        });

        return (
                <ListWrapper
                    axis={'x'}
                    className={"list stylizedList horizontalList"} 
                    component={SortableList}
                    handleCloseTrack={this.props.handleCloseTrack}
                    handleConfigTrack={this.props.handleConfigTrack}
                    handleResizeTrack={this.props.handleResizeTrack}
                    height={this.props.height}
                    helperClass={"stylizedHelper"}
                    itemClass={"stylizedItem horizontalItem"}
                    itemReactClass={VerticalItem}
                    items={newItems} 
                    referenceAncestor={this.props.referenceAncestor}
                    onSortEnd={this.props.handleSortEnd}
                    useDragHandle={true}
                    width={thisWidth}
                />
        )

    }
}

HorizontalTiledPlot.propTypes = {
    tracks: React.PropTypes.array
}

export class CenterTiledPlot extends React.Component {
    constructor(props) {
        super(props);
    }

    render() { 

        return(<div class="center-plot"></div>)
    }
}

