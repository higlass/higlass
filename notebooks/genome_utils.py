import os.path as op


import shutil

# create a directory to store intermediate output files
def get_outfile(table_name, data_dir, assembly):
    data_dir = op.expanduser("~/data/genbank-output/")
    output_dir = op.join(data_dir, assembly)   # where all of the intermediate output will be stored

    outfile = op.join(output_dir, '{}'.format(table_name))
    if op.exists(outfile):
        shutil.rmtree(outfile)
    return outfile

def get_chrom_lengths(sc, base_dir):
    '''
    Get the cumulative start positions for the chromosomes in an assembly. The chromosomes
    will be sorted alphabetically by their names.
    
    :param base_dir: A directory containing meta data about a genome assembly
    :return: A dictionary of the from { 'chr2': 234323432 }, showing at which position
             chromosomes start.
    '''
    chromLengths = (sc.textFile(op.join(base_dir, 'chromInfo.txt.gz'))
                    .map(lambda x: x.split('\t'))
                    .map(lambda x: {'chrom': x[0], 'length': int(x[1]) })
                    .collect())
    
    cum_chrom_lengths = {}
    curr_cum_lengths = 0
    
    for x in sorted(chromLengths, key=lambda x: -x['length']):
        cum_chrom_lengths[x['chrom']] = curr_cum_lengths
        curr_cum_lengths += x['length']
        
    return cum_chrom_lengths


def parse_exon_positions(exon_positions_str):
    return map(int, exon_positions_str.strip(",").split(','))

def load_refgene_data(sc, base_dir, cum_chrom_lengths):
    '''
    Load the UCSC refgene data for a particular assembly.
    
    :param base_dir: The directory which contains the refGene.txt.gz file.
    '''
    refGene = (sc.textFile(op.join(base_dir, 'refGene.txt.gz'))
               .map(lambda x: x.split('\t'))
               .map(lambda x: {'name': x[1],
                               'chrom': x[2],
                               'strand': x[3],
                               'txStart': x[4],
                               'txEnd': x[5],
                               'cdsStart': x[6],
                               'cdsEnd': x[7],
                               'exonCount': x[8],
                               'exonStarts': x[9].strip(','),
                               'exonEnds': x[10].strip(','),
                               'chromOffset': cum_chrom_lengths[x[2]],
                               'genomeTxStart': cum_chrom_lengths[x[2]] + int(x[4]),
                               'genomeTxEnd': cum_chrom_lengths[x[2]] + int(x[5]),
                               'geneName': x[12],
                               'geneLength': int(x[5]) - int(x[4]),
                               })
               .filter(lambda x: x['chrom'].find('_') == -1)
            )
    
    return refGene

def load_gene_counts(sc, genbank_dir, outfile):
    gene2pubmed = (sc.textFile(op.join(genbank_dir, "gene2pubmed"))
                     .filter(lambda x: x[0] != '#')
                     .map(lambda x: x.split('\t'))
                     .map(lambda p: {'taxid': int(p[0]), 'geneid': int(p[1]), 'pmid': int(p[2]), 'count': 1})
                     .map(lambda x: ((x['taxid'], x['geneid']), {'count': x['count']}))
                     )
    
    def reduce_count(r1, r2):
        '''
        A reduce function that simply counts the number of elements in the table.
        
        @param r1: A Row
        @param r2: A Row
        @return: A new Row, equal to the first Row with a summed count.
        '''
        #print >>sys.stderr, "r1:", r1
        r1['count'] += r2['count']
        return r1

    print gene2pubmed.take(1)
    reduced_gene2pubmed = gene2pubmed.reduceByKey(reduce_count)

    (reduced_gene2pubmed
        .map(lambda x: "{}\t{}\t{}".format(x[0][0], x[0][1], x[1]['count']))
        .saveAsTextFile(outfile)
        )
    
    return reduced_gene2pubmed

def take_one(r1, r2):
    return r1

def take_max(r1, r2):
    if r1 > r2:
        return r1
    else:
        return r2

def load_refseq2gene(sc, genbank_base_dir, outfile):
    '''
    Get the mapping from refseq IDs to gene IDs
    
    :param genbank_base_dir: The directory that contains all of the genbank files.
    :return: A set of tuples of the form (refseq_id, (taxid, geneid))
    '''
    gene2refseq = (sc.textFile(op.join(genbank_base_dir, 'gene2refseq'))
                   .filter(lambda x: x[0] != '#')
                   .map(lambda x: x.split('\t'))
                   .map(lambda p: {'taxid': int(p[0]), 'geneid': int(p[1]), 'refseqid': p[3] })
                   .map(lambda x: (x['refseqid'].split('.')[0], (x['taxid'], x['geneid'])))
                   )
    
    def reduce_by_refseq_id(r1, r2):
        # because we're just looking for a mapping from geneId to refseqId, we just need to throw
        # away single entries with identical refseq ids
        return r1
    
    print gene2refseq.take(10)
    refseq2gene = gene2refseq.reduceByKey(take_one)
    print refseq2gene.take(1)
    
    (refseq2gene.map(lambda x: "{}\t{}\t{}".format(x[0], x[1][0], x[1][1]))
         .saveAsTextFile(outfile)
    )
    return refseq2gene

def join_counts_and_ids(sc, refseqid_taxid_geneid, taxid_geneid_count, outfile):
    taxid_geneid_refseq = refseqid_taxid_geneid.map(lambda x: (x[1], x[0]))
    print "count1:", taxid_geneid_refseq.count()
    taxid_geneid_refseq = taxid_geneid_refseq.reduceByKey(take_one)
    print "count2:", taxid_geneid_refseq.count()
    
    
    '''    
    taxid_geneid_refseq = (sc.textFile(op.join(output_dir, 'genbank-output/refseqid-taxid-geneid'))
                   .map(lambda x: x.split())
                   .map(lambda x: ((int(x[1]), int(x[2])), x[0]))
                        )
    '''
    print taxid_geneid_refseq.take(1)
    
    '''
    (sc.textFile(op.join(output_dir, 'genbank-output/taxid-geneid-count'))
                          .map(lambda x: x.split())
                          .map(lambda x: ((int(x[0]), int(x[1])), int(x[2])))
                          )
    '''
    print "taxid_geneid_count", taxid_geneid_count.take(1)
    print "1. taxid_geneid_count.count():", taxid_geneid_count.count()
    taxid_geneid_count = taxid_geneid_count.reduceByKey(take_max)
    print "2. taxid_geneid_count.count():", taxid_geneid_count.count()
    
    taxid_geneid_count_refseq = taxid_geneid_count.join(taxid_geneid_refseq)
    print taxid_geneid_count_refseq.take(1)
    print taxid_geneid_count.take(1)

    (taxid_geneid_count_refseq.map(lambda x: "{}\t{}\t{}\t{}".format(x[0][0],
                                                                  x[0][1],
                                                                  x[1][1],
                                                                  x[1][0]))
     .saveAsTextFile(outfile)
     )
    return taxid_geneid_count_refseq

def join_refgene_and_counts(sc, refGene, taxid_geneid_count_refseq):
    '''
    Combine the refGene information about the genes with the citation
    count information.
    '''
    refseqid_refgene = refGene.map(lambda x: (x['name'], x))
    
    print refseqid_refgene.take(1)
    
    refseqid_count = taxid_geneid_count_refseq.map(lambda x: (x[1][1], x[1][0]))
    
    print refseqid_count.take(1)
    
    refseqid_refgene_count = refseqid_refgene.join(refseqid_count)

    print refseqid_refgene_count.take(1)
    

    return refseqid_refgene_count

