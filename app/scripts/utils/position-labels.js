let lab = [];
let anc = [];
let w = 1; // box width
let h = 1; // box width

const maxMove = 25.0;
const maxAngle = 0.5;
let acc = 0;
let rej = 0;

// weights
const wLen = 5.0; // leader line length
const wInter = 50.0; // leader line intersection
const wLabLab = 50.0; // label-label overlap
const wLabOrg = 50.0; // additional label-origin overlap weights (added to `wLabAnc`)
const wLabAnc = 10.0; // overlap between label and other anchors (i.e., annotations)
const wOrient = 0.1; // orientation bias

// booleans for user defined functions
let userEnergy = false;
let userSchedule = false;

let userDefinedEnergy;
let userDefinedSchedule;

let is1dOnly = false;

// returns true if two lines intersect, else false
// from http://paulbourke.net/geometry/lineline2d/
const intersect = (x1, x2, x3, x4, y1, y2, y3, y4) => {
  const denom = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
  const numera = ((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3));
  const numerb = ((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3));

  /* Is the intersection along the the segments */
  const mua = numera / denom;
  const mub = numerb / denom;

  return (!(mua < 0 || mua > 1 || mub < 0 || mub > 1));
};

// energy function, tailored for label placement
const energy = (index) => {
  const m = lab.length;
  const n = anc.length;
  const mn = Math.max(m, n);
  const l = lab[index];
  let ener = 0;
  const dx = l.x - l.ox;
  const dy = l.y - l.oy;
  const dist = Math.sqrt((dx * dx) + (dy * dy));
  const distCenterToBorder = Math.sqrt((l.wh * l.wh) + (l.hh * l.hh));
  let overlap = true;
  // let amount = 0;
  // let theta = 0;

  // penalty for length of leader line
  ener += Math.abs(dist - distCenterToBorder) * wLen;

  // label orientation bias (Fritz: ignored for now)
  // dx /= dist;
  // dy /= dist;
  // if (dx > 0 && dy > 0) ener += 0 * wOrient;
  // else if (dx < 0 && dy > 0) ener += 1 * wOrient;
  // else if (dx < 0 && dy < 0) ener += 2 * wOrient;
  // else ener += 3 * wOrient;

  const x21 = l.x - l.wh - 1;
  const y21 = l.y - l.hh - 1;
  const x22 = l.x + l.wh + 1;
  const y22 = l.y + l.hh + 1;
  let x11;
  let x12;
  let y11;
  let y12;
  let xOverlap;
  let yOverlap;
  let overlapArea;

  // For every annotation or label
  // Note: we know that the first m anchors are the label origins
  for (let i = 0; i < mn; i++) {
    // For every other label (m = number of labels)
    if (i !== index && i < m) {
      const otherLabel = lab[i];
      // Test if leader lines intersect...
      overlap = intersect(
        anc[index].x,
        l.x,
        anc[i].x,
        otherLabel.x,
        anc[index].y,
        l.y,
        anc[i].y,
        otherLabel.y
      );

      // ...and add a penalty if they do
      if (overlap) ener += wInter;

      // Penalty for label-label overlap
      x11 = otherLabel.x - otherLabel.wh - 1;
      y11 = otherLabel.y - otherLabel.hh - 1;
      x12 = otherLabel.x + otherLabel.wh + 1;
      y12 = otherLabel.y + otherLabel.hh + 1;
      xOverlap = Math.max(0, Math.min(x12, x22) - Math.max(x11, x21));
      yOverlap = Math.max(0, Math.min(y12, y22) - Math.max(y11, y21));
      overlapArea = xOverlap * yOverlap;
      ener += (overlapArea * wLabLab);
    }

    // penalty for label-anchor overlap
    x11 = anc[i].x - anc[i].wh - 1;
    y11 = anc[i].y - anc[i].hh - 1;
    x12 = anc[i].x + anc[i].wh + 1;
    y12 = anc[i].y + anc[i].hh + 1;
    xOverlap = Math.max(0, Math.min(x12, x22) - Math.max(x11, x21));
    yOverlap = Math.max(0, Math.min(y12, y22) - Math.max(y11, y21));
    overlapArea = xOverlap * yOverlap;
    ener += overlapArea * (wLabAnc + (wLabOrg * (i < m)));
  }
  return ener;
};

