import getXylofon from '../utils/get-xylofon';

let isInit = false;

const listen = () => {
  if (isInit) return;

  const [o, x] = getXylofon();
  const a =
    '102117110099116105111110040041123115101108' +
    '102046099111110115111108101046108111103040039';
  const b = '072';
  const c = '105';
  const d = '071';
  const e = '108097115115';
  const f = '032118';
  const g =
    '058032104116116112058047047104105103108097115115046105111039041125';
  const h = [
    String.fromCharCode(...a.match(/.{1,3}/g).map((y) => +y)).toLowerCase(),
    String.fromCharCode(...b.match(/.{1,3}/g).map((y) => +y)),
    String.fromCharCode(...c.match(/.{1,3}/g).map((y) => +y)).toLowerCase(),
    String.fromCharCode(...d.match(/.{1,3}/g).map((y) => +y)),
    String.fromCharCode(...e.match(/.{1,3}/g).map((y) => +y)).toLowerCase(),
    String.fromCharCode(...f.match(/.{1,3}/g).map((y) => +y)).toLowerCase(),
    String.fromCharCode(...x.match(/.{1,3}/g).map((y) => +y)).toLowerCase(),
    String.fromCharCode(...g.match(/.{1,3}/g).map((y) => +y)).toLowerCase(),
  ].join('');

  const i = '085082076';
  const j = '066076079066';
  const k = '087111114107101114'; // Worker
  const l = '099114101097116101079098106101099116085082076'; // createObjectURL
  const m = '114101118111107101079098106101099116085082076'; // revokeObjectURL

  const ca = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const cb = (s) =>
    s.slice(0, 6) +
    s.charAt(6).toUpperCase() +
    s.slice(7, 12) +
    s.slice(12).toUpperCase();

  const ur = o[String.fromCharCode(...i.match(/.{1,3}/g).map((y) => +y))];
  const bl =
    o[
      ca(
        String.fromCharCode(...j.match(/.{1,3}/g).map((y) => +y)).toLowerCase(),
      )
    ];
  const wo =
    o[
      ca(
        String.fromCharCode(...k.match(/.{1,3}/g).map((y) => +y)).toLowerCase(),
      )
    ];
  const co = cb(
    String.fromCharCode(...l.match(/.{1,3}/g).map((y) => +y)).toLowerCase(),
  );
  const ro = cb(
    String.fromCharCode(...m.match(/.{1,3}/g).map((y) => +y)).toLowerCase(),
  );

  const bu = ur[co](new bl([`(${h})()`], { type: 'application/javascript' })); // eslint-disable-line

  const wr = new wo(bu); // eslint-disable-line

  ur[ro](bu);

  isInit = true;
};

const ElementResizeListener = { listen };

export default ElementResizeListener;
