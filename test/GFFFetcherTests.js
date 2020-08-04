/* eslint-env node, jasmine */
import { expect } from 'chai';
import GFFDataFetcher from '../app/scripts/data-fetchers/gff-fetcher';

describe('GFF tests', () => {
  describe('GFF data fetcher', () => {
    const df = new GFFDataFetcher({
      url:
        'https://pkerp.s3.amazonaws.com/public/GCF_001461035.1_ASM146103v1_genomic.gff.gz',
      options: {
        namePath: 'Name',
      },
    });

    it('should fetch the tileset info', done => {
      df.tilesetInfo(tsInfo => {
        expect(tsInfo.tile_size).to.eql(1024);
        expect(tsInfo.max_zoom).to.eql(12);

        done();
      });
    });

    it('should fetch a tile', done => {
      df.fetchTilesDebounced(
        tiles => {
          expect(tiles).to.include.all.keys('0.0');

          expect(tiles['0.0'].length).to.be.above(0);

          done();
        },
        ['0.0'],
      );
    });

    it('should fetch two tiles', done => {
      df.fetchTilesDebounced(
        tiles => {
          expect(tiles).to.include.all.keys('1.0', '1.1');

          expect(tiles['1.0'].length).to.be.above(0);
          expect(tiles['1.1'].length).to.be.above(0);

          done();
        },
        ['1.0', '1.1'],
      );
    });
  });

  describe('Text GFF fetcher', () => {
    const df = new GFFDataFetcher({
      text:
        '##gff-version 3\n#!gff-spec-version 1.21\n#!processor NCBI annotwriter\n#!genome-build ASM146103v1\n#!genome-build-accession NCBI_Assembly:GCF_001461035.1\n#!annotation-date 06/04/2020 22:50:49\n#!annotation-source NCBI RefSeq \n##sequence-region NZ_LNAM01000001.1 1 163531\n##species https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=290052\nNZ_LNAM01000001.1\tRefSeq\tregion\t1\t163531\t.\t+\t.\tID=NZ_LNAM01000001.1:1..163531;Dbxref=taxon:290052;collection-date=2012-07-19;country=China: Shenzhen;gbkey=Src;isolation-source=gastrointestinal tract;mol_type=genomic DNA;nat-host=Homo sapiens;strain=ACET-33324\nNZ_LNAM01000001.1\tRefSeq\tgene\t358\t1659\t.\t+\t.\tID=gene-ASU35_RS00005;Name=ASU35_RS00005;gbkey=Gene;gene_biotype=protein_coding;locus_tag=ASU35_RS00005;old_locus_tag=ASU35_00005\nNZ_LNAM01000001.1\tProtein Homology\tCDS\t358\t1659\t.\t+\t0\tID=cds-WP_058351075.1;Parent=gene-ASU35_RS00005;Dbxref=Genbank:WP_058351075.1;Name=WP_058351075.1;gbkey=CDS;inference=COORDINATES: similar to AA sequence:RefSeq:WP_002588013.1;locus_tag=ASU35_RS00005;product=IS110 family transposase;protein_id=WP_058351075.1;transl_table=11\nNZ_LNAM01000001.1\tRefSeq\tgene\t1770\t2234\t.\t-\t.\tID=gene-ASU35_RS00010;Name=ASU35_RS00010;gbkey=Gene;gene_biotype=protein_coding;locus_tag=ASU35_RS00010;old_locus_tag=ASU35_00010\nNZ_LNAM01000001.1\tProtein Homology\tCDS\t1770\t2234\t.\t-\t0\tID=cds-WP_147525317.1;Parent=gene-ASU35_RS00010;Dbxref=Genbank:WP_147525317.1;Name=WP_147525317.1;gbkey=CDS;inference=COORDINATES: similar to AA sequence:RefSeq:WP_016279106.1;locus_tag=ASU35_RS00010;product=hypothetical protein;protein_id=WP_147525317.1;transl_table=11\nNZ_LNAM01000001.1\tRefSeq\tgene\t2297\t3070\t.\t-\t.\tID=gene-ASU35_RS00015;Name=ASU35_RS00015;gbkey=Gene;gene_biotype=protein_coding;locus_tag=ASU35_RS00015;old_locus_tag=ASU35_00015\nNZ_LNAM01000001.1\tProtein Homology\tCDS\t2297\t3070\t.\t-\t0\tID=cds-WP_058351077.1;Parent=gene-ASU35_RS00015;Dbxref=Genbank:WP_058351077.1;Name=WP_058351077.1;gbkey=CDS;inference=COORDINATES: similar to AA sequence:RefSeq:WP_009004880.1;locus_tag=ASU35_RS00015;product=Uma2 family endonuclease;protein_id=WP_058351077.1;transl_table=11\nNZ_LNAM01000001.1\tRefSeq\tgene\t3285\t4160\t.\t-\t.\tID=gene-ASU35_RS00020;Name=ASU35_RS00020;gbkey=Gene;gene_biotype=protein_coding;locus_tag=ASU35_RS00020;old_locus_tag=ASU35_00020\nNZ_LNAM01000001.1\tProtein Homology\tCDS\t3285\t4160\t.\t-\t0\tID=cds-WP_058351078.1;Parent=gene-ASU35_RS00020;Dbxref=Genbank:WP_058351078.1;Name=WP_058351078.1;gbkey=CDS;inference=COORDINATES: similar to AA sequence:RefSeq:WP_015521697.1;locus_tag=ASU35_RS00020;product=ABC transporter ATP-binding protein;protein_id=WP_058351078.1;transl_table=11\nNZ_LNAM01000001.1\tRefSeq\tgene\t4197\t4868\t.\t-\t.\tID=gene-ASU35_RS00025;Name=ASU35_RS00025;gbkey=Gene;gene_biotype=protein_coding;locus_tag=ASU35_RS00025;old_locus_tag=ASU35_00025\nNZ_LNAM01000001.1\tGeneMarkS-2+\tCDS\t4197\t4868\t.\t-\t0\tID=cds-WP_058351079.1;Parent=gene-ASU35_RS00025;Dbxref=Genbank:WP_058351079.1;Name=WP_058351079.1;gbkey=CDS;inference=COORDINATES: ab initio prediction:GeneMarkS-2+;locus_tag=ASU35_RS00025;product=hypothetical protein;protein_id=WP_058351079.1;transl_table=11\nNZ_LNAM01000001.1\tRefSeq\tgene\t4865\t5917\t.\t-\t.\tID=gene-ASU35_RS00030;Name=ASU35_RS00030;gbkey=Gene;gene_biotype=protein_coding;locus_tag=ASU35_RS00030;old_locus_tag=ASU35_00030\nNZ_LNAM01000001.1\tGeneMarkS-2+\tCDS\t4865\t5917\t.\t-\t0\tID=cds-WP_058351080.1;Parent=gene-ASU35_RS00030;Dbxref=Genbank:WP_058351080.1;Name=WP_058351080.1;gbkey=CDS;inference=COORDINATES: ab initio prediction:GeneMarkS-2+;locus_tag=ASU35_RS00030;product=ABC transporter permease;protein_id=WP_058351080.1;transl_table=11\nNZ_LNAM01000001.1\tRefSeq\tgene\t6257\t7468\t.\t-\t.\tID=gene-ASU35_RS00035;Name=ASU35_RS00035;gbkey=Gene;gene_biotype=protein_coding;locus_tag=ASU35_RS00035;old_locus_tag=ASU35_00035',
    });

    it('should fetch the tileset info', done => {
      df.tilesetInfo(tsInfo => {
        expect(tsInfo.tile_size).to.eql(1024);
        expect(tsInfo.max_zoom).to.eql(8);

        done();
      });
    });

    it('should fetch a tile', done => {
      df.fetchTilesDebounced(
        tiles => {
          expect(tiles).to.include.all.keys('0.0');

          expect(tiles['0.0'].length).to.be.above(0);

          done();
        },
        ['0.0'],
      );
    });

    it('should use a different namepath', done => {
      const df1 = new GFFDataFetcher({
        text:
          '##gff-version 3\n#!gff-spec-version 1.21\n#!processor NCBI annotwriter\n#!genome-build ASM146103v1\n#!genome-build-accession NCBI_Assembly:GCF_001461035.1\n#!annotation-date 06/04/2020 22:50:49\n#!annotation-source NCBI RefSeq \n##sequence-region NZ_LNAM01000001.1 1 163531\n##species https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?id=290052\nNZ_LNAM01000001.1\tRefSeq\tregion\t1\t163531\t.\t+\t.\tID=NZ_LNAM01000001.1:1..163531;Dbxref=taxon:290052;collection-date=2012-07-19;country=China: Shenzhen;gbkey=Src;isolation-source=gastrointestinal tract;mol_type=genomic DNA;nat-host=Homo sapiens;strain=ACET-33324\nNZ_LNAM01000001.1\tRefSeq\tgene\t358\t1659\t.\t+\t.\tID=gene-ASU35_RS00005;Name=ASU35_RS00005;gbkey=Gene;gene_biotype=protein_coding;locus_tag=ASU35_RS00005;old_locus_tag=ASU35_00005\nNZ_LNAM01000001.1\tProtein Homology\tCDS\t358\t1659\t.\t+\t0\tID=cds-WP_058351075.1;Parent=gene-ASU35_RS00005;Dbxref=Genbank:WP_058351075.1;Name=WP_058351075.1;gbkey=CDS;inference=COORDINATES: similar to AA sequence:RefSeq:WP_002588013.1;locus_tag=ASU35_RS00005;product=IS110 family transposase;protein_id=WP_058351075.1;transl_table=11\nNZ_LNAM01000001.1\tRefSeq\tgene\t1770\t2234\t.\t-\t.\tID=gene-ASU35_RS00010;Name=ASU35_RS00010;gbkey=Gene;gene_biotype=protein_coding;locus_tag=ASU35_RS00010;old_locus_tag=ASU35_00010\nNZ_LNAM01000001.1\tProtein Homology\tCDS\t1770\t2234\t.\t-\t0\tID=cds-WP_147525317.1;Parent=gene-ASU35_RS00010;Dbxref=Genbank:WP_147525317.1;Name=WP_147525317.1;gbkey=CDS;inference=COORDINATES: similar to AA sequence:RefSeq:WP_016279106.1;locus_tag=ASU35_RS00010;product=hypothetical protein;protein_id=WP_147525317.1;transl_table=11\nNZ_LNAM01000001.1\tRefSeq\tgene\t2297\t3070\t.\t-\t.\tID=gene-ASU35_RS00015;Name=ASU35_RS00015;gbkey=Gene;gene_biotype=protein_coding;locus_tag=ASU35_RS00015;old_locus_tag=ASU35_00015\nNZ_LNAM01000001.1\tProtein Homology\tCDS\t2297\t3070\t.\t-\t0\tID=cds-WP_058351077.1;Parent=gene-ASU35_RS00015;Dbxref=Genbank:WP_058351077.1;Name=WP_058351077.1;gbkey=CDS;inference=COORDINATES: similar to AA sequence:RefSeq:WP_009004880.1;locus_tag=ASU35_RS00015;product=Uma2 family endonuclease;protein_id=WP_058351077.1;transl_table=11\nNZ_LNAM01000001.1\tRefSeq\tgene\t3285\t4160\t.\t-\t.\tID=gene-ASU35_RS00020;Name=ASU35_RS00020;gbkey=Gene;gene_biotype=protein_coding;locus_tag=ASU35_RS00020;old_locus_tag=ASU35_00020\nNZ_LNAM01000001.1\tProtein Homology\tCDS\t3285\t4160\t.\t-\t0\tID=cds-WP_058351078.1;Parent=gene-ASU35_RS00020;Dbxref=Genbank:WP_058351078.1;Name=WP_058351078.1;gbkey=CDS;inference=COORDINATES: similar to AA sequence:RefSeq:WP_015521697.1;locus_tag=ASU35_RS00020;product=ABC transporter ATP-binding protein;protein_id=WP_058351078.1;transl_table=11\nNZ_LNAM01000001.1\tRefSeq\tgene\t4197\t4868\t.\t-\t.\tID=gene-ASU35_RS00025;Name=ASU35_RS00025;gbkey=Gene;gene_biotype=protein_coding;locus_tag=ASU35_RS00025;old_locus_tag=ASU35_00025\nNZ_LNAM01000001.1\tGeneMarkS-2+\tCDS\t4197\t4868\t.\t-\t0\tID=cds-WP_058351079.1;Parent=gene-ASU35_RS00025;Dbxref=Genbank:WP_058351079.1;Name=WP_058351079.1;gbkey=CDS;inference=COORDINATES: ab initio prediction:GeneMarkS-2+;locus_tag=ASU35_RS00025;product=hypothetical protein;protein_id=WP_058351079.1;transl_table=11\nNZ_LNAM01000001.1\tRefSeq\tgene\t4865\t5917\t.\t-\t.\tID=gene-ASU35_RS00030;Name=ASU35_RS00030;gbkey=Gene;gene_biotype=protein_coding;locus_tag=ASU35_RS00030;old_locus_tag=ASU35_00030\nNZ_LNAM01000001.1\tGeneMarkS-2+\tCDS\t4865\t5917\t.\t-\t0\tID=cds-WP_058351080.1;Parent=gene-ASU35_RS00030;Dbxref=Genbank:WP_058351080.1;Name=WP_058351080.1;gbkey=CDS;inference=COORDINATES: ab initio prediction:GeneMarkS-2+;locus_tag=ASU35_RS00030;product=ABC transporter permease;protein_id=WP_058351080.1;transl_table=11\nNZ_LNAM01000001.1\tRefSeq\tgene\t6257\t7468\t.\t-\t.\tID=gene-ASU35_RS00035;Name=ASU35_RS00035;gbkey=Gene;gene_biotype=protein_coding;locus_tag=ASU35_RS00035;old_locus_tag=ASU35_00035',
        options: {
          namePaths: ['product', 'gene_biotype'],
        },
      });

      df1.fetchTilesDebounced(
        tiles => {
          expect(tiles['0.0'][0].fields[3]).to.eql('protein_coding');
          done();
        },
        ['0.0'],
      );
    });
  });
});
