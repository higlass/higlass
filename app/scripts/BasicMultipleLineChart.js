import { PixiTrack } from './PixiTrack';
import { scaleLinear, scaleOrdinal, schemeCategory10 } from 'd3-scale';
import { colorToHex } from './utils';
import { range } from 'd3-array';

class BasicMultipleLineChart extends PixiTrack {
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
   * helper function to draw a single line in the track
   *
   * @param lineNumber which line is being drawn?
   */
  drawLine(lineNumber) {
    const distance = 50000000; // 50 million nucleotides between each data point
    const arrayLength = this.arrayList[0].length;
    const currentTrackHeight = this.dimensions[1];
    // interval height for each line. if interval is negative make it 0.
    const lineInterval = ((currentTrackHeight) / (arrayLength) < 0) ? 0 : (currentTrackHeight) / (arrayLength);
    const colorScale = scaleOrdinal(schemeCategory10).domain(range(arrayLength));
    const valueToPixels = scaleLinear()
      .domain([0, 1])
      .range([lineInterval / arrayLength, lineInterval]);

    this.pMain.lineStyle(1, colorToHex(colorScale(lineNumber)), 1);
    for (let i = 0; i < this.arrayList.length; i++) {
      const array = this.arrayList[i];
      const x = this._xScale(i * distance);
      // separates each consecutive line while still showing correct value
      const y = (this.position[1] + (lineInterval * lineNumber)) + valueToPixels(array[lineNumber]);
      // move draw position back to the start at beginning of each line
      (i == 0) ? this.pMain.moveTo(x, y) : this.pMain.lineTo(x, y);
    }
  }

  draw() {
    for (let i = 0; i < this.arrayList[0].length; i++) {
      this.drawLine(i);
    }
  }

  zoomed(newXScale, newYScale, k, tx, ty) {
    super.zoomed(newXScale, newYScale);
    this.pMain.clear();
    this.draw();
  }

}

export default BasicMultipleLineChart;


