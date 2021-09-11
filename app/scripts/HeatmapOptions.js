import PropTypes from 'prop-types';
import React from 'react';
import Dialog from './Dialog';

import HiGlassComponent from './HiGlassComponent';
import SketchInlinePicker from './SketchInlinePicker';

import '../styles/TrackOptions.css';

class HeatmapOptions extends React.Component {
  constructor(props) {
    super(props);
    // props should include the definition of the heatmap data series

    this.state = {
      colors: props.track.options.colorRange.slice(),
    };
  }

  handleColorsChanged(newColors) {
    /*
        this.props.onTrackOptionsChanged(Object.assign(this.props.track.options,
                                                       {colorRange: newColors}));
        */
    this.setState({
      colors: newColors,
    });
  }

  handleSubmit() {
    const options = this.props.track.options;

    options.colorRange = this.state.colors;

    this.props.onSubmit(this.props.track.options);
  }

  /**
   * Add a color to the end
   */
  handleAddColor() {
    this.setState((prevState) => ({
      colors: prevState.colors.concat(
        prevState.colors[prevState.colors.length - 1],
      ),
    }));
  }

  /**
   * Remove one of the colors from the color map
   */
  handleRemoveColor(i) {
    this.setState((prevState) => ({
      colors: prevState.colors
        .slice(0, i)
        .concat(prevState.colors.slice(i + 1)),
    }));
  }

  render() {
    const track = JSON.parse(JSON.stringify(this.props.track));

    const centerTrack = Object.assign(track, {
      options: {
        colorRange: this.state.colors,
      },
    });

    const mvConfig = {
      editable: false,
      zoomFixed: true,
      views: [
        {
          uid: `hmo-${this.props.track.uid}`,
          initialXDomain: this.props.xScale
            ? this.props.xScale.domain()
            : [0, 1],
          initialYDomain: this.props.yScale
            ? this.props.yScale.domain()
            : [0, 1],
          tracks: { center: [centerTrack] },
          layout: {
            x: 0,
            y: 0,
            h: 12,
            w: 12,
            i: `hmo-${this.props.track.id}`,
          },
        },
      ],
    };

    const colorFields = this.state.colors
      .map((x, i) => {
        // only let colors be removed if there's more than two present
        const removeButton =
          this.state.colors.length > 2 && i === this.state.colors.length - 1 ? (
            <div
              onClick={() => this.handleRemoveColor(i)}
              style={{
                background: 'white',
                position: 'absolute',
                top: 0,
                right: 0,
                opacity: 1,
                width: 14,
                height: 14,
                borderRadius: 2,
                cursor: 'pointer',
              }}
            >
              <svg
                height="10px"
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  opacity: 0.5,
                  width: 10,
                  height: 10,
                }}
              >
                <use xlinkHref="#cross" />
              </svg>
            </div>
          ) : null; // removeButton

        return (
          /* eslint-disable react/no-array-index-key */
          // Colors may be repeated, so the array index is the best choice here.
          <div
            key={`l${i}`}
            style={{
              borderRadius: '1px',
              boxShadow: '0 0 0 1px #E5E5E5',
              position: 'relative',
              outline: 'none',
            }}
          >
            {removeButton}
            <SketchInlinePicker
              key={i}
              color={this.state.colors[i]}
              onChange={(c) => {
                this.setState(
                  (prevState) => {
                    const colors = prevState.colors.slice();
                    colors[i] = c;
                    return { colors };
                  },
                  () => {
                    this.handleColorsChanged(this.state.colors);
                  },
                );
              }}
            />
          </div>
          /* eslint-enable react/no-array-index-key */
        );
      })
      .reverse();

    const addButton =
      this.state.colors.length < 10 ? (
        <div
          onClick={this.handleAddColor.bind(this)}
          style={{
            position: 'relative',
            outline: 'none',
            height: '25px',
            padding: '5px',
            background: '#fff',
            borderRadius: '1px',
            boxShadow: '0 0 0 1px #E5E5E5',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              width: '32px',
              height: '14px',
            }}
          >
            <svg
              height="100%"
              style={{
                opacity: 0.5,
                margin: 'auto',
                display: 'block',
              }}
              width="10px"
            >
              <use xlinkHref="#plus" />
            </svg>
          </div>
        </div>
      ) : null; // addButton

    return (
      <Dialog
        okayTitle="Submit"
        onCancel={this.props.onCancel}
        onOkay={this.handleSubmit.bind(this)}
        title="Custom Color Map"
      >
        <table className="table-track-options">
          <thead />
          <tbody style={{ verticalAlign: 'top' }}>
            <tr>
              <td className="td-track-options">
                <table>
                  <tbody>
                    <tr>
                      <td className="td-track-options">Preview</td>
                    </tr>
                    <tr>
                      <td className="td-track-options">
                        <div style={{ width: 200 }}>
                          <HiGlassComponent
                            options={{ bounded: false }}
                            viewConfig={mvConfig}
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
              <td className="td-track-options">
                <table>
                  <tbody>
                    <tr>
                      <td className="td-track-options">Colors</td>
                    </tr>
                    <tr>
                      <td className="td-track-options">
                        {addButton}
                        <div style={{ position: 'relative' }}>
                          {colorFields}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Dialog>
    );
  }
}

HeatmapOptions.propTypes = {
  handleCancel: PropTypes.func,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  track: PropTypes.object,
  xScale: PropTypes.object,
  yScale: PropTypes.object,
};

export default HeatmapOptions;
