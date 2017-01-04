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

import {PopupMenu} from './PopupMenu.jsx';
import {ConfigViewMenu} from './ConfigViewMenu.jsx';
import {ContextMenuContainer} from './ContextMenuContainer.jsx';
import {scalesCenterAndK, dictItems, dictFromTuples, dictValues, dictKeys} from './utils.js';

const ResponsiveReactGridLayout = WidthProvider(Responsive);

class ZoomLockGroup {
    /**
     * A zoom lock group is a set of views who's zoom is locked at a fixed
     * offset from some standard.
     *
     * When one view is zoomed, all other views in the group need to be zoomed
     * as well.
     */
    constructor() {
        this.uid = slugid.nice();

        this.views = {};
    }

    addView(uid, [centerX, centerY, k]) {
        /**
         * Add a view to the group. 
         * 
         * @param uid: The identifier for a view.
         * @param centerX: This view's current centerX position
         * @param centerY: This view's current centerY position
         * @param k: This view's current zoom level
         */

        this.views[uid] = {centerX: centerX, centerY: centerY, k: k};

    }

    removeView(uid) {
        /**
         * Remove a view from the zoom group.
         */

        delete this.views[uid];
    }

    memberUids() {
        /**
         * Return the uids of the views which are members of this zoom group
         */
        return Object.keys(this.views);
    }
}

