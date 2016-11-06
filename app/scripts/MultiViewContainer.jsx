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
            mounted: false,
            layouts: {lg: this.props.initialLayout},
          }
    }


  componentDidMount() {
    this.setState({mounted: true});
  }

  generateDOM() {
    return _.map(this.state.layouts.lg, function (l, i) {
      return (
        <div key={i} className={l.static ? 'static' : ''}>
          {l.static ?
            <span className="text" title="This item is static and cannot be removed or resized.">Static - {i}</span>
            : <span className="text">{i}</span>
          }
        </div>);
    });
  }

  onBreakpointChange(breakpoint) {
    this.setState({
      currentBreakpoint: breakpoint
    });
  };

  onLayoutChange(layout, layouts) {
    //this.props.onLayoutChange(layout, layouts);
  };

  onNewLayout() {
    this.setState({
      layouts: {lg: generateLayout()}
    });
  };

  render() {
    return (
      <div>
        <div>Current Breakpoint: {this.state.currentBreakpoint} ({this.props.cols[this.state.currentBreakpoint]} columns)
        </div>
        <button onClick={this.onNewLayout}>Generate New Layout</button>
        <ResponsiveReactGridLayout
          {...this.props}
          layouts={this.state.layouts}
          onBreakpointChange={this.onBreakpointChange.bind(this)}
          onLayoutChange={this.onLayoutChange}
          // WidthProvider option
          measureBeforeMount={false}
          // I like to have it animate on mount. If you don't, delete `useCSSTransforms` (it's default `true`)
          // and set `measureBeforeMount={true}`.
          useCSSTransforms={this.state.mounted}>
          {this.generateDOM()}
        </ResponsiveReactGridLayout>
      </div>
    );
  }
}

function generateLayout() {
    let numElements = 24;
    let numRows = Math.ceil(Math.sqrt(numElements));
    //let numCols = Math.ceil(numElements / numRows);
    let numCols = 4;

    console.log('numCols:', numCols);
    console.log('numRows:', numRows);

    let layouts = [];

    for (let i = 0; i < numElements; i++) {
        console.log('i:', i, 'x:', Math.floor(i % numCols), 'y:', Math.floor(i / numCols));
        layouts.push({
            x: Math.floor(i % numCols),
            y: Math.floor(i / numCols),
            w: 1,
            h: 1,
            i: i.toString()
        });
    }

    console.log('layouts:', layouts);

    /*
  return _.map(_.range(0, 25), function (item, i) {
    var y = Math.ceil(Math.random() * 4) + 1;
    return {
      x: _.random(0, 5) * 2 % 12,
      y: Math.floor(i / 6) * y,
      w: 2,
      h: y,
      i: i.toString(),
      static: Math.random() < 0.05
    };
  });
  */
    return layouts;
}


    /*
    constructor(props) {
        super(props);
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

    render() {
        let divStyle = {float: 'left', width: '100%'};
        let layout = [];

        for (let i = 0; i < this.props.children.length; i++) {
            let c= this.props.children[i];

            layout.push({i: i, x: i, y: 0, w: 1, h: 2});
        }
        console.log('layout:', layout);

        return (
                <ResponsiveReactGridLayout className="layout" 
                    layouts={{lg: layout}}
                    breakpoints={{lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0}}
                    cols={{lg: 12, md: 10, sm: 6, xs: 4, xxs: 2}}>
                    rowHeight={30}
                    >
                { this.props.children.map(function(c,i) {
                            console.log('c:', c.key);

                            return <div style={divStyle} className="MultiViewContainer" key={i}>
                                    {c}
                                </div>
                        })}
            </ResponsiveReactGridLayout>
        );
    }
}
    */

MultiViewContainer.defaultProps = {
    className: "layout",
    rowHeight: 30,
    cols: {lg: 12, md: 10, sm: 6, xs: 4, xxs: 2},
    initialLayout: generateLayout()
  }
MultiViewContainer.propTypes = {
  }
