import { PixiTrack } from './PixiTrack';
import { ChromosomeInfo } from './ChromosomeInfo';
import { SearchField } from './search_field';
import boxIntersect from 'box-intersect';
import { absToChr } from './utils';

export class Chromosome2DLabels extends PixiTrack {
  constructor(scene, server, uid, handleTilesetInfoReceived, options, animate) {
    super(scene, server, uid, handleTilesetInfoReceived, options, animate);

    this.searchField = null;
    this.chromInfo = null;
    this.animate = animate;

    const chromSizesPath = `${server}/chrom-sizes/?id=${uid}`;

    ChromosomeInfo(chromSizesPath, (newChromInfo) => {
      this.chromInfo = newChromInfo;
      //

      this.searchField = new SearchField(this.chromInfo);
      this.draw();

      this.texts = [];

      for (let i = 0; i < this.chromInfo.cumPositions.length; i++) {
        const thisTexts = [];

        for (let j = 0; j < this.chromInfo.cumPositions.length; j++) {
          const textStr = `${this.chromInfo.cumPositions[i].chr}/${this.chromInfo.cumPositions[j].chr}`;
          const text = new PIXI.Text(textStr,
            { fontSize: '14px', fontFamily: 'Arial', fill: 'red' },
          );

          text.anchor.x = 0.5;
          text.anchor.y = 0.5;
          text.visible = false;

          // give each string a random hash so that some get hidden
          // when there's overlaps
          text.hashValue = Math.random();

          thisTexts.push(text);

          this.pMain.addChild(text);
        }

        this.texts.push(thisTexts);
      }
      this.draw();
      this.animate();
    });
  }

  draw() {
    const leftChrom = null;
    const rightChrom = null;
    const topChrom = null;
    const bottomChrom = null;

    const allTexts = [];

    if (!this.texts) { return; }

    if (!this.searchField) { return; }

    const x1 = absToChr(this._xScale.domain()[0], this.chromInfo);
    const x2 = absToChr(this._xScale.domain()[1], this.chromInfo);

    const y1 = absToChr(this._yScale.domain()[0], this.chromInfo);
    const y2 = absToChr(this._yScale.domain()[1], this.chromInfo);

    for (let i = 0; i < this.texts.length; i++) {
      for (let j = 0; j < this.texts.length; j++) {
        this.texts[i][j].visible = false;
      }
    }

    for (let i = x1[3]; i <= x2[3]; i++) {
      for (let j = y1[3]; j <= y2[3]; j++) {
        const xCumPos = this.chromInfo.cumPositions[i];
        const yCumPos = this.chromInfo.cumPositions[j];

        const midX = xCumPos.pos + this.chromInfo.chromLengths[xCumPos.chr] / 2;
        const midY = yCumPos.pos + this.chromInfo.chromLengths[yCumPos.chr] / 2;

        const viewportMidX = this._xScale(midX);
        const viewportMidY = this._yScale(midY);

        const text = this.texts[i][j];

        text.x = viewportMidX;
        text.y = viewportMidY;
        text.updateTransform();

        const bbox = text.getBounds();

        // make sure the chrosome label fits in the x range
        if (viewportMidX + bbox.width / 2 > this.dimensions[0]) {
          text.x -= (viewportMidX + bbox.width / 2) - this.dimensions[0];
        } else if (viewportMidX - bbox.width / 2 < 0) {
          //
          text.x -= (viewportMidX - bbox.width / 2);
        }

        // make sure the chro
        if (viewportMidY + bbox.height / 2 > this.dimensions[1]) {
          text.y -= (viewportMidY + bbox.height / 2) - this.dimensions[1];
        } else if (viewportMidY - bbox.height / 2 < 0) {
          text.y -= (viewportMidY - bbox.height / 2);
        }

        text.visible = true;

        allTexts.push({ importance: this.texts[i][j].hashValue, text: this.texts[i][j], caption: null });
      }
    }

    // define the edge chromosome which are visible
    this.hideOverlaps(allTexts);
  }

  hideOverlaps(allTexts) {
    let allBoxes = []; // store the bounding boxes of the text objects so we can
    // calculate overlaps
    allBoxes = allTexts.map((val) => {
      const text = val.text;
      text.updateTransform();
      const b = text.getBounds();
      const box = [b.x, b.y, b.x + b.width, b.y + b.height];

      return box;
    });

    const result = boxIntersect(allBoxes, (i, j) => {
      if (allTexts[i].importance > allTexts[j].importance) {
        allTexts[j].text.visible = 0;
      } else {
        allTexts[i].text.visible = 0;
      }
    });
  }

  setPosition(newPosition) {
    super.setPosition(newPosition);

    this.pMain.position.y = this.position[1];
    this.pMain.position.x = this.position[0];
  }

  zoomed(newXScale, newYScale) {
    this.xScale(newXScale);
    this.yScale(newYScale);

    this.draw();
  }
}

export default Chromosome2DLabels;
