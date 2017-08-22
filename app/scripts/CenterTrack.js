import FixedTrack from './FixedTrack';

const STYLE = {
  opacity: .7,
  pointerEvents: 'all',
  position: 'relative'
};

const EXTENDED_STYLE = Object.assign(STYLE, {
  marginRight: '5px'
})

export default class CenterTrack extends FixedTrack {
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
