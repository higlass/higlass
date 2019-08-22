/* eslint-env node, jasmine */
import { expect } from 'chai';
import GBKDataFetcher from '../app/scripts/data-fetchers/genbank-fetcher';


describe('Genbank data fetcher', () => {
  const df = new GBKDataFetcher({
    url: 'https://pkerp.s3.amazonaws.com/public/GCA_000010365.1_ASM1036v1_genomic.gbff.gz',
  });

  it('should fetch the tileset info', (done) => {
    df.tilesetInfo((tsInfo) => {
      expect(tsInfo.tile_size).to.eql(1024);
      expect(tsInfo.max_zoom).to.eql(8);

      done();
    });
  });

  it('should fetch a tile', (done) => {
    df.fetchTilesDebounced((tiles) => {
      expect(tiles).to.include.all.keys('0.0');

      expect(tiles['0.0'].length).to.be.above(0);

      done();
    }, ['0.0']);
  });

  it('should fetch two tiles', (done) => {
    df.fetchTilesDebounced((tiles) => {
      expect(tiles).to.include.all.keys('1.0', '1.1');

      expect(tiles['1.0'].length).to.be.above(0);
      expect(tiles['1.1'].length).to.be.above(0);

      done();
    }, ['1.0', '1.1']);
  });
});
