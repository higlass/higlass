import '../styles/MultiViewContainer.css';
import React from 'react';
import _ from 'lodash';
import {select} from 'd3-selection';
import {scaleLinear} from 'd3-scale';
import {request,post} from 'd3-request';
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
import {getTrackPositionByUid, getTrackByUid} from './utils.js';
import {positionedTracksToAllTracks} from './utils.js';
import {usedServer, tracksInfo, tracksInfoByType} from './config.js';
import {SHORT_DRAG_TIMEOUT, LONG_DRAG_TIMEOUT} from './config.js';
import {GenomePositionSearchBox} from './GenomePositionSearchBox.jsx';
import {ExportLinkModal} from './ExportLinkModal.jsx';
import {createSymbolIcon} from './symbol.js';
import {all as icons} from './icons.js';

const ResponsiveReactGridLayout = WidthProvider(Responsive);

export class HiGlassComponent extends React.Component {
    constructor(props) {
        super(props);

        this.minHorizontalHeight = 20;
        this.minVerticalWidth = 20;

        this.uid = slugid.nice();
        this.yPositionOffset = 0;
        this.rowHeight = 40;
        this.tiledPlots = {};

        // keep track of the xScales of each Track Renderer
        this.xScales = {};
        this.yScales = {};
        this.topDiv = null;

        // event listeners for when the scales of a view change
        // bypasses the React event framework because this needs
        // to be fast
        // indexed by view uid and then listener uid
        this.scalesChangedListeners = {};
        this.draggingChangedListeners = {};

        // zoom locks between views
        this.zoomLocks = {};
        this.setCenters = {};

        this.plusImg = {};
        this.configImg = {};
        this.copyImg = {};

        this.horizontalMargin = 5;
        this.verticalMargin = 5;

        this.boundRefreshView = this.refreshView.bind(this);

        let localServer = "localhost:8000";

        //let usedServer = localServer;
        //let usedServer = remoteServer;

        this.viewConfig = this.props.viewConfig;

          this.pixiStage = new PIXI.Container();
          this.pixiStage.interactive = true;
          this.element = null;

          let viewsByUid = this.processViewConfig(this.props.viewConfig);

          this.state = {
            currentBreakpoint: 'lg',
            mounted: false,
            width: 0,
            height: 0,
            layouts: {},
            svgElement: null,
            canvasElement: null,
            views: viewsByUid,
            addTrackPositionMenuPosition: null,

            //chooseViewHandler: uid2 => this.handleZoomYanked(views[0].uid, uid2),
            //chooseViewHandler: uid2 => this.handleZoomLockChosen(views[0].uid, uid2),
            //chooseViewHandler: uid2 => this.handleCenterSynced(views[0].uid, uid2),
            //chooseTrackHandler: (viewUid, trackUid) => this.handleViewportProjected(views[0].uid, viewUid, trackUid),
            mouseOverOverlayUid: null,
            configMenuUid: null,
            exportLinkModalOpen: false,
            exportLinkLocation: null
          }
    }

    componentDidMount() {
        // the addEventListener is necessary because TrackRenderer determines where to paint
        // all the elements based on their bounding boxes. If the window isn't
        // in focus, everything is drawn at the top and overlaps. When it gains
        // focus we need to redraw everything in its proper place
        window.addEventListener("focus", this.boundRefreshView);

        this.element = ReactDOM.findDOMNode(this);
        dictValues(this.state.views).map(v => {
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
                                          resolution: 2,
                                          autoResize: true
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
            let width = this.element.clientWidth;
            let height = this.element.clientHeight;

             this.pixiRenderer.resize(width, height);

            this.pixiRenderer.view.style.width = width + "px";
            this.pixiRenderer.view.style.height = height + "px";

            this.pixiRenderer.render(this.pixiStage);
         }.bind(this));

        this.handleDragStart();
        this.handleDragStop();

        this.animate();
        //this.handleExportViewsAsLink();

        const baseSvg = select(this.element).append('svg').style('display', 'none');

        // Add SVG Icons
        icons.forEach(
            icon => createSymbolIcon(baseSvg, icon.id, icon.paths, icon.viewBox)
        );
    }