export class MultiViewContainer extends React.Component {
    constructor(props) {
        super(props);

        this.uid = slugid.nice();
        this.yPositionOffset = 0;
        this.rowHeight = 40;
        this.tiledPlots = {};

        // keep track of the xScales of each Track Renderer
        this.xScales = {};
        this.yScales = {};

        // zoom locks between views
        this.zoomLocks = {};
        this.lockGroups = {};

        this.setCenters = {};

        this.plusImg = {};
        this.configImg = {};

        this.horizontalMargin = 5;
        this.verticalMargin = 5;

        this.viewConfig = this.props.viewConfig;

          this.pixiStage = new PIXI.Container();
          this.pixiStage.interactive = true;
          this.element = null;

          let views = [{
              uid: slugid.nice(),
              initialXDomain: [-1000000,30000000],
              initialYDomain: [-1000000,30000000],
              'tracks': {
            'top': [
                  /*
                {'uid': slugid.nice(), type:'top-axis'}
            ,
        */

                    {'uid': slugid.nice(), 
                        type:'horizontal-1d-tiles',
                        height: 20,
                      tilesetUid: 'bb',
                      server: 'localhost:8000'}
                      ,
                    {'uid': slugid.nice(), 
                        type:'horizontal-line',
                        height: 20,
                      tilesetUid: 'bb',
                      server: 'localhost:8000'}
                    /*
                      ,
                {'uid': slugid.nice(),
                 type: 'combined',
                 height: 100,
                 contents:
                     [
                    {'uid': slugid.nice(), 
                        type:'horizontal-line',
                        height: 30,
                        width: 20,
                      tilesetUid: 'bb',
                      server: 'localhost:8000'}
                      ,
                    {'uid': slugid.nice(),
                        type: 'top-stacked-interval',
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

                     ]
                }
                      */
            ],
            'left': [
                {'uid': slugid.nice(), type:'left-axis', width: 80}
                /*
                ,
                {'uid': slugid.nice(),
                 type: 'combined',
                 width: 60,
                 contents:
                     [
                         /*
                    {'uid': slugid.nice(),
                        type: 'left-stacked-interval',
                        height: 30,
                        tilesetUid: 'cc',
                        server: 'localhost:8000' 
                    }
                    ,
                    {'uid': slugid.nice(), 
                        type:'vertical-line',
                        height: 30,
                        width: 20,
                      tilesetUid: 'bb',
                      server: 'localhost:8000'}
                     ]
                }
                      ,
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

                        { 'server': 'localhost:8000',
                          'uid': slugid.nice(),
                          'tilesetUid': 'aa',
                          'type': 'heatmap'
                        }
                        ,
                        { 'server': 'localhost:8000',
                          'uid': slugid.nice(),
                          'tilesetUid': 'aa',
                          'type': '2d-tiles'
                        }
                    ]
                }
            ]}
            ,
            layout: {x: 0, y: 0, w: 2, h: 8}

          }
          ,
            {
              uid: slugid.nice(),
              initialXDomain: [20000000,300000000],
              initialYDomain: [20000000,300000000],
              'tracks': {
            'top': [
                {'uid': slugid.nice(), type:'top-axis'}
            ,

                    {'uid': slugid.nice(), 
                        type:'horizontal-1d-tiles',
                        height: 20,
                      tilesetUid: 'bb',
                      server: 'localhost:8000'}
                      ,
                    {'uid': slugid.nice(), 
                        type:'horizontal-line',
                        height: 20,
                      tilesetUid: 'bb',
                      server: 'localhost:8000'}
                    /*
                      ,
                {'uid': slugid.nice(),
                 type: 'combined',
                 height: 100,
                 contents:
                     [
                    {'uid': slugid.nice(), 
                        type:'horizontal-line',
                        height: 30,
                        width: 20,
                      tilesetUid: 'bb',
                      server: 'localhost:8000'}
                      ,
                    {'uid': slugid.nice(),
                        type: 'top-stacked-interval',
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

                     ]
                }
                      */
            ],
            'left': [
                {'uid': slugid.nice(), type:'left-axis', width: 80}
                /*
                ,
                {'uid': slugid.nice(),
                 type: 'combined',
                 width: 60,
                 contents:
                     [
                         /*
                    {'uid': slugid.nice(),
                        type: 'left-stacked-interval',
                        height: 30,
                        tilesetUid: 'cc',
                        server: 'localhost:8000' 
                    }
                    ,
                    {'uid': slugid.nice(), 
                        type:'vertical-line',
                        height: 30,
                        width: 20,
                      tilesetUid: 'bb',
                      server: 'localhost:8000'}
                     ]
                }
                      ,
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

                        { 'server': 'localhost:8000',
                          'uid': slugid.nice(),
                          'tilesetUid': 'aa',
                          'type': 'heatmap'
                        }
                        ,
                        { 'server': 'localhost:8000',
                          'uid': slugid.nice(),
                          'tilesetUid': 'aa',
                          'type': '2d-tiles'
                        }
                    ]
                }
            ]}
            ,
            layout: {x: 3, y: 0, w: 3, h: 10}

          }
          
          ]

          this.state = {
            currentBreakpoint: 'lg',
            mounted: false,
            width: 0,
            height: 0,
            layouts: {},
            svgElement: null,
            canvasElement: null,
            views: views,
            addTrackPositionMenuPosition: null,

            //chooseViewHandler: uid2 => this.handleZoomYanked(views[0].uid, uid2),
            //chooseViewHandler: uid2 => this.handleZoomLockChosen(views[0].uid, uid2),
            //chooseViewHandler: uid2 => this.handleCenterSynced(views[0].uid, uid2),
            chooseTrackHandler: (viewUid, trackUid) => this.handleViewportProjected(views[0].uid, viewUid, trackUid),
            mouseOverOverlayUid: views[0].uid,
            configMenuUid: null
          }
    }


    componentDidMount() {
        this.element = ReactDOM.findDOMNode(this);
        this.state.views.map(v => {
            if (!v.layout)
                v.layout = this.generateViewLayout(v)
            else {
                v.layout.i = v.uid;
            }
        });

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

    animate() {
        this.pixiRenderer.render(this.pixiStage);
        this.frame = requestAnimationFrame(this.animate.bind(this));
    }

  onBreakpointChange(breakpoint) {
    this.setState({
      currentBreakpoint: breakpoint
    });
  };
  
  handleOverlayMouseEnter(uid) {
    this.setState({
        mouseOverOverlayUid: uid
    })
  }

  handleOverlayMouseLeave(uid) {
    this.setState({
        mouseOverOverlayUid: null
    })
  }

  handleLockZoom(uid) {
      /**
       * We want to lock the zoom of this view to the zoom of another view.
       * 
       * First we pick which other view we want to lock to.
       *
       * The we calculate the current zoom offset and center offset. The differences
       * between the center of the two views will always remain the same, as will the
       * different between the zoom levels.
       */
      if (this.zoomLocks[uid]) {
          // this view already has a zoom lock, we we need to turn it off
          this.handleUnlockZoom(uid);

          this.setState({
            mouseOverOverlayUid: uid,
            configMenuUid: null
          });

          return;
      }

        // create a view chooser and remove the config view menu
        this.setState({
            chooseViewHandler: uid2 => this.handleZoomLockChosen(uid, uid2),
            mouseOverOverlayUid: uid,
            configMenuUid: null
        });
  }

  handleScalesChanged(uid, xScale, yScale) {
      /*
       * The scales of some view have changed (presumably in response to zooming).
       *
       * Mark the new scales and update any locked views.
       */
      this.xScales[uid] = xScale;
      this.yScales[uid] = yScale;

      if (this.zoomLocks[uid]) {
          // this view is locked to another
          let lockGroup = this.zoomLocks[uid];
          let lockGroupItems = dictItems(lockGroup);

          let [centerX, centerY, k] = scalesCenterAndK(this.xScales[uid], this.yScales[uid]);


          for (let i = 0; i < lockGroupItems.length; i++) {
             let key = lockGroupItems[i][0];
             let value = lockGroupItems[i][1];

             let dx = value[0] - lockGroup[uid][0];
             let dy = value[1] - lockGroup[uid][1];
             let rk = value[2] / lockGroup[uid][2];

              let newCenterX = centerX + dx;
              let newCenterY = centerY + dy;
              let newK = k * rk;

              this.setCenters[key](newCenterX, newCenterY, newK, false);
          }



          /*
          if (uid == zoomLock.source) {
              let newCenterX = centerX + zoomLock.centerDiff[0];
              let newCenterY = centerY + zoomLock.centerDiff[1];

              let newK = k * zoomLock.zoomRatio;

              // set a new center, but don't notify of a change to prevent
              // circular notifications
              this.setCenters[zoomLock.target](newCenterX, newCenterY, newK, false);
          } else {
              let newCenterX = centerX - zoomLock.centerDiff[0];
              let newCenterY = centerY - zoomLock.centerDiff[1];

              let newK = k / zoomLock.zoomRatio;
              // set a new center, but don't notify of a change to prevent
              // circular notifications
              this.setCenters[zoomLock.source](newCenterX, newCenterY, newK, false);
          }
          */
      }
  }

  handleProjectViewport(uid) {
    /**
     * We want to show the extent of this viewport on another view.
     */


        this.setState({
            chooseTrackHandler: (viewUid, trackUid) => this.handleViewportProjected(uid, viewUid, trackUid),
            configMenuUid: null
        });
  }

  handleSyncCenter(uid) {
        /**
         * We want the center of this view to match the center of another
         * view.
         *
         */

        this.setState({
            chooseViewHandler: uid2 => this.handleCenterSynced(uid, uid2),
            mouseOverOverlayUid: uid,
            configMenuUid: null
        });
  }

  handleYankZoom(uid) {
        /**
         * We want to match the zoom level of another view.
         *
         * That means synchronizing the center point and zoom level
         * of the first view to the second view.
         */

        this.setState({
            chooseViewHandler: uid2 => this.handleZoomYanked(uid, uid2),
            mouseOverOverlayUid: uid,
            configMenuUid: null
        });
  }

  handleUnlockZoom(uid) {
      /**
       * We want to unlock uid from the zoom group that it's in.
       *
       * @param uid: The uid of a view.
       */

    // if this function is being called, lockGroup has to exist
    let lockGroup = this.zoomLocks[uid];

    let lockGroupKeys = dictKeys(lockGroup);

    if (lockGroupKeys.length == 2) {
        // there's only two items in this lock group so we need to 
        // remove them both (no point in having one view locked to itself)
        delete this.zoomLocks[lockGroupKeys[0]];
        delete this.zoomLocks[lockGroupKeys[1]];

        return;
    } else {
        // delete this view from the zoomLockGroup
        delete this.zoomLocks[uid][uid];

        // remove the handler
        delete this.zoomLocks[uid];
    }
  }

  handleZoomLockChosen(uid1, uid2) {
        /* Views uid1 and uid2 need to be locked so that they always maintain the current
         * zoom and translation difference.
         * @param uid1: The view that the lock was called from
         * @param uid2: The view that the lock was called on (the view that was selected)
         */

      if (uid1 == uid2) {
            this.setState({
                chooseViewHandler: null
            });

          return;    // locking a view to itself is silly
      }

      let group1Members = [];
      let group2Members = [];

      if (!this.zoomLocks[uid1]) {
          // view1 isn't already in a group
          group1Members = [[uid1, scalesCenterAndK(this.xScales[uid1], this.yScales[uid1])]];
      } else {
          // view1 is already in a group
          group1Members = dictItems(this.zoomLocks[uid1]).map(x => 
            // x is [uid, [centerX, centerY, k]]
            [x[0], scalesCenterAndK(this.xScales[x[0]], this.yScales[x[0]])] 
          )
      }

      if (!this.zoomLocks[uid2]) {
          // view1 isn't already in a group
          group2Members = [[uid2, scalesCenterAndK(this.xScales[uid2], this.yScales[uid2])]];
      } else {
          // view2 is already in a group
          group2Members = dictItems(this.zoomLocks[uid2]).map(x => 
            // x is [uid, [centerX, centerY, k]]
            [x[0], scalesCenterAndK(this.xScales[x[0]], this.yScales[x[0]])] 
          )
      }

      let allMembers = group1Members.concat(group2Members);
      let groupDict = dictFromTuples(allMembers);

      console.log('groupDict:', groupDict);

      allMembers.forEach(m => { this.zoomLocks[m[0]] = groupDict });
        
        this.setState({
            chooseViewHandler: null
        });
  }

  handleViewportProjected(fromView, toView, toTrack) {
    /**
     * We want to project the viewport of fromView onto toTrack of toView.
     *
     * @param fromView: The uid of the view that we want to project
     * @param toView: The uid of the view that we want to project to
     * @param toTrack: The track we want to project to
     */
      console.log('handleViewportProjected:', fromView, toView, toTrack);
      this.setState({
            chooseTrackHandler: null
      });
  }

  handleCenterSynced(uid1, uid2) {
        /**
         * Uid1 is copying the center of uid2
         */
        // where we're taking the zoom from
        let sourceXScale = this.xScales[uid2];
        let sourceYScale = this.yScales[uid2];

        let targetXScale = this.xScales[uid1];
        let targetYScale = this.yScales[uid1];


        let [targetCenterX, targetCenterY, targetK] = scalesCenterAndK(targetXScale, targetYScale);
        let [sourceCenterX, sourceCenterY, sourceK] = scalesCenterAndK(sourceXScale, sourceYScale);


        // set target center
        this.setCenters[uid1](sourceCenterX,sourceCenterY, targetK, false);
        

        this.setState({
            chooseViewHandler: null
        });
  }

  handleZoomYanked(uid1, uid2) {
        /**
         * Uid1 yanked the zoom of uid2, now  make sure that they're synchronized.
         */

        // where we're taking the zoom from
        let sourceXScale = this.xScales[uid2];
        let sourceYScale = this.yScales[uid2];


        let [sourceCenterX, sourceCenterY, sourceK] = scalesCenterAndK(sourceXScale, sourceYScale);


        // set target center
        this.setCenters[uid1](sourceCenterX,sourceCenterY, sourceK, false);
        

        this.setState({
            chooseViewHandler: null
        });
  }
      

  handleConfigMenuOpened(uid) {
      /**
       * The user clicked on the `cog` of the menu so we need to open
       * it.
       */
    let bbox = this.configImg[uid].getBoundingClientRect();

    this.setState({
        configMenuUid: uid,
        configMenuPosition: bbox
    });
  }

  handleAddTrackPositionMenuOpened(uid) {
      /**
       * The user has clicked on the 'plus' sign at the top of a TiledPlot
       * so we need to open the Track Position Chooser dialog
       */
    let bbox = this.plusImg[uid].getBoundingClientRect();

    this.setState({
        addTrackPositionMenuUid: uid,
        addTrackPositionMenuPosition: bbox
    });
  }

  handleTrackPositionChosen(position) {
      /**
       * The user has chosen a position for the new track. The actual
       * track selection will be handled by TiledPlot
       *
       * We just need to close the menu here.
       */
    this.setState({
        addTrackPositionMenuUid: null,
        addTrackPositionMenuPosition: null
    });
  }

  handleLayoutChange(layout, layouts) {
      /**
       * Notify the children that the layout has changed so that they
       * know to redraw themselves
       */
      this.handleDragStart();
      this.handleDragStop();

      layout.forEach(l => {
        let correspondingView = this.state.views.filter(x => x.uid == l.i);

        if (correspondingView.length) {
            correspondingView[0].layout = l;
        }
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
      newView.layout.i = newView.uid;

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

    let configMenu = null;

    if (this.state.configMenuUid) {
        configMenu = (<PopupMenu
                        onMenuClosed={e => this.setState({configMenuUid: null})}
                      >
                            <ContextMenuContainer
                                position={this.state.configMenuPosition}
                                orientation={'left'}
                            >
                                <ConfigViewMenu
                                    zoomLock={this.zoomLocks[this.state.configMenuUid]}
                                    onLockZoom={e => this.handleLockZoom(this.state.configMenuUid)}
                                    onYankZoom={e => this.handleYankZoom(this.state.configMenuUid)}
                                    onSyncCenter={e => this.handleSyncCenter(this.state.configMenuUid)}
                                    onProjectViewport={e => this.handleProjectViewport(this.state.configMenuUid)}
                                />
                            </ContextMenuContainer>
                        </PopupMenu>);
    }

    // The component needs to be mounted in order for the initial view to have the right
    // width
    if (this.state.mounted) {
        tiledAreas = this.state.views.map(function(view, i) {
                let layout = view.layout;

                let itemUid = view.uid;

                // only show the add track menu for the tiled plot it was selected
                // for
                let addTrackPositionMenuPosition = 
                    view.uid == this.state.addTrackPositionMenuUid ? 
                        this.state.addTrackPositionMenuPosition :
                            null;

                let overlay = null
                if (this.state.chooseViewHandler) {
                    let background='transparent';

                    if (this.state.mouseOverOverlayUid == view.uid)
                        background = 'green';
                    overlay = (<div 
                               className='tiled-plot-overlay'
                               style={{
                                   position: 'absolute',
                                   width: '100%',
                                   height: '100%',
                                   background: background,
                                   opacity: 0.3
                               }}
                                onClick={e => this.state.chooseViewHandler(view.uid)}
                                onMouseEnter={e => this.handleOverlayMouseEnter(view.uid)}
                                onMouseLeave={e => this.handleOverlayMouseLeave(view.uid)}
                               ></div>)
                }

                let tiledPlot = (
                                <TiledPlot
                                    parentMounted={this.state.mounted} 
                                     svgElement={this.state.svgElement}
                                     canvasElement={this.state.canvasElement}
                                     pixiStage={this.pixiStage}
                                     dragging={this.state.dragging}
                                     tracks={view.tracks}
                                     initialXDomain={view.initialXDomain}
                                     initialYDomain={view.initialYDomain}
                                     verticalMargin={this.verticalMargin}
                                     horizontalMargin={this.horizontalMargin}
                                     addTrackPositionMenuPosition={addTrackPositionMenuPosition}
                                     onTrackPositionChosen={this.handleTrackPositionChosen.bind(this)}
                                     ref={c => this.tiledPlots[view.uid] = c}
                                     onScalesChanged={(x,y) => this.handleScalesChanged(view.uid, x, y)}
                                     setCentersFunction={c => this.setCenters[view.uid] = c}
                                     chooseTrackHandler={this.state.chooseTrackHandler ? trackId => this.state.chooseTrackHandler(view.uid, trackId) : null}
                                >

                                </TiledPlot>)

                return (<div 
                            data-grid={layout}
                            key={itemUid}
                            ref={(c) => {this.tiledAreaDiv = c; }}
                            style={tiledAreaStyle}

                        >
                            <div 
                                className="multitrack-header"
                                style={{"width": this.width, "minHeight": 16, "position": "relative", 
                                    "border": "solid 1px", "marginBottom": 4, "opacity": 0.6,
                                    verticalAlign: "middle",
                                    lineHeight: "16px",
                                maxHeight: 16}} 
                            >
                                <span style={{font: "11pt sans-serif"}}>{"Id: " + view.uid.slice(0,2)}
                                </span>
                                <img 
                                    onClick={ e => this.handleConfigMenuOpened(view.uid) }
                                    src="images/cog.svg" 
                                    ref={c => this.configImg[view.uid] = c}
                                    className={'multiview-config-img'}
                                    width="10px" 
                                />

                                <img 
                                    onClick={ e => this.handleAddTrackPositionMenuOpened(view.uid) }
                                    src="images/plus.svg" 
                                    ref={c => this.plusImg[view.uid] = c}
                                    className={'multiview-add-track-img'}
                                    width="10px" 
                                />

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
                                {tiledPlot}
                            </SearchableTiledPlot>
                            {overlay}
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
                    opacity: 0.00
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

        {configMenu}
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
