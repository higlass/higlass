function main() {
  hglib.ChromosomeInfo('//s3.amazonaws.com/pkerp/data/hg19/chromSizes.tsv')
    .then((chromInfo) => {
      function handle1DRow(row) {
        const chromosome = 'chr' + row.chr;
        return [
          chromInfo.chrToAbs([chromosome, +row.start]),
          chromInfo.chrToAbs([chromosome, +row.end])
        ];
      }

      function handle2DRow(row) {
        return [
          // chrom1, start1, end1,
          // chrom2, start2, end2,
          // color-fill, color-line, min-width, min-height
          "chr" + row.bait_chr,
          row.bait_start,
          row.bait_ent,
          "chr" + row.target_chr,
          row.target_start,
          row.target_end
        ];
      }

      Promise.all([
        d3.json('viewconf.json'),
        d3.csv('annotations-1d.csv', handle1DRow),
        d3.csv('annotations-2d.csv', handle2DRow)
      ]).then(
        ([viewconf, regions1d, regions2d]) => {
          hglib.viewer(
            document.getElementById('demo'),
            makeViewConf(viewconf, regions1d, regions2d),
            { bounded: true },
          );
        }
      );
    });
}
