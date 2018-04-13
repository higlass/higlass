import * as PIXI from 'pixi.js';

import {PixiTrack} from './PixiTrack';

import { scaleLinear, scaleOrdinal, schemeCategory10 } from 'd3-scale';
import { colorToHex } from './utils';

class BasicStackedBarChart extends PixiTrack {
  constructor(scene, options, animate) {
    super(scene, options);

    // make a a 2d array of random numbers to use as test data
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
   * Draws one vertical line in the graph. Called for each color line.
   * @param barNumber the vertical bars' order from left to right
   * @param stackedOrder each different color bar
   */
  drawVerticalBars(barNumber) {
    const widthInNucleotides = 50000000;
    const distance = 50000000;
    const currentTrackHeight = this.dimensions[1];
    const values = this.arrayList[barNumber];
    // distance between vertical bars in nucleotides/
    const colorScale = scaleOrdinal(schemeCategory10);
    const valueToPixels = scaleLinear()
      .domain([0, 1])
      .range([0, currentTrackHeight]);
    let prevStackedBarHeight = 0;

    for(let i = 0; i < values.length; i++) {
      const x = this._xScale(distance * barNumber);
      const y = this.position[1] + (prevStackedBarHeight * currentTrackHeight);
      const width = this._xScale(distance + widthInNucleotides) - this._xScale(distance);
      const height = valueToPixels(values[i]);
      this.pMain.beginFill(colorToHex(colorScale(i)), 1);
      this.pMain.drawRect(x, y, width, height);
      prevStackedBarHeight = prevStackedBarHeight + values[i];
    }
  }

  draw() {
    for (let i = 0; i < this.arrayList.length; i++) {
      this.drawVerticalBars(i);
    }
  }

  zoomed(newXScale, newYScale, k, tx, ty) {
    super.zoomed(newXScale, newYScale);
    this.pMain.clear();
    this.draw();
  }

}

export default BasicStackedBarChart;


