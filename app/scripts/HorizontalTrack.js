import MoveableTrack from './MoveableTrack';

const STYLE = {
  opacity: .7,
  pointerEvents: 'all',
  position: 'relative'
};

const EXTENDED_STYLE = Object.assign(STYLE, {
  marginRight: '5px'
})

export class HorizontalTrack extends MoveableTrack {
  getCloseImgStyle() {
    return STYLE
  }

  getMoveImgStyle() {
    return EXTENDED_STYLE
  }

  getAddImgStyle() {
    return EXTENDED_STYLE
  }

  getSettingsImgStyle() {
    return EXTENDED_STYLE
  }
}

export default HorizontalTrack;