    handleWindowFocused() {
        /*
         * The window housing this view gained focus. That means the bounding boxes
         * may have changed so we need to redraw everything.
         *
         */


    }

    addDefaultOptions(track) {
        if (track.options)
            return;

        if (!tracksInfoByType.hasOwnProperty(track.type)) {
            console.log("ERROR: track type not found:", track.type, " (check app/scripts/config.js for a list of defined track types)");
            return;
        }

        if (!track.options) {
            track.options = tracksInfoByType[track.type].defaultOptions;
        }
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

  notifyDragChangedListeners(dragging) {
      // iterate over viewId
      dictValues(this.draggingChangedListeners).forEach(l => {
          // iterate over listenerId
          dictValues(l).forEach(listener => listener(dragging));
      });
  }

  addDraggingChangedListener(viewUid, listenerUid, eventHandler) {
      /**
       * Add a listener that will be called every time the view is updated.
       *
       * @param viewUid: The uid of the view being observed
       * @param listenerUid: The uid of the listener
       * @param eventHandler: The handler to be called when the scales change
       *    Event handler is called with parameters (xScale, yScale)
       */
        if (!this.draggingChangedListeners.hasOwnProperty(viewUid)) {
            this.draggingChangedListeners[viewUid] = {}
        }

        this.draggingChangedListeners[viewUid][listenerUid] = eventHandler;

        eventHandler(true);
        eventHandler(false);
  }

  removeDraggingChangedListener(viewUid, listenerUid) {
      /**
       * Remove a scale change event listener
       *
       * @param viewUid: The view that it's listening on.
       * @param listenerUid: The uid of the listener itself.
       */
        if (this.draggingChangedListeners.hasOwnProperty(viewUid)) {
            let listeners = this.draggingChangedListeners[viewUid];

            if (listeners.hasOwnProperty(listenerUid))
                delete listeners[listenerUid];
        }
  }

  addScalesChangedListener(viewUid, listenerUid, eventHandler) {
      /**
       * Add an event listener that will be called every time the scale
       * of the view with uid viewUid is changed.
       *
       * @param viewUid: The uid of the view being observed
       * @param listenerUid: The uid of the listener
       * @param eventHandler: The handler to be called when the scales change
       *    Event handler is called with parameters (xScale, yScale)
       */
        if (!this.scalesChangedListeners.hasOwnProperty(viewUid)) {
            this.scalesChangedListeners[viewUid] = {}
        }

        this.scalesChangedListeners[viewUid][listenerUid] = eventHandler;

        // call the handler for the first time
        eventHandler(this.xScales[viewUid], this.yScales[viewUid]);
  }

  removeScalesChangedListener(viewUid, listenerUid) {
      /**
       * Remove a scale change event listener
       *
       * @param viewUid: The view that it's listening on.
       * @param listenerUid: The uid of the listener itself.
       */
        if (this.scalesChangedListeners.hasOwnProperty(viewUid)) {
            let listeners = this.scalesChangedListeners[viewUid];

            if (listeners.hasOwnProperty(listenerUid))
                delete listeners[listenerUid];
        }
  }

  handleScalesChanged(uid, xScale, yScale, notify=true) {
      /*
       * The scales of some view have changed (presumably in response to zooming).
       *
       * Mark the new scales and update any locked views.
       *
       * @param uid: The view of whom the scales have changed.
       */
      this.xScales[uid] = xScale;
      this.yScales[uid] = yScale;

      if (notify) {
          if (this.scalesChangedListeners.hasOwnProperty(uid)) {
            dictValues(this.scalesChangedListeners[uid]).forEach(x => {
                x(xScale, yScale);

            });
          }
      }

      if (this.zoomLocks[uid]) {
          // this view is locked to another
          let lockGroup = this.zoomLocks[uid];
          let lockGroupItems = dictItems(lockGroup);


          let [centerX, centerY, k] = scalesCenterAndK(this.xScales[uid], this.yScales[uid]);


          for (let i = 0; i < lockGroupItems.length; i++) {
             let key = lockGroupItems[i][0];
             let value = lockGroupItems[i][1];


              if (key == uid)  // no need to notify oneself that the scales have changed
                  continue

             let dx = value[0] - lockGroup[uid][0];
             let dy = value[1] - lockGroup[uid][1];
             let rk = value[2] - lockGroup[uid][2];

              let newCenterX = centerX + dx;
              let newCenterY = centerY + dy;
              let newK = k + rk;

                if (!this.setCenters[key])
                    continue;

              let [newXScale, newYScale] = this.setCenters[key](newCenterX, newCenterY, newK, false);

              // because the setCenters call above has a 'false' notify, the new scales won't
              // be propagated from there, so we have to store them here
              this.xScales[key] = newXScale;
              this.yScales[key] = newYScale;

              // notify the listeners of all locked views that the scales of
              // this view have changed
              if (this.scalesChangedListeners.hasOwnProperty(key)) {
                dictValues(this.scalesChangedListeners[key]).forEach(x => {
                    x(newXScale, newYScale);
                });
              }
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
        if (this.zoomLocks[uid])
            if (this.zoomLocks[uid][uid])
                delete this.zoomLocks[uid][uid];

        // remove the handler
        if (this.zoomLocks[uid])
            delete this.zoomLocks[uid];
    }
  }

  addZoomLock(uid1, uid2) {
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

      allMembers.forEach(m => { this.zoomLocks[m[0]] = groupDict });

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

      this.addZoomLock(uid1, uid2);


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
      let hostTrack = getTrackByUid(this.state.views[toView].tracks, toTrack);
      let position = getTrackPositionByUid(this.state.views[toView].tracks, toTrack);

      let newTrack = {
          uid: slugid.nice(),
          type: 'viewport-projection-' + position,
          fromViewUid: fromView
      }

      this.addCallbacks(toView, newTrack);
      this.handleTrackAdded(toView, newTrack, position, hostTrack);

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
        let correspondingView = this.state.views[l.i];

        if (correspondingView) {
            correspondingView.layout = l;
        }
      });
  };

