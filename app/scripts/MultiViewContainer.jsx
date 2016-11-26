import React from 'react';
import _ from 'lodash';
import slugid from 'slugid';
import ReactDOM from 'react-dom';
import {Responsive, WidthProvider} from 'react-grid-layout';
import {SearchableTiledPlot} from './SearchableTiledPlot.jsx';
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import {ResizeSensor,ElementQueries} from 'css-element-queries';
import PIXI from 'pixi.js';

const ResponsiveReactGridLayout = WidthProvider(Responsive);

export class MultiViewContainer extends React.Component {
    constructor(props) {
        super(props);

        this.heights = {};
        this.uid = slugid.nice();
        this.yPositionOffset = 0;

        this.viewConfig = this.props.viewConfig;

          this.state = {
            currentBreakpoint: 'lg',
            mounted: false,
            width: 0,
            height: 0
          }

          this.pixiStage = new PIXI.Container();
          this.pixiStage.interactive = true;
          this.element = null;
    }


    componentDidMount() {
        this.element = ReactDOM.findDOMNode(this);

        this.pixiRenderer = PIXI.autoDetectRenderer(this.state.width,
                                        this.state.height,
                                        { view: this.canvasElement,
                                          antialias: true, 
                                          transparent: true } )

        PIXI.RESOLUTION=2;


        // keep track of the width and height of this element, because it
        // needs to be reflected in the size of our drawing surface
        this.setState({mounted: true});
        ElementQueries.listen();
        new ResizeSensor(this.element, function() {
            //let heightOffset = this.element.offsetTop - this.element.parentNode.offsetTop
            let heightOffset = 0;


                this.pixiRenderer.resize(this.element.clientWidth,
                                         this.element.clientHeight);

            this.setState({
                height: this.element.clientHeight,
                width: this.element.clientWidth
            });
         }.bind(this));
            
        
        this.animate();
    }

    componentWillReceiveProps(newProps) {

    }

    /*
    shouldComponentUpdate(nextProps, nextState) {
        console.log('oldProps.text:', this.props.viewConfig.text);
        console.log('newProps.text:', nextProps.viewConfig.text);
        if (nextProps.viewConfig.text == this.props.viewConfig.text) {
            //console.log('not updating...');
            return false;
        }

        return true;
    }
    */

    animate() {
        this.pixiRenderer.render(this.pixiStage);
        this.frame = requestAnimationFrame(this.animate.bind(this));
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
    
      let viewConfigObject = JSON.parse(this.props.viewConfig.text);

      // check if this is the only view
      // if it is, don't close it (display an error message)
      if (viewConfigObject.views.length == 1) {
            console.log("Can't close the only view");
            return;
      }


      let viewsToClose = viewConfigObject.views.filter((d) => { return d.uid == uid; });

      // send an event to the app telling it that we're closing some views so 
      // that it can clean up after them

      let filteredViews = viewConfigObject.views.filter((d) => { 
          return d.uid != uid;
      });

      this.removeZoomDispatch(filteredViews);

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

      //console.log('newViewConfig:', newViewConfigText);

      this.props.onNewConfig(newViewConfigText);
  }


  render() {
    let imgStyle = { right: 5,
                    top: 2,
                     position: 'absolute' }
    return (
      <div 
        key={this.uid}
        style={{position: "relative"}}
      >
        <canvas ref={(c) => this.canvasElement = c } 
            style={{
                position: "absolute",
                width: this.state.width,
                height: this.state.height
            }}/>
        <svg ref={(c) => this.svgElement = c } 
            style={{
                position: "absolute",
                width: this.state.width,
                height: this.state.height
            }}/>
        <div
            className="drawing-surface"
            style={{position: "absolute", 
                    width: this.state.width, 
                    height: this.state.height,
                    background: 'yellow',
                    opacity: 0.5
            }}
        />
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
                let itemUid = "p" + view.uid;
                this.heights[itemUid] = layout.height;

                return (<div 
                            data-grid={layout}
                            key={itemUid}
                            style={{display: "flex", "flexDirection": "column"}}
                        >
                            <div 
                                className="multitrack-header"
                                style={{"width": this.width, "minHeight": 16, "position": "relative", "border": "solid 1px", "marginBottom": 4, "opacity": 0.6}} 
                            >
                                <img 
                                    onClick={() => { this.handleCloseView(view.uid)}}
                                    src="images/cross.svg" 
                                    style={imgStyle}
                                    width="10px" 
                                />
                            </div>
                             <SearchableTiledPlot
                                     key={view.uid}
                                     height={this.heights[itemUid]}
                                     svgElement={this.svgElement}
                                     canvasElement={this.canvasElement}
                                     pixiStage={this.pixiStage}
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
