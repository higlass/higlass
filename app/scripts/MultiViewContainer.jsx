import React from 'react';
import _ from 'lodash';
import slugid from 'slugid';
import ReactDOM from 'react-dom';
import {Responsive, WidthProvider} from 'react-grid-layout';
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveReactGridLayout = WidthProvider(Responsive);

export class MultiViewContainer extends React.Component {
    constructor(props) {
        super(props);

        this.heights = {};

        this.viewConfig = this.props.viewConfig;

          this.state = {
            currentBreakpoint: 'lg',
            mounted: false
          }
    }


  componentDidMount() {
    this.setState({mounted: true});
  }

    componentWillReceiveProps(newProps) {
        //console.log('newProps:', newProps);
    }

    shouldComponentUpdate(nextProps, nextState) {
        /*
        console.log('oldProps.text:', this.props.viewConfig.text);
        console.log('newProps.text:', nextProps.viewConfig.text);
        */
        if (nextProps.viewConfig.text == this.props.viewConfig.text) {
            //console.log('not updating...');
            return false;
        }

        return true;
    }


  onBreakpointChange(breakpoint) {
    this.setState({
      currentBreakpoint: breakpoint
    });
  };

  handleLayoutChange(layout, layouts) {
    //this.props.onLayoutChange(layout, layouts);
  };

  onNewLayout() {

  };

  onResize(layout, oldItem, newItem, placeholder, e, element) {
      //console.log('layout:', layout, 'oldItem:', oldItem, 'newItem:', newItem, 'placeholder:', placeholder, 'e:', e, 'element:', element);
      // element is the resize handle
    let boundingBox = element.parentNode.getBoundingClientRect()
    this.heights[newItem.i] = boundingBox.height;

    //console.log('resizing:', layout.i, 'newItem:', newItem.i, 'this.heights:', this.heights);
  }

  generateViewLayout(viewConfig) {
    let minTrackHeight = 30;
    let totalHeight = 0

    for (let i = 0; i < viewConfig.tracks.length; i++) {
        let track = viewConfig.tracks[i];

        if (!track.height)
            totalHeight += minTrackHeight;
        else
            totalHeight += track.height;
    }

    if (viewConfig.searchBox)
        totalHeight += 30;
    
    let heightGrid = Math.ceil(totalHeight / this.props.rowHeight);

    let layout = {
        x: 0,
        y: 0,
        w: 6,
    };

    layout.h = heightGrid;
    layout.height = layout.h * this.props.rowHeight;
    layout.minH = heightGrid;
    //layout.maxH = heightGrid;

    if (layout in viewConfig)
        layout = viewConfig.layout;

    layout.i = slugid.nice();
    console.log('generating...', layout.i);

    this.heights[layout.i] = layout.height;

    return layout;
  }

  handleCloseView(uid) {
      /**
       * A view needs to be closed. Remove it from from the viewConfig and then clean
       * up all of its connections (zoom links, workers, etc...)
       *
       * @param {uid} This view's identifier
       */
    
      console.log('closing a view:', uid);
      let viewConfigObject = JSON.parse(this.props.viewConfig.text);

      // check if this is the only view
      // if it is, don't close it (display an error message)
      if (viewConfigObject.views.length == 1) {
            console.log("Can't close the only view");
            return;
      }


      let viewsToClose = viewConfigObject.views.filter((d) => { return d.uid == uid; });

      console.log('views to close:', viewsToClose);
      // send an event to the app telling it that we're closing some views so 
      // that it can clean up after them

      let filteredViews = viewConfigObject.views.filter((d) => { 
          console.log('d:', d);
          return d.uid != uid;
      });

      this.removeZoomDispatch(filteredViews);

      console.log('filteredViews:', filteredViews);
      viewConfigObject.views = filteredViews;
      let newViewConfigText = JSON.stringify(viewConfigObject);

      this.props.onNewConfig(newViewConfigText);
  }

  removeZoomDispatch(views) {
      /**
       * Remove all zoom dispatches from views so that
       * we don't have issues when recreating them.
       *
       * @param {views} An array of views
       * @return views The same set of views, with any zoomDispatch members excised
       */
      for (let i = 0; i < views.length; i++) {
          let view = views[i];

        if ('zoomDispatch' in view)
            delete view.zoomDispatch;
      }

      return views;
  }

