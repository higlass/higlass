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

          this.state = {
            currentBreakpoint: 'lg',
            mounted: false
          }
    }


  componentDidMount() {
    this.setState({mounted: true});
  }

    componentWillReceiveProps(newProps) {
        console.log('newProps:', newProps);
    }

    shouldComponentUpdate(nextProps, nextState) {
        console.log('oldProps.text:', this.props.viewConfig.text);
        console.log('newProps.text:', nextProps.viewConfig.text);
        if (nextProps.viewConfig.text == this.props.viewConfig.text) {
            console.log('not updating...');
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
        h: heightGrid,
        minH: heightGrid,
        maxH: heightGrid,
        i: slugid.nice()
    };

    return layout;
  }

  render() {
    let imgStyle = { right: 10,
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

                return <div key={i} data-grid={layout}>
                <div style={{"width": this.width, "height": 16, "position": "relative", "border": "solid 1px", "marginBottom": 4, "opacity": 0.6}} className="multitrack-header">
                    <img src="images/cross.svg" width="10px" style={imgStyle}/>
                </div>
                        {c}
                </div>

            }.bind(this))}
        </ResponsiveReactGridLayout>
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
  }
