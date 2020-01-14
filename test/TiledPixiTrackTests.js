/* eslint-env node, jasmine */
import {
  configure
  // render,
} from "enzyme";

import Adapter from "enzyme-adapter-react-16";

// Utils
import {
  mountHGComponent,
  removeHGComponent,
  getTrackObjectFromHGC,
  waitForTransitionsFinished,
  waitForTilesLoaded
} from "../app/scripts/utils";

import { simpleCenterViewConfig } from "./view-configs";

configure({ adapter: new Adapter() });

describe("Simple HiGlassComponent", () => {
  let hgc = null;
  let div = null;

  describe("Tiled Pixi Track Tests", () => {
    beforeAll(done => {
      [div, hgc] = mountHGComponent(div, hgc, simpleCenterViewConfig, done, {
        style: "width:800px; height:800px; background-color: lightgreen",
        bounded: true
      });
    });

    it("Ensure we can set a dataChanged listener", done => {
      const trackObject = getTrackObjectFromHGC(hgc.instance(), "heatmap1");

      const dataChangedCb = () => {};

      trackObject.on("dataChanged", dataChangedCb);

      hgc
        .instance()
        .zoomTo("a", 100000000, 200000000, 100000000, 200000000, 1000);

      waitForTransitionsFinished(hgc.instance(), () => {
        waitForTilesLoaded(hgc.instance(), () => {
          trackObject.off("dataChanged", dataChangedCb);
          done();
        });
      });
    });

    afterAll(() => {
      removeHGComponent(div);
    });
  });
});