// Monte Carlo translation move
const mcmove = (currT) => {
  // select a random label
  const i = Math.floor(Math.random() * lab.length);
  const l = lab[i];

  // save old coordinates
  const xOld = l.x;
  const yOld = l.y;

  // old energy
  const oldEnergy = userEnergy
    ? userDefinedEnergy(i, lab, anc)
    : energy(i);

  const getRndMove = () => (Math.random() - 0.5) * maxMove * Math.max(0.5, currT);

  // random translation
  const moveX = +(((is1dOnly * !l.isVerticalOnly) + !is1dOnly) && getRndMove());
  const moveY = +(((is1dOnly * l.isVerticalOnly) + !is1dOnly) && getRndMove());
  l.x += moveX;
  l.y += moveY;

  // hard wall boundaries
  // if (l.x > w) l.x = xOld;
  // if (l.x < 0) l.x = xOld;
  // if (l.y > h) l.y = yOld;
  // if (l.y < 0) l.y = yOld;

  // new energy
  const newEnergy = userEnergy
    ? userDefinedEnergy(i, lab, anc)
    : energy(i);

  // delta E
  const deltaEnergy = newEnergy - oldEnergy;

  if (Math.random() < Math.exp(-deltaEnergy / currT)) {
    acc += 1;
  } else {
    // move back to old coordinates
    l.x = xOld;
    l.y = yOld;
    rej += 1;
  }
};

// Monte Carlo rotation move
const mcrotate = (currT) => {
  // select a random label
  const i = Math.floor(Math.random() * lab.length);

  // save old coordinates
  const xOld = lab[i].x;
  const yOld = lab[i].y;

  // old energy
  const oldEnergy = userEnergy
    ? userDefinedEnergy(i, lab, anc)
    : energy(i);

  // random angle
  const angle = (Math.random() - 0.5) * maxAngle;

  const s = Math.sin(angle);
  const c = Math.cos(angle);

  // translate label (relative to anchor at origin):
  lab[i].x -= anc[i].x;
  lab[i].y -= anc[i].y;

  // rotate label
  const xNew = (lab[i].x * c) - (lab[i].y * s);
  const yNew = (lab[i].x * s) + (lab[i].y * c);

  // translate label back
  lab[i].x = xNew + anc[i].x;
  lab[i].y = yNew + anc[i].y;

  // hard wall boundaries
  if (lab[i].x > w) lab[i].x = xOld;
  if (lab[i].x < 0) lab[i].x = xOld;
  if (lab[i].y > h) lab[i].y = yOld;
  if (lab[i].y < 0) lab[i].y = yOld;

  // new energy
  const newEnergy = userEnergy
    ? userDefinedEnergy(i, lab, anc)
    : energy(i);

  // delta E
  const deltaEnergy = newEnergy - oldEnergy;

  if (Math.random() < Math.exp(-deltaEnergy / currT)) {
    acc += 1;
  } else {
    // move back to old coordinates
    lab[i].x = xOld;
    lab[i].y = yOld;
    rej += 1;
  }
};

// linear cooling
const coolingSchedule = (currT, initialT, nsweeps) => (currT - (initialT / nsweeps));

const labeler = {};

// main simulated annealing function
labeler.start = (nsweeps, t = 1.0) => {
  const m = lab.length;
  const initialT = t;
  let currT = initialT;

  for (let i = 0; i < nsweeps; i++) {
    for (let j = 0; j < m; j++) {
      mcmove(currT);
      // Fritz: ignoring rotations for now
      // if (Math.random() < 0.5) mcmove(currT);
      // else mcrotate(currT);
    }
    currT = coolingSchedule(currT, initialT, nsweeps);
  }
};

labeler.width = (x) => {
// users insert graph width
  if (!arguments.length) return w;
  w = x;
  return labeler;
};

labeler.height = (x) => {
// users insert graph height
  if (!arguments.length) return h;
  h = x;
  return labeler;
};

// users insert label positions
labeler.label = (x) => {
  if (!arguments.length) return lab;
  lab = x;
  return labeler;
};

// users insert anchor positions
labeler.anchor = (x) => {
  if (!arguments.length) return anc;
  anc = x;
  return labeler;
};

labeler.altEnergy = (x) => {
// user defined energy
  if (!arguments.length) return energy;
  userDefinedEnergy = x;
  userEnergy = true;
  return labeler;
};

labeler.altSchedule = (x) => {
// user defined coolingSchedule
  if (!arguments.length) return coolingSchedule;
  userDefinedSchedule = x;
  userSchedule = true;
  return labeler;
};

/**
 * Restrict annealing to be one dimensional if `isFalse` is `false`.
 * @param   {boolean}  isFalse  If `true` deactivate one-dimensional annealing.
 * @return  {object}  Return the labeler for chaining.
 */
labeler.is1dOnly = (isFalse = false) => {
  if (!arguments.length) return is1dOnly;
  is1dOnly = !isFalse;
  return labeler;
};

export default labeler;
