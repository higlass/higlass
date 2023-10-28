// @ts-nocheck
/* eslint-disable */

function main() {
  hglib
    .ChromosomeInfo(
      'https://raw.githubusercontent.com/igvteam/igv/v2.4.16/genomes/sizes/hg38.chrom.sizes',
    )
    .then((chromInfo) => {
      function handle1DRow(row) {
        const chromosome = `chr${row.chr}`;
        return [
          chromInfo.chrToAbs([chromosome, +row.start]),
          chromInfo.chrToAbs([chromosome, +row.end]),
        ];
      }

      function extractBait(row) {
        const chromosome = `chr${row.bait_chr}`;
        return [
          chromInfo.chrToAbs([chromosome, +row.bait_start]),
          chromInfo.chrToAbs([chromosome, +row.bait_end]),
        ];
      }

      function extractTarget(row) {
        const chromosome = `chr${row.target_chr}`;
        return [
          chromInfo.chrToAbs([chromosome, +row.target_start]),
          chromInfo.chrToAbs([chromosome, +row.target_end]),
        ];
      }

      function handle2DRow(row) {
        return [
          // chrom1, start1, end1,
          // chrom2, start2, end2,
          // color-fill, color-line, min-width, min-height
          `chr${row.bait_chr}`,
          row.bait_start,
          row.bait_end,
          `chr${row.target_chr}`,
          row.target_start,
          row.target_end,
        ];
      }

      Promise.all([
        d3.json('viewconf.json'),
        d3.csv('annotations-2d.csv', extractBait),
        d3.csv('annotations-2d.csv', extractTarget),
        d3.csv('annotations-2d.csv', handle2DRow),
      ]).then(([viewconf, regions1DBait, regions1DTarget, regions2D]) => {
        hglib.viewer(
          document.getElementById('demo'),
          makeViewConf(viewconf, regions1DBait, regions1DTarget, regions2D),
          { bounded: true },
        );
      });
    });
}
