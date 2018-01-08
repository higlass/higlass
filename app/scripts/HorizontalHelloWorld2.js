import * as PIXI from 'pixi.js';

import {PixiTrack} from './PixiTrack';

class HorizontalHelloWorld2 extends PixiTrack {
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
   */
  drawLine() {

  }

  draw() {
    /**
     * draw first line red
     * then second line and so on
     */

    for (let i = 0; i < this.arrayList.length; i++) {
      const array = this.arrayList[i];
      this.pMain.lineStyle()
      this.pMain.beginFill(0xFF0000, 1);
      this.drawVerticalBars(i, array[0], 0);
      this.pMain.beginFill(0xf4eb42, 1);
      this.drawVerticalBars(i, array[1], array[0] * 50);
      this.pMain.beginFill(0x6ef441, 1);
      this.drawVerticalBars(i, array[2], (array[0] + array[1]) * 50);
      this.pMain.beginFill(0x4179f4, 1);
      this.drawVerticalBars(i, array[3], (array[0] + array[1] + array[2]) * 50);
    }
  }

  zoomed(newXScale, newYScale, k, tx, ty) {
    super.zoomed(newXScale, newYScale);
    this.pMain.clear(); // should remove?
    this.draw();
  }

}

export default HorizontalHelloWorld2;

