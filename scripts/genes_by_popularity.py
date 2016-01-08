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
                 .map(lambda p: Row(taxid=int(p[0]), 
                                    geneid=int(p[1]), 
                                    start_pos=p[9],
                                    end_pos=p[10],
                                    orientation=p[11],
                                    assembly=p[12])))
schemaGene2Refseq = sqlContext.inferSchema(gene2refseq)
schemaGene2Refseq.registerTempTable("gene2refseq")

gene_starts = sqlContext.sql('select gene2refseq.geneid, start_pos, pmid from gene2pubmed, gene2refseq  where gene2pubmed.geneid = gene2refseq.geneid')
gene_starts.registerTempTable('gene_starts')

gene_pubmed = sqlContext.sql("select geneid, start_pos, count(*) as cnt from gene_starts group by geneid, start_pos order by cnt desc")
gene_pubmed.take(1)

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