  clearDragTimeout() {
      /**
       * Maybe somebody started dragging again before the previous drag
       * timeout fired. In that case, we need to clear this timeout so
       * that it doesn't override a previously set one.
       */
    if (this.dragTimeout) {
        clearTimeout(this.dragTimeout);
        this.dragTimeout = null;
    }
  }

  refreshView() {
    this.clearDragTimeout();

    this.notifyDragChangedListeners(true);

    this.clearDragTimeout();
    this.dragTimeout = setTimeout(() => {
            this.notifyDragChangedListeners(false);
        }, SHORT_DRAG_TIMEOUT);
  }

    handleDragStart(layout, oldItem, newItem, placeholder, e, element) {
        this.clearDragTimeout();
        this.notifyDragChangedListeners(true);
    }

    handleDragStop() {
        // wait for the CSS transitions to end before
        // turning off the dragging state
        //
        this.clearDragTimeout();
        this.dragTimeout = setTimeout(() => {
            this.notifyDragChangedListeners(false);
        }, LONG_DRAG_TIMEOUT);
    }

  onNewLayout() {

  };

  onResize(layout, oldItem, newItem, placeholder, e, element) {

  }

    fillInMinWidths(tracksDict) {
        /**
         * If tracks don't have specified dimensions, add in the known
         * minimums
         *
         * Operates on the tracks stored for this TiledPlot.
         */
        let horizontalLocations = ['top', 'bottom'];

        // first make sure all track types are specified
        // this will make the code later on simpler
        if (!('center' in tracksDict))
            tracksDict['center'] = [];
        if (!('left' in tracksDict))
            tracksDict['left'] = [];
        if (!('right' in tracksDict))
            tracksDict['right'] = [];
        if (!('top' in tracksDict))
            tracksDict['top'] = [];
        if (!('bottom' in tracksDict))
            tracksDict['bottom'] = [];

        for (let j = 0; j < horizontalLocations.length; j++) {
            let tracks = tracksDict[horizontalLocations[j]];

            //e.g. no 'top' tracks
            if (!tracks)
                continue;

            for (let i = 0; i < tracks.length; i++) {
                if (!('height' in tracks[i])) {
                    tracks[i].height = this.minHorizontalHeight;
                }
            }
        }

        let verticalLocations = ['left', 'right'];

        for (let j = 0; j < verticalLocations.length; j++) {
            let tracks = tracksDict[verticalLocations[j]];

            //e.g. no 'left' tracks
            if (!tracks)
                continue;

            for (let i = 0; i < tracks.length; i++) {
                if (!('width' in tracks[i]))
                    tracks[i].width = this.minVerticalWidth;
            }
        }

        return tracksDict;
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
      if (dictValues(this.state.views).length == 1) {
            console.log("Can't close the only view");
            return;
      }

      // if this view was zoom locked to another, we need to unlock it
      this.handleUnlockZoom(uid);


      delete this.state.views[uid];

      // might want to notify the views that they're beig closed
      this.setState({
          'views': this.state.views
      });
  }