  handleAddView() {
      /**
       * User clicked on the "Add View" button. We'll duplicate the last
       * view.
       */
      console.log('addView clicked');
      console.log('this.viewConfig:', this.props.viewConfig);

      let freshViewConfig = JSON.parse(this.props.viewConfig.text);
      let views = freshViewConfig.views;
      let lastView = views[views.length-1];

      let maxY = 0;

      for (let i = 0; i < views.length; i++) {
          let view = views[i];

          if ('layout' in view) {
              if ('minH' in view.layout)
                    maxY += Math.max(maxY, view.layout.y + view.layout.minH);
              else
                    maxY += Math.max(maxY, view.layout.y + 1);
          }
      }

      this.removeZoomDispatch(views);

      let newView = JSON.parse(JSON.stringify(lastView));   //ghetto copy

      // place this new view below all the others
      newView.layout.x = 0;
      newView.layout.y = maxY;

      // give it its own unique id
      newView.uid = slugid.nice();

      freshViewConfig.views.push(newView); 
      let newViewConfigText = JSON.stringify(freshViewConfig);

      console.log('lastView:', lastView);
      //console.log('newViewConfig:', newViewConfigText);

      this.props.onNewConfig(newViewConfigText);
  }

  render() {
    let imgStyle = { right: 5,
                    top: 2,
                     position: 'absolute' }
    return (
      <div>
        <ResponsiveReactGridLayout
          {...this.props}
          draggableHandle={'.multitrack-header'}
          measureBeforeMount={false}
          onBreakpointChange={this.onBreakpointChange.bind(this)}
          onLayoutChange={this.handleLayoutChange}
          onResize={this.onResize.bind(this)}

          // WidthProvider option
          // I like to have it animate on mount. If you don't, delete `useCSSTransforms` (it's default `true`)
          // and set `measureBeforeMount={true}`.
          useCSSTransforms={this.state.mounted}
        >
            { this.props.viewConfig.object.views.map(function(view, i) {
                let layout = this.generateViewLayout(view);
                /*
                if ('layout' in c.props.viewConfig) {
                    layout = c.props.viewConfig.layout;
                }
                */
                console.log('layout:', JSON.stringify(layout));
                console.log('i:', i)
                let itemUid = "p" + view.uid;
                this.heights[itemUid] = layout.height;

                return (<div 
                            data-grid={layout}
                            key={itemUid}
                        >
                            <div 
                                className="multitrack-header"
                                style={{"width": this.width, "height": 16, "position": "relative", "border": "solid 1px", "marginBottom": 4, "opacity": 0.6}} 
                            >
                                <img 
                                    onClick={() => { this.handleCloseView(view.uid)}}
                                    src="images/cross.svg" 
                                    style={imgStyle}
                                    width="10px" 
                                />
                            </div>
                             <SearchableTiledPlot
                                     key={slugid.nice()}
                                     viewConfig={view}
                                     viewConfigText={this.props.viewConfig.text}
                                     pullHeight={function() { 
                                         return this.heights[itemUid];
                                     }.bind(this) }
                                     />
                        </div>)

            }.bind(this))}
        </ResponsiveReactGridLayout>
        <div>
            <div 
                className="view-menu"
                style={{"width": 32, "height": 26, "position": "relative", "marginBottom": 4, "marginRight": 12,  "opacity": 0.6, "float": "right"}} 
            >
                    <img 
                        onClick={this.handleAddView.bind(this)}
                        src="images/plus.svg" 
                        style={imgStyle}
                        width="20px" 
                    />
            </div>
        </div>
      </div>
    );
  }
}


MultiViewContainer.defaultProps = {
    className: "layout",
    rowHeight: 30,
    cols: {lg: 6, md: 6, sm: 6, xs: 6, xxs: 6}
  }
MultiViewContainer.propTypes = {
    rowHeight:  React.PropTypes.number,
    children: React.PropTypes.array,
    viewConfig: React.PropTypes.object,
    onNewConfig: React.PropTypes.func
  }
