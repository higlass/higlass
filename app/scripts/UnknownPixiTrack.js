import {PixiTrack} from './PixiTrack.js';
import PIXI from 'pixi.js';

export class UnknownPixiTrack extends PixiTrack {
    constructor(scene) {
        /**
         * Create this track and attach it to the graphics object.
         */
        super(scene);
    }
}
