#!/usr/bin/python

import argparse
import genome_utils as gu
import sys
import os.path as op

import pyspark
sc = pyspark.SparkContext()

def main():
    parser = argparse.ArgumentParser(description="""
    
    python create_gene_counts.py
""")

    parser.add_argument('assembly')
    #parser.add_argument('-o', '--options', default='yo',
    #					 help="Some option", type='str')
    #parser.add_argument('-u', '--useless', action='store_true', 
    #					 help='Another useless option')

    args = parser.parse_args()

    data_dir = op.expanduser("~/data")
    base_ucsc_dir = op.join(data_dir, 'ucsc-data/{}'.format(args.assembly))  # where all of the files downloaded from UCSC will be stored

    get_outfile = lambda x: gu.get_outfile(x, data_dir, args.assembly)

    cum_chrom_lengths = gu.get_chrom_lengths(sc,base_ucsc_dir)
    refGene = gu.load_refgene_data(sc, base_ucsc_dir, cum_chrom_lengths)
    taxid_geneid_count = gu.load_gene_counts(sc, op.join(data_dir, 'genbank-data/'),
            outfile=get_outfile('taxid-geneid-count'))
    refseqid_taxid_geneid = gu.load_refseq2gene(sc, op.join(data_dir, 'genbank-data'),
            outfile=get_outfile('refseq-taxid-geneid'))
    taxid_geneid_count_refseq = gu.join_counts_and_ids(sc, refseqid_taxid_geneid, taxid_geneid_count,
            outfile=get_outfile('taxid-geneid-refseqid-count'))
    refseqid_refgene_count = gu.join_refgene_and_counts(sc, refGene, taxid_geneid_count_refseq)

    outfile = get_outfile('refgene-count')
    (refseqid_refgene_count.map(lambda x: "{name}\t{chrom}\t{strand}\t{txStart}\t{txEnd}\t{genomeTxStart}\t{genomeTxEnd}\t{cdsStart}\t{cdsEnd}\t{exonCount}\t{exonStarts}\t{exonEnds}\t{geneName}\t{count}\t{uid}"
                                .format(count=x[1][1]['count'],uid=shortuuid.uuid(), **x[1][0]))
     .saveAsTextFile(outfile))

    

if __name__ == '__main__':
    main()


