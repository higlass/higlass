import PropTypes from 'prop-types';
import React from 'react';

import Button from './Button';
import HiGlassComponent from './HiGlassComponent';
import Dialog from './Dialog';
import SketchInlinePicker from './SketchInlinePicker';

import withModal from './hocs/with-modal';
import withPubSub from './hocs/with-pub-sub';

import styles from '../styles/HeatmapColormapPicker.module.scss';

class HeatmapColormapPicker extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      colors: props.track.options.colorRange.slice(),
    };

    this.handleKeyDownBound = this.handleKeyDown.bind(this);
    this.handleKeyUpBound = this.handleKeyUp.bind(this);
    this.handleAddColorBound = this.handleAddColor.bind(this);
    this.handleSubmitBound = this.handleSubmit.bind(this);

    this.pubSubs = [];

    this.pubSubs.push(
      this.props.pubSub.subscribe('keydown', this.handleKeyDownBound),
    );
    this.pubSubs.push(
      this.props.pubSub.subscribe('keyup', this.handleKeyUpBound),
    );
  }

  handleChangeColor(i, newColor) {
    this.setState(({ colors }) => {
      colors[i] = newColor;
      return { colors };
    });
  }

  handleSubmit() {
    const options = this.props.track.options;
    options.colorRange = this.state.colors;

    this.props.onSubmit(this.props.track.options);
  }

  handleKeyDown(event) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.handleSubmit();
      this.props.modal.close();
    }
  }

  handleKeyUp(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.props.modal.close();
      this.props.onCancel();
    }
  }

  /**
   * Add a color to the end
   */
  handleAddColor() {
    this.setState(prevState => ({
      colors: prevState.colors.concat(
        prevState.colors[prevState.colors.length - 1]
      ),
    }));
  }

  /**
   * Remove one of the colors from the color map
   */
  handleRemoveColor(i) {
    this.setState(prevState => ({
      colors: prevState.colors.slice(0, i).concat(
        prevState.colors.slice(i + 1)
      ),
    }));
  }

  render() {
    const track = JSON.parse(JSON.stringify(this.props.track));

    const centerTrack = Object.assign(
      track, { options: { colorRange: this.state.colors } }
    );

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
      const closeButton = (
        this.state.colors.length > 2 && i === this.state.colors.length - 1
      )
        ? (
          <div className={styles.heatmapColormapPickerColorRemover}>
            <svg onClick={() => this.handleRemoveColor(i)}>
              <use xlinkHref="#cross" />
            </svg>
          </div>
        )
        : null; // closebutton

      return (
        <li
          // Colors may be repeated, so the array index is the best choice here.
          // eslint-disable-next-line react/no-array-index-key
          key={`l${i}`}
          className={styles.heatmapColormapPickerColor}
        >
          {closeButton}
          <SketchInlinePicker
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            color={this.state.colors[i]}
            onChange={(c) => {
              this.handleChangeColor(i, c);
            }}
          />
        </li>
      );
    });

    return (
      <Dialog
        cancelShortcut="ESC"
        hide={this.state.hide}
        maxHeight={true}
        okayShortcut="⌘+Enter"
        okayTitle="Save and Close"
        onCancel={this.props.onCancel}
        onOkay={this.handleSubmitBound}
        title="Edit Heatmap Colormap"
      >
        <div className={styles.heatmapColormapPickerWrapper}>
          <header>
            <h4>Colors</h4>
            <ol className={styles.heatmapColormapPickerColors}>
              {colorFields}
              {this.state.colors.length < 5 && (
                <li>
                  <Button
                    className={styles.heatmapColormapPickerAddColor}
                    onClick={this.handleAddColorBound}
                  >
                    <svg><use xlinkHref="#plus" /></svg>
                  </Button>
                </li>
              )}
            </ol>
            <h4>Preview</h4>
          </header>
          <div className={styles.heatmapColormapPickerPreview}>
            <HiGlassComponent
              options={{ bounded: true }}
              viewConfig={mvConfig}
            />
          </div>
        </div>
      </Dialog>
    );
  }
}

HeatmapColormapPicker.propTypes = {
  modal: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  pubSub: PropTypes.object.isRequired,
};

export default withPubSub(withModal(HeatmapColormapPicker));