    handleSeriesAdded(viewId, newTrack, position, hostTrack) {
        /**
         * We're adding a new dataset to an existing track
         *
         * @param newTrack: The new track to be added.
         * @param position: Where the new series should be placed.
         *  (This could also be inferred from the hostTrack, but since
         *  we already have it, we might as well use it)
         * @param hostTrack: The track that will host the new series.
         */

        // is the host track a combined track?
        // if so, easy, just append the new track to its contents
        // if not, remove the current track from the track list
        // create a new combined track, add the current and the new
        // tracks and then update the whole track list
        let tracks = this.state.views[viewId].tracks;

        if (hostTrack.type == 'combined') {
            hostTrack.contents.push(newTrack);
        } else {
            let newHost = { type: 'combined',
                            uid: slugid.nice(),
                            height: hostTrack.height,
                            width: hostTrack.width,
                            contents: [hostTrack, newTrack] }

            let positionTracks = tracks[position];

            for (let i = 0; i < positionTracks.length; i++) {
                if (positionTracks[i].uid == hostTrack.uid)
                    positionTracks[i] = newHost;
            }
        }

        this.setState({
            views: this.state.views
        });
    }

    handleTrackAdded(viewId, newTrack, position, host=null) {
        /**
         * A track was added from the AddTrackModal dialog.
         *
         * @param trackInfo: A JSON object that can be used as a track
         *                   definition
         * @param position: The position the track is being added to
         * @param host: If this track is being added to another track
         */
        this.addDefaultOptions(newTrack);
        this.addNameToTrack(newTrack);

        if (host) {
            // we're adding a series rather than a whole new track
            this.handleSeriesAdded(viewId, newTrack, position, host);
            return;
        }

        newTrack.width = this.minVerticalWidth;
        newTrack.height = this.minHorizontalHeight;


        let tracks = this.state.views[viewId].tracks;
        if (position == 'left' || position == 'top') {
            // if we're adding a track on the left or the top, we want the
            // new track to appear at the begginning of the track list
            tracks[position].unshift(newTrack);

        } else if (position == 'center') {
            // we're going to have to either overlay the existing track with a new one
            // or add another one on top
            if (tracks['center'].length == 0) {
                // no existing tracks
                let newCombined = {
                    uid: slugid.nice(),
                    type: 'combined',
                    contents: [
                        newTrack ]
                }
                tracks['center'] = [newCombined];
            } else {
                // center track exists
                if (tracks['center'][0].type == 'combined') {
                    // if it's a combined track, we just need to add this track to the
                    // contents
                    tracks['center'][0].contents.push(newTrack);
                } else {
                    // if it's not, we have to create a new combined track
                    let newCombined = {
                        uid: slugid.nice(),
                        type: 'combined',
                        contents: [
                            tracks['center'][0],
                            newTrack ]
                    }

                    tracks['center'] = [newCombined];
                }
            }
        } else {
            // otherwise, we want it at the end of the track list
            tracks[position].push(newTrack);
        }
    }

