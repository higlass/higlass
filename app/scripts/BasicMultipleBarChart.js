import { PixiTrack } from './PixiTrack';
import { scaleLinear, scaleOrdinal, schemeCategory10 } from 'd3-scale';
import { colorToHex } from './utils';
import { range } from 'd3-array';

class BasicMultipleBarChart extends PixiTrack {
  constructor(scene, options, animate) {
    super(scene, options);
    this.makeData();
  }

  /**
   * Make a a 2d array of random numbers to use as test data
   */
  makeData() {
    this.arrayList = [];
    for (let i = 0; i < 100; i++) {
      let fourLetters = [];
      for (let j = 0; j < 4; j++) {
        fourLetters.push(Math.random());
      }
      const sum = fourLetters.reduce((total, num) => {
        return total + num
      });
      for (let j = 0; j < fourLetters.length; j++) {
        fourLetters[j] = fourLetters[j] / sum;
      }
      this.arrayList.push(fourLetters);
    }
  }

  /**
   * helper function to draw a single bar chart in the track
   *
   * @param lineNumber which line is being drawn?
   */
  drawBarChart(lineNumber) {
    const tileWidth = 50000000;
    const distance = 50000000;
    const arrayLength = this.arrayList[0].length;
    const currentTrackHeight = this.dimensions[1];
    // how far is each bar chart from the top of the track? if this number is negative make it 0.
    const lineInterval = currentTrackHeight / arrayLength;
    const colorScale = scaleOrdinal(schemeCategory10).domain(range(arrayLength));
    const valueToPixels = scaleLinear()
      .domain([0, 1])
      .range([lineInterval / arrayLength, lineInterval]);

    this.pMain.beginFill(colorToHex(colorScale(lineNumber)), 1);
    //this.pMain.lineStyle(1, colorToHex(colorScale(lineNumber)), 1); // for hollow bars
    for (let i = 0; i < this.arrayList.length; i++) {
      const array = this.arrayList[i];
      const x = this._xScale(i * distance);
      // separates each consecutive bar while still showing correct value
      const y = (this.position[1] + (lineInterval * lineNumber) + lineInterval);
      const width = this._xScale(distance + tileWidth) - this._xScale(distance);
      const height = valueToPixels(array[lineNumber]) - lineInterval;
      this.pMain.drawRect(x, y, width, height);
    }
  }

  draw() {
    for (let i = 0; i < this.arrayList[0].length; i++) {
      this.drawBarChart(i);
    }
  }

  zoomed(newXScale, newYScale, k, tx, ty) {
    super.zoomed(newXScale, newYScale);
    this.pMain.clear();
    this.draw();
  }

}

export default BasicMultipleBarChart;

