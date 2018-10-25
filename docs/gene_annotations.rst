.. gene_annotations_section:

Gene Annotations Tracks
=======================

HiGlass uses a specialized track for displaying gene annotations. It is rougly
based on UCSC's refGene files
(e.g. http://hgdownload.cse.ucsc.edu/goldenPath/hg19/database/). For any identifiable
genome assembly the following commands can be run to generate a list of 
gene annotation that can be loaded as a zoomable track in HiGlass. 

Prerequisites
-------------

For any assembly, there needs to a refGene file:

http://hgdownload.cse.ucsc.edu/goldenPath/hg19/database/refGene.txt.gz

And a list of chromosome sizes in the negspy_ python package.

.. _negspy: https://github.com/pkerpedjiev/negspy

If there are no available chromosome sizes for this assembly in negspy, adding
them is simply a matter of downloading the list from UCSC (e.g.
http://hgdownload.cse.ucsc.edu/goldenpath/hg19/bigZips/hg19.chrom.sizes)


Creating the track
------------------

.. todo::

    See https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=gene&id=7157

Set the assembly name and species ID
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: bash

    ASSEMBLY=mm9
    TAXID=10090

    #ASSEMBLY=hg19
    #TAXID=9606

    #ASSEMBLY=sacCer3
    #TAXID=559292

    #ASSEMBLY=dm6
    #TAXID=7227

Download data from UCSC and NCBI
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: bash


    mkdir -p ~/data/genbank-data/${ASSEMBLY}

    wget -N -P ~/data/genbank-data/${ASSEMBLY}/ \
        http://hgdownload.cse.ucsc.edu/goldenPath/${ASSEMBLY}/database/refGene.txt.gz

    wget -N -P ~/data/genbank-data/ \
        ftp://ftp.ncbi.nlm.nih.gov/gene/DATA/gene2refseq.gz

    wget -N -P ~/data/genbank-data/ \
        ftp://ftp.ncbi.nlm.nih.gov/gene/DATA/gene_info.gz

    wget -N -P ~/data/genbank-data/ \
        ftp://ftp.ncbi.nlm.nih.gov/gene/DATA/gene2pubmed.gz


Preprocess data
^^^^^^^^^^^^^^^


.. code-block:: bash

    # remove entries to chr6_...

    gzcat ~/data/genbank-data/${ASSEMBLY}/refGene.txt.gz \
        | awk -F $'\t' '{if (!($3 ~ /_/)) print;}' \
        | sort -k2 > ~/data/genbank-data/${ASSEMBLY}/sorted_refGene
    wc -l ~/data/genbank-data/${ASSEMBLY}/sorted_refGene

    zgrep ^${TAXID} ~/data/genbank-data/gene2refseq.gz \
         > ~/data/genbank-data/${ASSEMBLY}/gene2refseq
    head ~/data/genbank-data/${ASSEMBLY}/gene2refseq

    zgrep ^${TAXID} ~/data/genbank-data/gene_info.gz \
        | sort -k 2 \
         > ~/data/genbank-data/${ASSEMBLY}/gene_info
    head ~/data/genbank-data/${ASSEMBLY}/gene_info

    zgrep ^${TAXID} ~/data/genbank-data/gene2pubmed.gz \
        > ~/data/genbank-data/${ASSEMBLY}/gene2pubmed
    head ~/data/genbank-data/${ASSEMBLY}/gene2pubmed

    # awk '{print $2}' ~/data/genbank-data/hg19/gene_info \
    # | xargs python scripts/gene_info_by_id.py \
    # | tee ~/data/genbank-data/hg19/gene_summaries.tsv

    # output -> geneid \t citation_count

Processing
^^^^^^^^^^

.. code-block:: bash

    cat ~/data/genbank-data/${ASSEMBLY}/gene2pubmed \
        | awk '{print $2}' \
        | sort \
        | uniq -c \
        | awk '{print $2 "\t" $1}' \
        | sort \
        > ~/data/genbank-data/${ASSEMBLY}/gene2pubmed-count
    head ~/data/genbank-data/${ASSEMBLY}/gene2pubmed-count


    # output -> geneid \t refseq_id

    cat ~/data/genbank-data/${ASSEMBLY}/gene2refseq \
        | awk -F $'\t' '{ split($4,a,"."); if (a[1] != "-") print $2 "\t" a[1];}' \
        | sort \
        | uniq  \
        > ~/data/genbank-data/${ASSEMBLY}/geneid_refseqid
    head ~/data/genbank-data/${ASSEMBLY}/geneid_refseqid
    wc -l ~/data/genbank-data/${ASSEMBLY}/geneid_refseqid


    #output -> geneid \t refseq_id \t citation_count

    join ~/data/genbank-data/${ASSEMBLY}/geneid_refseqid \
        ~/data/genbank-data/${ASSEMBLY}/gene2pubmed-count  \
        | sort -k2 \
        > ~/data/genbank-data/${ASSEMBLY}/geneid_refseqid_count

    head ~/data/genbank-data/${ASSEMBLY}/geneid_refseqid_count
    wc -l ~/data/genbank-data/${ASSEMBLY}/geneid_refseqid_count


    # output -> geneid \t refseq_id \t chr (5) \t strand(6) \t txStart(7) \t txEnd(8) \t cdsStart(9) \t cdsEnd (10) \t exonCount(11) \t exonStarts(12) \t exonEnds(13)

    join -1 2 -2 2 \
        ~/data/genbank-data/${ASSEMBLY}/geneid_refseqid_count \
        ~/data/genbank-data/${ASSEMBLY}/sorted_refGene \
        | awk '{ print $2 "\t" $1 "\t" $5 "\t" $6 "\t" $7 "\t" $8 "\t" $9 "\t" $10 "\t" $11 "\t" $12 "\t" $13 "\t" $3; }' \
        | sort -k1   \
        > ~/data/genbank-data/${ASSEMBLY}/geneid_refGene_count

    head ~/data/genbank-data/${ASSEMBLY}/geneid_refGene_count
    wc -l ~/data/genbank-data/${ASSEMBLY}/geneid_refGene_count

    # output -> geneid \t symbol \t gene_type \t name \t citation_count

    join -1 2 -2 1 -t $'\t' \
        ~/data/genbank-data/${ASSEMBLY}/gene_info \
        ~/data/genbank-data/${ASSEMBLY}/gene2pubmed-count \
        | awk -F $'\t' '{print $1 "\t" $3 "\t" $10 "\t" $12 "\t" $16}' \
        | sort -k1 \
        > ~/data/genbank-data/${ASSEMBLY}/gene_subinfo_citation_count
    head ~/data/genbank-data/${ASSEMBLY}/gene_subinfo_citation_count
    wc -l ~/data/genbank-data/${ASSEMBLY}/gene_subinfo_citation_count


    # 1: chr (chr1)
    # 2: txStart (52301201) [9]
    # 3: txEnd (52317145) [10]
    # 4: geneName (ACVRL1)   [2]
    # 5: citationCount (123) [16]
    # 6: strand (+)  [8]
    # 7: refseqId (NM_000020)
    # 8: geneId (94) [1]
    # 9: geneType (protein-coding)
    # 10: geneDesc (activin A receptor type II-like 1)
    # 11: cdsStart (52306258)
    # 12: cdsEnd (52314677)
    # 14: exonStarts (52301201,52306253,52306882,52307342,52307757,52308222,52309008,52309819,52312768,52314542,)
    # 15: exonEnds (52301479,52306319,52307134,52307554,52307857,52308369,52309284,52310017,52312899,52317145,)

    join -t $'\t' \
        ~/data/genbank-data/${ASSEMBLY}/gene_subinfo_citation_count \
        ~/data/genbank-data/${ASSEMBLY}/geneid_refGene_count \
        | awk -F $'\t' '{print $7 "\t" $9 "\t" $10 "\t" $2 "\t" $16 "\t" $8 "\t" $6 "\t" $1 "\t" $3 "\t" $4 "\t" $11 "\t" $12 "\t" $14 "\t" $15}' \
        > ~/data/genbank-data/${ASSEMBLY}/geneAnnotations.bed
    head ~/data/genbank-data/${ASSEMBLY}/geneAnnotations.bed
    wc -l ~/data/genbank-data/${ASSEMBLY}/geneAnnotations.bed

    python scripts/exonU.py \
        ~/data/genbank-data/${ASSEMBLY}/geneAnnotations.bed \
        > ~/data/genbank-data/${ASSEMBLY}/geneAnnotationsExonUnions.bed
    wc -l ~/data/genbank-data/${ASSEMBLY}/geneAnnotationsExonUnions.bed

Creating a HiGlass Track
^^^^^^^^^^^^^^^^^^^^^^^^

.. code-block:: bash

    workon hg-server
    ASSEMBLY=mm9

    clodius aggregate bedfile \
        --max-per-tile 20 --importance-column 5 \
        --assembly ${ASSEMBLY} \
        --output-file ~/data/tiled-data/gene-annotations-${ASSEMBLY}.db \
        --delimiter $'\t' \
        ~/data/genbank-data/${ASSEMBLY}/geneAnnotationsExonUnions.bed 

    aws s3 cp ~/data/tiled-data/gene-annotations-${ASSEMBLY}.db \
        s3://pkerp/public/hg-server/data/${ASSEMBLY}/

Importing into HiGlass
----------------------

Gene Annotations
^^^^^^^^^^^^^^^^

.. code-block:: bash

    curl -u `cat ~/.higlass-server-login`    \
        -F "datafile=@/Users/peter/data/tiled-data/gene-annotations-${ASSEMBLY}.db"    \
        -F "name=Gene Annotations (${ASSEMBLY})"   \ 
        -F 'filetype=beddb'  \
        -F 'datatype=gene-annotation'  \
        -F 'coordSystem=${ASSEMBLY}' \
        -F 'coordSystem2=${ASSEMBLY}'  \
        http://higlass.io:80/api/v1/tilesets/

Chromosomes
^^^^^^^^^^^

.. code-block:: bash

    curl -u `cat ~/.higlass-server-login`    \
        -F "datafile=@/Users/peter/tmp/chromSizes_hg38.tsv"    \
        -F "name=Chromosomes (hg38)"   \ 
        -F 'filetype=chromsizes-tsv'  \
        -F 'datatype=chromsizes'  \
        -F "coordSystem=${ASSEMBLY}" \
        -F "coordSystem2=${ASSEMBLY}"  \
        http://higlass.io:80/api/v1/tilesets/