    handleCloseTrack(viewId, uid) {
        let tracks = this.state.views[viewId].tracks;

        for (let trackType in tracks) {
            let theseTracks = tracks[trackType];
            let newTracks = theseTracks.filter((d) => { return d.uid != uid; });

            if (newTracks.length == theseTracks.length) {
                // no whole tracks need to removed, see if any of the combined tracks
                // contain series which need to go
                let combinedTracks = newTracks.filter(x => x.type == 'combined')

                combinedTracks.forEach(ct => {
                    ct.contents = ct.contents.filter(x => x.uid != uid);
                });
            } else {
                tracks[trackType] = newTracks;
            }
        }

        this.setState({
            views: this.state.views
        });
    }


  addCallbacks(viewUid, track) {
      /**
       * Add callbacks for functions that need them
       *
       * Done in place.
       *
       * @param track: A view with tracks.
       */
      if (track.type == 'viewport-projection-center') {
          let fromView = track.fromViewUid;

          track.registerViewportChanged = (trackId, listener) => this.addScalesChangedListener(fromView, trackId, listener),
          track.removeViewportChanged = trackId => this.removeScalesChangedListener(fromView, trackId),
          track.setDomainsCallback =  (xDomain, yDomain) => {
            let tXScale = scaleLinear().domain(xDomain).range(this.xScales[fromView].range());
            let tYScale = scaleLinear().domain(yDomain).range(this.yScales[fromView].range());

            let [tx, ty, k] = scalesCenterAndK(tXScale, tYScale);
            this.setCenters[fromView](tx, ty, k, false);

            let locked = false

            if (viewUid in this.zoomLocks)
                locked = fromView in this.zoomLocks[viewUid];

            if (locked)
                this.handleUnlockZoom(viewUid);

            this.handleScalesChanged(fromView, tXScale, tYScale, true);

            if (locked)
                this.addZoomLock(viewUid, fromView);

          }
      }

      return;
  }

  deserializeZoomLocks(viewConfig) {
    this.zoomLocks = {};

    if (viewConfig.zoomLocks) {
        for (let viewUid of dictKeys(viewConfig.zoomLocks.locksByViewUid)) {
            this.zoomLocks[viewUid] = viewConfig.zoomLocks
                .zoomLocksDict[viewConfig.zoomLocks.locksByViewUid[viewUid]];
        }
    }
  }

  serializeZoomLocks(zoomLocks) {
      let zoomLocksDict = {};
      let locksByViewUid = {};

    for (let viewUid of dictKeys(zoomLocks)) {
        if (zoomLocks[viewUid].hasOwnProperty('uid') 
                && zoomLocksDict.hasOwnProperty(zoomLocks[viewUid].uid)) {
            // we've already encountered this zoom lock so no need to do anything
        } else {
            // otherwise, assign this zoomLock its own uid
            let zoomLockUid = slugid.nice();
            zoomLocks[viewUid].uid = zoomLockUid;

            // make a note that we've seen this zoomLock
            zoomLocksDict[zoomLockUid] =  zoomLocks[viewUid];
        }

        // note that this view has a reference to this lock
        locksByViewUid[viewUid] = zoomLocks[viewUid].uid;
    }

    // remove the uids we just added
    for (let viewUid of dictKeys(zoomLocks)) {
        if (zoomLocks[viewUid].hasOwnProperty('uid') )
            delete zoomLocks[viewUid].uid;

    }

    return {'locksByViewUid': locksByViewUid, 'zoomLocksDict': zoomLocksDict}
  }

