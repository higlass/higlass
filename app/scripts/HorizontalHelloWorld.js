import * as PIXI from 'pixi.js';

import {PixiTrack} from './PixiTrack';

class HorizontalHelloWorld extends PixiTrack {
  constructor(scene, options, animate) {
    super(scene, options);
    // this.text = new PIXI.Text(
    //   'Hello', {
    //     fontSize: `12px`,
    //     fontFamily: 'Arial',
    //     fill: 'black'
    //   });
    //
    // this.text1 = new PIXI.Text(
    //   'World!', {
    //     fontSize: `12px`,
    //     fontFamily: 'Arial',
    //     fill: 'black'
    //   });

    // this.hexagon = new PIXI.Polygon(200, 200, 300, 300, 200, 300, 300, 200);
    // this.pMain.addChild(this.text);
    // this.pMain.addChild(this.text1);
    // this.pMain.addChild(this.hexagon);

    // const helloWorld = 'Hello World';
    // this.pixiTexts = [];
    // for (let i = 0; i < helloWorld.length; i++) {
    //   let letter = new PIXI.Text(
    //     helloWorld[i], {
    //       fontSize: `12px`,
    //       fontFamily: 'Arial',
    //       fill: 'black'
    //     });
    //   this.pixiTexts.push(letter);
    //   this.pMain.addChild(letter);
    // }

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

  // setPosition(newPosition) {
  //   super.setPosition(newPosition);
  //
  //   this.pMain.position.x = this.position[0];
  //   this.pMain.position.y = this.position[1];
  // }

  /**
   * Draws one vertical line in the graph. Called for each color line.
   * @param barNumber the vertical bars' order from left to right
   * @param stackedOrder each different color bar
   */
  drawVerticalBars(barNumber, stackedOrderValue, prevStackedBarHeight) {
    const widthInNucleotides = 50000000;
    // distance between vertical bars in nucleotides
    const distance = 50000000;
    const x = this._xScale(distance * barNumber);
    const y = this.position[1] + prevStackedBarHeight;
    const width = this._xScale(distance + widthInNucleotides) - this._xScale(distance);
    const height = stackedOrderValue * 50;
    this.pMain.drawRect(x, y, width, height);
  }

  draw() {
    // this.text.x = this.position[0];
    // this.text.y = this.position[1];
    // this.text1.x = this.position[0];
    // this.text1.y = this.position[1];
    // this.hexagon.x = this.position[0];
    // this.hexagon.y = this.position[1];
    // this.text.x = newXScale(0);
    // this.text1.x = newXScale(2000000000);

    let interval = 100000000;
    // for (let i = 0; i < this.pixiTexts.length; i++) {
    //   //this.pixiTexts[i].anchor.x = 0;
    //   this.pixiTexts[i].x = this._xScale(interval * i);
    //   this.pixiTexts[i].y = 20;
    // }

    // this.pMain.beginFill(0xFF0000, 1);
    // this.pMain.drawRect(100, 100, 50, 50);

    for (let i = 0; i < this.arrayList.length; i++) {
      const array = this.arrayList[i];
      this.pMain.beginFill(0xFF0000, 1);
      this.drawVerticalBars(i, array[0], 0);
      this.pMain.beginFill(0xf4eb42, 1);
      this.drawVerticalBars(i, array[1], array[0] * 50);
      this.pMain.beginFill(0x6ef441, 1);
      this.drawVerticalBars(i, array[2], (array[0] + array[1]) * 50);
      this.pMain.beginFill(0x4179f4, 1);
      this.drawVerticalBars(i, array[3], (array[0] + array[1] + array[2]) * 50);
    }

    /**
     * want 50,000,000 nucleotides for each width
     * need to convert from nucleotides to pixels but only have nucleotides to screen position right now.
     * x needs to scale
     * want same x for each bar.
     * different y
     */
  }

  zoomed(newXScale, newYScale, k, tx, ty) {
    super.zoomed(newXScale, newYScale);
    this.pMain.clear();
    this.draw();
  }

}

export default HorizontalHelloWorld;
