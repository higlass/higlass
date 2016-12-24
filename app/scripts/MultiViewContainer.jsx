import '../styles/MultiViewContainer.css';
import React from 'react';
import _ from 'lodash';
import slugid from 'slugid';
import ReactDOM from 'react-dom';
import {Responsive, WidthProvider} from 'react-grid-layout';
import {SearchableTiledPlot} from './SearchableTiledPlot.jsx';
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import {ResizeSensor,ElementQueries} from 'css-element-queries';
import {TiledPlot} from './TiledPlot.jsx';

const ResponsiveReactGridLayout = WidthProvider(Responsive);

export class MultiViewContainer extends React.Component {
    constructor(props) {
        super(props);

        this.heights = {};
        this.uid = slugid.nice();
        this.yPositionOffset = 0;
        this.rowHeight = 40;

        this.horizontalMargin = 34;
        this.verticalMargin = 34;

        this.viewConfig = this.props.viewConfig;


          this.pixiStage = new PIXI.Container();
          this.pixiStage.interactive = true;
          this.element = null;

          let views = [{
              uid: slugid.nice(),
              initialXDomain: [-1000000,3000000],
              initialYDomain: [-1000000,3000000],
              'tracks': {
            'top': [
                {'uid': slugid.nice(), type:'top-axis'}
            ,
                    {'uid': slugid.nice(), 
                        type:'horizontal-line',
                        height: 30,
                        width: 20,
                      tilesetUid: 'bb',
                      server: 'localhost:8000'}
                      ,

                    /*
                    {'uid': slugid.nice(), 
                        type:'horizontal-1d-tiles',
                        height: 30,
                        width: 20,
                      tilesetUid: 'bb',
                      server: 'localhost:8000'},
                      */

                {'uid': slugid.nice(),
                 type: 'combined',
                 height: 59,
                 contents:
                     [
                    /*
                    {'uid': slugid.nice(),
                        type: 'stacked-interval',
                        height: 30,
                        tilesetUid: 'cc',
                        server: 'localhost:8000' 
                    }
                    ,
                    {'uid': slugid.nice(), 
                        type:'horizontal-1d-tiles',
                        height: 30,
                      tilesetUid: 'cc',
                      server: 'localhost:8000'}
                      */

                     ]
                }
            ],
            'left': [
                {'uid': slugid.nice(), type:'left-axis', width: 100}
                ,
                    {'uid': slugid.nice(), 
                        type:'vertical-line',
                        height: 30,
                        width: 20,
                      tilesetUid: 'bb',
                      server: 'localhost:8000'}
            /*
                ,
                {'uid': slugid.nice(), 
                    type:'vertical-1d-tiles',
                  tilesetUid: '5aa265c9-2005-4ffe-9d1c-fe59a6d0e768',
                  server: '52.45.229.11'}
                  */
            ],
            'center': [
                {   
                    uid: slugid.nice(),
                    type: 'combined',
                    height: 200,
                    contents: 
                    [
                    /*
                        { 'server': '52.45.229.11/',
                          'uid': slugid.nice(),
                          'tilesetUid': 'aa',
                          'type': 'heatmap'
                        }
                        ,
                        { 'server': '52.45.229.11',
                          'uid': slugid.nice(),
                          'tilesetUid': '00bec9f2-504e-4daf-a674-6aca204247ce',
                          'type': '2d-tiles'
                        }
                        */
                    ]
                }
            ]}

          }]

          this.state = {
            currentBreakpoint: 'lg',
            mounted: false,
            width: 0,
            height: 0,
            layouts: {},
            svgElement: null,
            canvasElement: null,
            views: views
          }
    }


    componentDidMount() {
        this.element = ReactDOM.findDOMNode(this);
        this.state.views.map(v => v.layout = this.generateViewLayout(v));

        this.pixiRenderer = PIXI.autoDetectRenderer(this.state.width,
                                        this.state.height,
                                        { view: this.canvasElement,
                                          antialias: true, 
                                          transparent: true,
                                          resolution: 2
                                        } )

        //PIXI.RESOLUTION=2;


        // keep track of the width and height of this element, because it
        // needs to be reflected in the size of our drawing surface
        this.setState({mounted: true,
            svgElement: this.svgElement,
            canvasElement: this.canvasElement
        });
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
            
        this.handleDragStart();
        this.handleDragStop();
        
        this.animate();
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
      let stateLayouts = this.state.layouts;
      stateLayouts[layout.i] = layout;

      this.handleDragStart();
      this.handleDragStop();

      // maintain a list of the layouts, mainly so tt
      this.setState({
          'layouts': stateLayouts
      });
  };

    handleDragStart(layout, oldItem, newItem, placeholder, e, element) {
        this.setState({
            dragging: true
        })
    }

    handleDragStop() {
        // wait for the CSS transitions to end before 
        // turning off the dragging state
        setTimeout(() => {
            this.setState({
                dragging: false
            })}, 1000);
    }

  onNewLayout() {

  };