  getViewsAsString() {
    console.log('views:', this.state.views);
    let newJson = JSON.parse(JSON.stringify(this.props.viewConfig));
    newJson.views = dictItems(this.state.views).map(k => {
        let newView = JSON.parse(JSON.stringify(k[1]));
        let uid = k[0];

        console.log('newView:', newView);

        newView.uid = uid;
        newView.initialXDomain = this.xScales[uid].domain();
        newView.initialYDomain = this.yScales[uid].domain();

        return newView;
    });

    newJson.zoomLocks = this.serializeZoomLocks(this.zoomLocks);

    let data = JSON.stringify(newJson, null, 2);
    return data;
  }

  handleExportViewAsJSON() {
    let data = this.getViewsAsString();

    var a = document.createElement("a");
    var file = new Blob([data], {type: 'text/json'});
    a.href = URL.createObjectURL(file);
    a.download = name;
    a.click();
  }

  handleExportViewsAsLink() {
    let data = this.getViewsAsString();

    this.width = this.element.clientWidth;
    this.height = this.element.clientHeight;

    this.setState({
        exportLinkModalOpen: true,
        exportLinkLocation: null
    });

    request(this.props.viewConfig.exportViewUrl)
        .header("X-Requested-With", "XMLHttpRequest")
        .header("Content-Type", "application/json")
        .post(data, (error, response) => {
            if (response) {
                let content = JSON.parse(response.response);
                this.setState({
                    //exportLinkLocation: this.props.viewConfig.exportViewUrl + "?d=" + content.uid
                    exportLinkLocation: "http://" + window.location.hostname + "/" + "?config=" + content.uid
                });
            } else {
                console.log('error:', error);
            }
        })
  }

  handleAddView(view) {
      /**
       * User clicked on the "Add View" button. We'll duplicate the last
       * view.
       */

      let views = dictValues(this.state.views);
      let lastView = view;

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

      let jsonString = JSON.stringify(lastView);

      let newView = JSON.parse(jsonString);   //ghetto copy

      // place this new view below all the others
      newView.layout.x = 0;
      newView.layout.y = maxY;

      // give it its own unique id
      newView.uid = slugid.nice();
      newView.layout.i = newView.uid;

      positionedTracksToAllTracks(newView.tracks).forEach(t => this.addCallbacks(newView.uid, t));

      this.state.views[newView.uid] = newView;

      this.setState({
          views: this.state.views
      });

      /*
      this.state
      freshViewConfig.views.push(newView);
      let newViewConfigText = JSON.stringify(freshViewConfig);

      this.props.onNewConfig(newViewConfigText);
      */
  }

  addNameToTrack(track) {
      /**
       * Add a name to this track based on its track type.
       *
       * Name is added in-place.
       *
       * The list of track information can be found in config.js:tracksInfo
       */
        let typeToName = {}
        tracksInfo.forEach(x => {
            if (x.name)
                typeToName[x.type] = x.name;
        });

        if (track.type in typeToName)
            track.name = typeToName[track.type];

        return track;
  }

    addUidsToTracks(allTracks) {
        /**
         * Add track names to the ones that have known names in config.js
         */

        allTracks.forEach(t => {
            if (!t.uid)
                t.uid = slugid.nice();
        });

        return allTracks;
    }

    addNamesToTracks(allTracks) {
        /**
         * Add track names to the ones that have known names in config.js
         */

        allTracks.forEach(t => {
            if (!t.name)
                this.addNameToTrack(t)
        });

        return allTracks;
    }

    handleTogglePositionSearchBox(viewUid) {
        /*
         * Show or hide the genome position search box for a given view
         */

        let view = this.state.views[viewUid];
        view.genomePositionSearchBoxVisible = !view.genomePositionSearchBoxVisible;

        this.refreshView();

        this.setState({
            views: this.state.views,
            configMenuUid: null
        });

    }

