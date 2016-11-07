import React from 'react';
import _ from 'lodash';
import slugid from 'slugid';
import ReactDOM from 'react-dom';
import {MultiTrackContainer} from './MultiTrackContainer.jsx';
import {Responsive, WidthProvider} from 'react-grid-layout';
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveReactGridLayout = WidthProvider(Responsive);

export class MultiViewContainer extends React.Component {
    constructor(props) {
        super(props);

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

  }

  generateViewLayout(viewConfig) {
    let minTrackHeight = 30;
    let totalHeight = 0

    for (let i = 0; i < viewConfig.tracks.length; i++) {
        let track = viewConfig.tracks[i];
        console.log('track.height:', track.height);

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
    layout.minH = heightGrid;
    layout.maxH = heightGrid;

    if (layout in viewConfig)
        layout = viewConfig.layout;

    layout.i = slugid.nice();

    return layout;
  }

  handleAddView() {
      /**
       * User clicked on the "Add View" button. We'll duplicate the last
       * view.
       */
      console.log('addView clicked');
      console.log('this.viewConfig:', this.props.viewConfig);

      let freshViewConfig = JSON.parse(this.props.viewConfig.text)
      let views = freshViewConfig.views;
      let lastView = views[views.length-1];

      let maxY = 0;

      for (let i = 0; i < views.length; i++) {
          let view = views[i];

          // we don't want to serialize zoom dispatches
          if ('zoomDispatch' in view)
              delete view.zoomDispatch;

          if ('layout' in view) {
              if ('minH' in view.layout)
                    maxY = Math.max(maxY, view.layout.y + view.layout.minH);
              else
                    maxY = Math.max(maxY, view.layout.y + 1);
          }
      }


      let newView = JSON.parse(JSON.stringify(lastView));   //ghetto copy

      // place this new view below all the others
      newView.layout.x = 0;
      newView.layout.y = maxY;

      freshViewConfig.views.push(newView); 
      let newViewConfigText = JSON.stringify(freshViewConfig);

      console.log('lastView:', lastView);
      console.log('newViewConfig:', newViewConfigText);

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
          onBreakpointChange={this.onBreakpointChange.bind(this)}
          onLayoutChange={this.handleLayoutChange}
          onResize={this.onResize.bind(this)}
          draggableHandle={'.multitrack-header'}
          // WidthProvider option
          measureBeforeMount={false}
          // I like to have it animate on mount. If you don't, delete `useCSSTransforms` (it's default `true`)
          // and set `measureBeforeMount={true}`.
          useCSSTransforms={this.state.mounted}>
            { this.props.children.map(function(c,i) {
                let layout = this.generateViewLayout(c.props.viewConfig);
                console.log('layout:', JSON.stringify(layout));

                return (<div 
                            data-grid={layout}
                            key={i} 
                        >
                            <div 
                                className="multitrack-header"
                                style={{"width": this.width, "height": 16, "position": "relative", "border": "solid 1px", "marginBottom": 4, "opacity": 0.6}} 
                            >
                                <img 
                                    src="images/cross.svg" 
                                    style={imgStyle}
                                    width="10px" 
                                />
                            </div>
                            {c}
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