  onResize(layout, oldItem, newItem, placeholder, e, element) {
      
  }

  calculateViewDimensions(view) {
      /**
       * Get the dimensions for this view, counting just the tracks
       * that are present in it
       *
       * @param view: A view containing a list of tracks as a member.
       * @return: A width and a height pair (e.g. [width, height])
       */
      let defaultHorizontalHeight = 20;
      let defaultVerticalWidth = 0;
      let defaultCenterHeight = 100;
      let defaultCenterWidth = 100;
      let currHeight = this.horizontalMargin * 2;
      let currWidth = this.verticalMargin * 2;    //currWidth will generally be ignored because it will just be set to 
                            //the width of the enclosing container

      if (view.tracks.top) {
          // tally up the height of the top tracks

          for (let i = 0; i < view.tracks.top.length; i++) {
              let track = view.tracks.top[i];
              currHeight += track.height ? track.height : defaultHorizontalHeight;
          }
      }

      if (view.tracks.bottom) {
          // tally up the height of the top tracks

          for (let i = 0; i < view.tracks.bottom.length; i++) {
              let track = view.tracks.bottom[i];
              currHeight += track.height ? track.height : defaultHorizontalHeight;
          }
      }

      if (view.tracks.left) {
          // tally up the height of the top tracks

          for (let i = 0; i < view.tracks.left.length; i++) {
              let track = view.tracks.left[i];
              currWidth += track.width ? track.width : defaultVerticalWidth;
          }
      }

      if (view.tracks.right) {
          // tally up the height of the top tracks

          for (let i = 0; i < view.tracks.right.length; i++) {
              let track = view.tracks.right[i];
              currWidth += track.width ? track.width : defaultVerticalWidth;
          }
      }

      let centerHeight = 0;
      let centerWidth = 0;
      if (view.center) {
        centerHeight = view.center.height ? view.center.height : defaultCenterHeight;
        currHeight += centerHeight;
        centerWidth = view.center.width ? view.center.width : defaultCenterWidth;
        currWidth += centerWidth;
      } else if ((view.tracks.top || view.tracks.bottom) && (view.tracks.left || view.tracks.right)) {
            currHeight += defaultCenterWidth;
            currWidth += defaultCenterWidth;
      }

      let topHeight = 0;
      let bottomHeight = 0;
      let leftWidth = 0;
      let rightWidth = 0;

      if ('top' in view.tracks)
        topHeight = view.tracks['top']
            .map((x) => { return x.height ? x.height : defaultHorizontalHeight; })
            .reduce((a,b) => { return a + b; }, 0);
      if ('bottom' in view.tracks)
        bottomHeight = view.tracks['bottom']
            .map((x) => { return x.height ? x.height : defaultHorizontalHeight; })
            .reduce((a,b) => { return a + b; }, 0);
      if ('left' in view.tracks)
        leftWidth = view.tracks['left']
            .map((x) => { return x.width ? x.width : defaultVerticalWidth; })
            .reduce((a,b) => { return a + b; }, 0);
    if ('right' in view.tracks)
        rightWidth = view.tracks['right']
            .map((x) => { return x.width ? x.width : defaultVerticalWidth ; })
            .reduce((a,b) => { return a + b; }, 0);

      return {'totalWidth': currWidth,
              'totalHeight': currHeight,
              'topHeight': topHeight,
              'bottomHeight': bottomHeight,
              'leftWidth': leftWidth,
              'rightWidth': rightWidth,
              'centerWidth': centerWidth,
              'centerHeight': centerHeight};
  }

  generateViewLayout(view) {
    let layout = null;

    if ('layout' in view)
        layout = view.layout
    else {
        let minTrackHeight = 30;
        let elementWidth = this.element.clientWidth;

        let {totalWidth, totalHeight, 
            topHeight, bottomHeight,
            leftWidth, rightWidth,
            centerWidth, centerHeight} = this.calculateViewDimensions(view);

        if (view.searchBox)
            totalHeight += 30;
        
        let heightGrid = Math.ceil(totalHeight / this.rowHeight);

        layout = {
            x: 0,
            y: 0,
            w: 6,
        };


        if ('center' in view.tracks || 'left' in view.tracks || 'right' in view.tracks) {
            let desiredHeight = ((elementWidth - leftWidth - rightWidth - 2 * this.horizontalMargin) );
            desiredHeight +=  topHeight + bottomHeight + 2*this.verticalMargin + 20;

            // how much height is left in the browser?

            // limit the height of the container to the window height
            // the number 160 is relatively arbitrary and should be
            // replaced with a concrete measure of the element below and
            // above the canvas area
            let availableHeight = window.innerHeight - 160;

            if (desiredHeight > availableHeight )
                desiredHeight = availableHeight;

            // stretch the view out 
            layout.h = Math.ceil(desiredHeight / this.rowHeight); 
        }
        else
            layout.h = heightGrid;

        layout.minH = heightGrid;
        layout.i = slugid.nice();
    }

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
    
      // check if this is the only view
      // if it is, don't close it (display an error message)
      if (this.state.views.length == 1) {
            console.log("Can't close the only view");
            return;
      }


      let viewsToClose = this.state.views.filter((d) => { return d.uid == uid; });

      // send an event to the app telling it that we're closing some views so 
      // that it can clean up after them

      let filteredViews = this.state.views.filter((d) => { 
          return d.uid != uid;
      });

      this.removeZoomDispatch(filteredViews);

      this.setState({
          'views': filteredViews
      });
      /*
      let newViewConfigText = JSON.stringify(viewConfigObject);

      this.props.onNewConfig(newViewConfigText);
      */
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

      let views = this.state.views;
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

      this.setState({
          'views': this.state.views.concat(newView)
      });

      /*
      this.state
      freshViewConfig.views.push(newView); 
      let newViewConfigText = JSON.stringify(freshViewConfig);

      this.props.onNewConfig(newViewConfigText);
      */
  }