    handleTrackOptionsChanged(viewUid, trackUid, newOptions) {
        //some track's options changed...
        // redraw the track  and store the changes in the config file
        let view = this.state.views[viewUid];
        let track = getTrackByUid(view.tracks, trackUid);

        track.options = Object.assign(track.options, newOptions);
        console.log('track.options:', track.options)
        this.setState({
            views: this.state.views
        });
    }

    processViewConfig(viewConfig) {
        let views = viewConfig.views;
        let viewsByUid = {};

        views.forEach(v => {
            this.fillInMinWidths(v.tracks);
            viewsByUid[v.uid] = v;

            // Add names to all the tracks
            let looseTracks = positionedTracksToAllTracks(v.tracks);
            this.deserializeZoomLocks(viewConfig);

            // give tracks their default names (e.g. 'type': 'top-axis'
            // will get a name of 'Top Axis'
            looseTracks = this.addUidsToTracks(looseTracks);
            looseTracks = this.addNamesToTracks(looseTracks);

            looseTracks.forEach(t => this.addCallbacks(v.uid, t));

            // add default options (as specified in config.js
            // (e.g. line color, heatmap color scales, etc...)
            looseTracks.forEach(t => this.addDefaultOptions(t));
        });

        return viewsByUid;

    }

    componentWillUnmount() {
        window.removeEventListener('focus', this.boundRefreshView);
    }

    componentWillReceiveProps(newProps) {
        let viewsByUid = this.processViewConfig(newProps.viewConfig);

        this.setState({
            views: viewsByUid
        });
    }

