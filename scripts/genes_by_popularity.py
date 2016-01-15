import os.path as op
base_dir = '/scr/fluidspace/pkerp/projects/genbank'


from pyspark.sql import *
sqlContext = SQLContext(sc)
# get the gene_id -> pubmed mapping
gene2pubmed = (sc.textFile(op.join(base_dir, "data/gene2pubmed"))
                 .filter(lambda x: x[0] != '#')
                 .map(lambda x: x.split('\t'))
                 .map(lambda p: Row(taxid=int(p[0]), geneid=int(p[1]), pmid=int(p[2]))))
schemaGene2Pubmed = sqlContext.inferSchema(gene2pubmed)
schemaGene2Pubmed.registerTempTable("gene2pubmed")

gene2refseq = (sc.textFile(op.join(base_dir, "data/gene2refseq"))
                 .filter(lambda x: x[0] != '#')
                 .map(lambda x: x.split('\t'))
                 .map(lambda p: Row(count=1,
                                    taxid=int(p[0]), 
                                    geneid=int(p[1]), 
                                    start_pos=p[9],
                                    end_pos=p[10],
                                    nucleotide_accession=p[7],
                                    orientation=p[11],
                                    assembly=p[12])))
schemaGene2Refseq = sqlContext.inferSchema(gene2refseq)
schemaGene2Refseq.registerTempTable("gene2refseq")

# get the most popular genes
gene_pubmed = sqlContext.sql("select taxid, geneid, count(*) as cnt from gene2pubmed where taxid = 9606 group by geneid, taxid order by cnt desc")
gene_pubmed.take(10)

#filtered_refseq = sqlContext.sql("select * from gene2refseq where assembly like '%GRCh38%'")
#filtered_refseq.take(10)

human_gene_pubmed = (gene2pubmed.filter(lambda x: x['taxid'] == 9606)
                                .map(lambda x: ((x['taxid'], x['geneid']), x)))
human_refseq = (gene2refseq.filter(lambda x: x['assembly'].find('GRCh38') >= 0)
                           .filter(lambda x: x['nucleotide_accession'].find('NC_') >= 0)
                           .map(lambda x: ((x['taxid'], x['geneid']), x)))

human_refseq_pubmed = human_gene_pubmed.join(human_refseq)
                      .map(lambda x: (x[0], x[1][0]))

def reduce_count((r1, r2)):
    '''
    A reduce function that simply counts the number of elements in the table.
    
    @param r1: A Row
    @param r2: A Row
    @return: A new Row, equal to the first Row with a summed count.
    '''
    print >>sys.stderr, "r1:", r1
    r2 = r1
    r2.count = r1['count'] + r2['count']
    return r2
    
    
#((count, taxid, geneid), Row)
counted_human_refseq_pubmed = (human_refseq_pubmed.reduceByKey(reduce_count)
                               .map(lambda x: ((x[1]['count'],x[0][0],x[0][1]), x[1]))
                               .sortByKey(ascending = False))
counted_human_refseq_pubmed.take(10)


gene_pubmed = sqlContext.sql("select geneid, start_pos, count(*) as cnt from gene_starts group by geneid, start_pos order by cnt desc")
gene_pubmed.take(1)

gene_starts = sqlContext.sql('select gene2refseq.geneid, start_pos, pmid from gene2pubmed, gene2refseq  where gene2pubmed.geneid = gene2refseq.geneid')
gene_starts.registerTempTable('gene_starts')


genes_sorted = sqlContext.sql("select tax_id, GeneID, count(*) as cnt from gene2refseq order by cnt desc")

gene_pubmed.registerTempTable('gene_pubmed')

gene_starts = sqlContext.sql('select gene2refseq.geneid, start_pos from gene2pubmed, gene2refseq  where gene2pubmed.geneid = gene2refseq.geneid')
result.take(1)

gene_info = (sc.textFile(op.join(base_dir, "data/gene_info"))
               .filter(lambda x: x[0] != '#')
               .map(lambda x: x.split('\t'))
               .map(lambda p: Row(tax_id=int(p[0]),
                                  GeneID=int(p[1]),
                                  Symbol=p[2],
                                  LocusTag=p[3],
                                  Synonyms=p[4],
                                  dbXrefs=p[5],
                                  chromosome=p[6],
                                  map_location=p[7],
                                  description=p[8],
                                  type_of_gene=p[9],
                                  Symbol_from_nomenclature_authority=p[10],
                                  Full_name_from_nomenclature_authority=p[11],
                                  Nomenclature_status=p[12],
                                  Other_designations=p[13],
                                  Modification_date=p[14])))