  render() {

    let tiledAreaStyle = {
        display: 'flex',
        flexDirection: 'column'
    }
    let tiledAreas = (<div 
                            ref={(c) => {this.tiledAreaDiv = c; }}
                            style={tiledAreaStyle}
                      />);

    // The component needs to be mounted in order for the initial view to have the right
    // width
    if (this.state.mounted) {
        tiledAreas = this.state.views.map(function(view, i) {
                let layout = view.layout;

                let itemUid = "p" + view.uid;
                this.heights[itemUid] = layout.height;

                return (<div 
                            data-grid={layout}
                            key={itemUid}
                            ref={(c) => {this.tiledAreaDiv = c; }}
                            style={tiledAreaStyle}
                        >
                            <div 
                                className="multitrack-header"
                                style={{"width": this.width, "minHeight": 16, "position": "relative", "border": "solid 1px", "marginBottom": 4, "opacity": 0.6}} 
                            >
                                <img 
                                    onClick={() => { this.handleCloseView(view.uid)}}
                                    src="images/cross.svg" 
                                    className={'multiview-close-img'}
                                    width="10px" 
                                />
                            </div>
                             <SearchableTiledPlot
                                     key={view.uid}
                            >
                                <TiledPlot
                                    parentMounted={this.state.mounted} 
                                     height={this.heights[itemUid]}
                                     svgElement={this.state.svgElement}
                                     canvasElement={this.state.canvasElement}
                                     pixiStage={this.pixiStage}
                                     dragging={this.state.dragging}
                                     tracks={view.tracks}
                                     initialXDomain={view.initialXDomain}
                                     initialYDomain={view.initialYDomain}
                                     verticalMargin={this.verticalMargin}
                                     horizontalMargin={this.horizontalMargin}
                                />
                            </SearchableTiledPlot>
                        </div>)

            }.bind(this))
    }

    return (
      <div 
        key={this.uid}
        style={{position: "relative"}}
      >
        <canvas 
            ref={(c) => this.canvasElement = c} 
            style={{
                position: "absolute",
                width: this.state.width,
                height: this.state.height
            }}
        />
        <svg 
            ref={(c) => this.svgElement = c} 
            style={{
                position: "absolute",
                width: this.state.width,
                height: this.state.height
            }}
        />
        <div
            className="drawing-surface"
            style={{position: "absolute", 
                    width: this.state.width, 
                    height: this.state.height,
                    background: 'yellow',
                    opacity: 0.05
            }}
        />
        <ResponsiveReactGridLayout
          {...this.props}
          draggableHandle={'.multitrack-header'}
          measureBeforeMount={false}
          onBreakpointChange={this.onBreakpointChange.bind(this)}
          onDragStart={this.handleDragStart.bind(this)}
          onDragStop={this.handleDragStop.bind(this)}
          onLayoutChange={this.handleLayoutChange.bind(this)}
          onResize={this.onResize.bind(this)}
          rowHeight={30}

          // for some reason, this becomes 40 within the react-grid component
          // (try resizing the component to see how much the height changes)
          // Programming by coincidence FTW :-/
          // WidthProvider option
          // I like to have it animate on mount. If you don't, delete `useCSSTransforms` (it's default `true`)
          // and set `measureBeforeMount={true}`.
          useCSSTransforms={this.state.mounted}
        >
        { tiledAreas }
        </ResponsiveReactGridLayout>
        <div>
            <div 
                className="view-menu"
                style={{"width": 32, "height": 26, "position": "relative", "marginBottom": 4, "marginRight": 12,  "opacity": 0.6, "float": "right"}} 
            >
                    <img 
                        onClick={this.handleAddView.bind(this)}
                        src="images/plus.svg" 
                        className={'multiview-add-img'}
                    />
            </div>
        </div>


      </div>
    );
  }
}


MultiViewContainer.defaultProps = {
    className: "layout",
    cols: {lg: 6, md: 6, sm: 6, xs: 6, xxs: 6}
  }
MultiViewContainer.propTypes = {
    children: React.PropTypes.array,
    viewConfig: React.PropTypes.object,
    onNewConfig: React.PropTypes.func
  }
