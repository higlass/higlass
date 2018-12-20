import React from 'react';
import { Modal, Button } from 'react-bootstrap';

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

  handleAddColor() {
    /**
         * Add a color to the end
         */
    this.setState(prevState => ({
      colors: prevState.colors.concat(
        prevState.colors[prevState.colors.length - 1]
      ),
    }));
  }

  handleRemoveColor(i) {
    /**
         * Remove one of the colors from the color map
         */

    this.setState(prevState => ({
      colors: prevState.colors.slice(0, i).concat(
        prevState.colors.slice(i + 1)
      ),
    }));
  }

  render() {
    const track = JSON.parse(JSON.stringify(this.props.track));

    const centerTrack = Object.assign(track,
      {
        options: {
          colorRange: this.state.colors,
        }
      });

    const mvConfig = {
      editable: false,
      zoomFixed: true,
      views: [{

        uid: `hmo-${this.props.track.uid}`,
        initialXDomain: this.props.xScale ? this.props.xScale.domain() : [0, 1],
        initialYDomain: this.props.yScale ? this.props.yScale.domain() : [0, 1],
        tracks: { center: [centerTrack] },
        layout: {
          x: 0, y: 0, h: 12, w: 12, i: `hmo-${this.props.track.id}`
        },
      }]
    };

    const colorFields = this.state.colors.map((x, i) => {
      // only let colors be removed if there's more than two present
      const closeButton = (this.state.colors.length > 2 && i === this.state.colors.length - 1)
        ? (<div
          style={{
            background: 'white',
            position: 'absolute',
            top: 0,
            right: 0,
            opacity: 1,
            width: 14,
            height: 14,
            borderRadius: 2,

          }}
        >
          <svg
            height="10px"
            onClick={() => this.handleRemoveColor(i)}
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
        )
        : null; // closebutton

      return (
        <td
          key={`l${i}`}
          style={{
            border: '0px solid',
            position: 'relative',
            outline: 'none',
          }}
        >
          {closeButton}
          <SketchInlinePicker
            key={i}
            color={this.state.colors[i]}
            onChange={(c) => {
              this.state.colors[i] = c;
              this.handleColorsChanged(this.state.colors);
            }
            }
          />
        </td>
      );
    });

    const addButton = this.state.colors.length < 4
      ? (
        <td
          style={{
            border: '0px solid',
            position: 'relative',
            outline: 'none',
          }}
        >
          <div
            style={{
              height: 24,
              marginLeft: 5,
            }}

          >
            <svg
              height="10px"
              onClick={this.handleAddColor.bind(this)}
              style={{
                opacity: 0.5,
              }}
              width="10px"
            >
              <use xlinkHref="#plus" />
            </svg>
          </div>
        </td>
      )
      : null; // addButton

    return (
      <Modal
        className="hg-modal"
        onHide={this.props.handleCancel}
        show={true}
      >
        <Modal.Header closeButton>
          <Modal.Title>Heatmap Options</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <table className="table-track-options">
            <thead />
            <tbody>
              <tr>
                <td className="td-track-options">
                  {'Colors'}
                </td>
              </tr>
              <tr>
                <td className="td-track-options">
                  <table>
                    <tbody>
                      <tr>
                        {colorFields}
                        {addButton}
                      </tr>
                    </tbody>
                  </table>
                </td>

              </tr>
              <tr>
                <td className="td-track-options">
                  {'Preview'}
                </td>
              </tr>
              <tr>
                <td className="td-track-options" rowSpan="2">
                  <div style={{ width: 200 }}>
                    <HiGlassComponent
                      options={{ bounded: false }}
                      viewConfig={mvConfig}
                    />
                  </div>
                </td>
              </tr>
              <tr />
            </tbody>
          </table>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.props.onCancel}>Cancel</Button>
          <Button onClick={this.handleSubmit.bind(this)}>Submit</Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

export default HeatmapOptions;
