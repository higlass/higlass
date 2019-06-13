import visitTracks from './visit-tracks';

const visitPositionedTracks = (
  positionedTracks,
  visitor,
  inclCombinedTracks = true
) => {
  const allTracks = [];

  Object.keys(positionedTracks).forEach((position) => {
    visitTracks(
      positionedTracks[position], visitor, inclCombinedTracks, position
    );
  });

  return allTracks;
};

export default visitPositionedTracks;