  componentWillUpdate(nextProps, nextState) {
        let width = this.element.clientWidth;
        let height = this.element.clientHeight;


        /*
        this.pixiRenderer.resize(width, height);
        this.pixiRenderer.view.style.width = width + 'px';
        this.pixiRenderer.view.style.height = height + 'px';
        */

        this.pixiRenderer.render(this.pixiStage);

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

    console.log('hgc rendering...');

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
                                    onTogglePositionSearchBox={e => this.handleTogglePositionSearchBox(this.state.configMenuUid)}
                                    onExportViewAsJSON={e => this.handleExportViewAsJSON() }
                                    onExportViewAsLink={e => this.handleExportViewsAsLink() }
                                />
                            </ContextMenuContainer>
                        </PopupMenu>);
    }

    // The component needs to be mounted in order for the initial view to have the right
    // width
    if (this.state.mounted) {
        tiledAreas = dictValues(this.state.views).map(function(view, i) {
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
                                    key={'tp' + view.uid}
                                    parentMounted={this.state.mounted}
                                     svgElement={this.state.svgElement}
                                     canvasElement={this.state.canvasElement}
                                     pixiStage={this.pixiStage}
                                     //dragging={this.state.dragging}
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
                                     onTrackOptionsChanged={(trackId, options) => this.handleTrackOptionsChanged(view.uid, trackId, options) }
                                     onTrackAdded={(newTrack, position, host) => this.handleTrackAdded(view.uid, newTrack, position, host)}
                                     onCloseTrack={uid => this.handleCloseTrack(view.uid, uid)}
                                     zoomable={!this.props.viewConfig.zoomFixed}
                                     editable={this.props.viewConfig.editable}
                                     trackSourceServers={this.props.viewConfig.trackSourceServers}
                                     registerDraggingChangedListener={listener => this.addDraggingChangedListener(view.uid, view.uid, listener)}
                                     removeDraggingChangedListener={listener => this.removeDraggingChangedListener(view.uid, view.uid, listener)}
                                >

                                </TiledPlot>)

                let genomePositionSearchBoxUid = slugid.nice();

                let genomePositionSearchBox = view.genomePositionSearchBoxVisible ?
                    (<GenomePositionSearchBox
                        key={'gpsb' + view.uid}
                        autocompleteSource={view.autocompleteSource}
                        registerViewportChangedListener = {listener => this.addScalesChangedListener(view.uid, view.uid, listener)}
                        removeViewportChangedListener = {() => this.removeScalesChangedListener(view.uid, view.uid)}
                        setCenters = {(centerX, centerY, k) => this.setCenters[view.uid](centerX, centerY, k)}
                        chromInfoPath={view.chromInfoPath}
                        twoD={true}
                     />) : null;
                //genomePositionSearchBox = null;

                let multiTrackHeader = this.props.viewConfig.editable ?
                    (
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

                                <svg
                                    onClick={ e => this.handleAddView(view) }
                                    ref={c => this.copyImg[view.uid] = c}
                                    className={'multiview-copy-img'}
                                    width="10px"
                                    height="10px">
                                    <use href="#copy"></use>
                                </svg>

                                <svg
                                    onClick={ e => this.handleConfigMenuOpened(view.uid) }
                                    ref={c => this.configImg[view.uid] = c}
                                    className={'multiview-config-img'}
                                    width="10px"
                                    height="10px">
                                    <use href="#cog"></use>
                                </svg>

                                <svg
                                    onClick={ e => this.handleAddTrackPositionMenuOpened(view.uid) }
                                    ref={c => this.plusImg[view.uid] = c}
                                    className={'multiview-add-track-img'}
                                    width="10px"
                                    height="10px">
                                    <use href="#plus"></use>
                                </svg>

                                <svg
                                    onClick={() => { this.handleCloseView(view.uid)}}
                                    ref={c => this.configImg[view.uid] = c}
                                    className={'multiview-close-img'}
                                    width="10px"
                                    height="10px">
                                    <use href="#cross"></use>
                                </svg>
                            </div>
                    ) : null; // this.editable ?

                return (<div
                            data-grid={layout}
                            key={itemUid}
                            ref={(c) => {this.tiledAreaDiv = c; }}
                            style={tiledAreaStyle}

                        >
                                {multiTrackHeader}
                                {genomePositionSearchBox}
                                {tiledPlot}
                            {overlay}
                        </div>)

            }.bind(this))   //end tiledAreas =
    }

    let exportLinkModal = this.state.exportLinkModalOpen ?
        (<ExportLinkModal
            linkLocation={this.state.exportLinkLocation}
            onDone={() => this.setState({exportLinkModalOpen: false})}
            width={this.width}
            height={this.height}
         />)
        : null;

    return (
      <div
        ref={(c) => this.topDiv = c}
        key={this.uid}
        style={{position: "relative"}}
      >

        <canvas
            key={this.uid}
            ref={(c) => {
                this.canvasElement = c}}
            style={{
                position: "absolute",
                width: "100%",
                height: "100%"
            }}
        />
        <div
            className="drawing-surface"
            ref={(c) => this.divDrawingSurface=c}
            style={{
                    position: "absolute",
                    background: 'yellow',
                    opacity: 0.00,
            }}
        >
        </div>


        <ResponsiveReactGridLayout
          {...this.props}
          draggableHandle={'.multitrack-header'}
          isDraggable={this.props.viewConfig.editable}
          isResizable={this.props.viewConfig.editable}
          margin={this.props.viewConfig.editable ? [10,10] : [0,0]}
          measureBeforeMoun={false}
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

        {configMenu}
        <svg
            ref={(c) => this.svgElement = c}
            style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                left: 0,
                top: 0,
                pointerEvents: 'none'
            }}
        />
        {exportLinkModal}
      </div>
    );
  }

  componentDidUpdate() {

  }
}


HiGlassComponent.defaultProps = {
    className: "layout",
    cols: {lg: 6, md: 6, sm: 6, xs: 6, xxs: 6}
  }
HiGlassComponent.propTypes = {
    children: React.PropTypes.array,
    viewConfig: React.PropTypes.object,
    onNewConfig: React.PropTypes.func
  }
