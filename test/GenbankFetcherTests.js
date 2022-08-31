/* eslint-env mocha */
import { expect } from 'chai';
import GBKDataFetcher from '../app/scripts/data-fetchers/genbank-fetcher';

describe('Genbank tests', () => {
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
      df.fetchTilesDebounced(
        (tiles) => {
          expect(tiles).to.include.all.keys('0.0');

          expect(tiles['0.0'].length).to.be.above(0);

          done();
        },
        ['0.0'],
      );
    });

    it('should fetch two tiles', (done) => {
      df.fetchTilesDebounced(
        (tiles) => {
          expect(tiles).to.include.all.keys('1.0', '1.1');

          expect(tiles['1.0'].length).to.be.above(0);
          expect(tiles['1.1'].length).to.be.above(0);

          done();
        },
        ['1.0', '1.1'],
      );
    });
  });

  describe('Text genbank fetcher', () => {
    const df = new GBKDataFetcher({
      text: 'LOCUS       AP009180              159662 bp    DNA     circular BCT 07-OCT-2016\nDEFINITION  Candidatus Carsonella ruddii PV DNA, complete genome.\nACCESSION   AP009180\nVERSION     AP009180.1\nDBLINK      BioProject: PRJNA17977\n            BioSample: SAMD00061085\nKEYWORDS    .\nSOURCE      Candidatus Carsonella ruddii PV\n  ORGANISM  Candidatus Carsonella ruddii PV\n            Bacteria; Proteobacteria; Gammaproteobacteria; Oceanospirillales;\n            Halomonadaceae; Zymobacter group; Candidatus Carsonella.\nREFERENCE   1\n  AUTHORS   Nakabachi,A., Yamashita,A., Toh,H., Ishikawa,H., Dunbar,H.E.,\n            Moran,N.A. and Hattori,M.\n  TITLE     The 160-kilobase genome of the bacterial endosymbiont Carsonella\n  JOURNAL   Science 314 (5797), 267 (2006)\n   PUBMED   17038615\nREFERENCE   2  (bases 1 to 159662)\n  AUTHORS   Hattori,M., Yamashita,A., Toh,H., Oshima,K. and Shiba,T.\n  TITLE     Direct Submission\n  JOURNAL   Submitted (30-MAY-2006) Contact:Masahira Hattori Graduate School of\n            Frontier Sciences, University of Tokyo; 5-1-5 Kashiwanoha, Kashiwa,\n            Chiba 277-8561, Japan\nCOMMENT     This work was done in collaboration with Atsushi Nakabachi, Helen\n            Dunbar, and Nancy Moran (University of Arizona), and Hajime\n            Ishikawa (The University of the Air).\nFEATURES             Location/Qualifiers\n     source          1..159662\n                     /organism="Candidatus Carsonella ruddii PV"\n                     /mol_type="genomic DNA"\n                     /strain="PV"\n                     /host="Pachypsylla venusta"\n                     /db_xref="taxon:387662"\n     gene            1..1317\n                     /locus_tag="CRP_001"\n     CDS             1..1317\n                     /locus_tag="CRP_001"\n                     /codon_start=1\n                     /transl_table=11\n                     /product="tRNA modification GTPase"\n                     /protein_id="BAF35032.1"\n                     /translation="MNTIFSRITPLGNGTLCVIRISGKNVKFLIQKIVKKNIKEKIAT\n                     FSKLFLDKECVDYAMIIFFKKPNTFTGEDIIEFHIHNNETIVKKIINYLLLNKARFAK\n                     AGEFLERRYLNGKISLIECELINNKILYDNENMFQLTKNSEKKIFLCIIKNLKFKINS\n                     LIICIEIANFNFSFFFFNDFLFIKYTFKKLLKLLKILIDKITVINYLKKNFTIMILGR\n                     RNVGKSTLFNKICAQYDSIVTNIPGTTKNIISKKIKILSKKIKMMDTAGLKIRTKNLI\n                     EKIGIIKNINKIYQGNLILYMIDKFNIKNIFFNIPIDFIDKIKLNELIILVNKSDILG\n                     KEEGVFKIKNILIILISSKNGTFIKNLKCFINKIVDNKDFSKNNYSDVKILFNKFSFF\n                     YKEFSCNYDLVLSKLIDFQKNIFKLTGNFTNKKIINSCFRNFCIGK"\n     gene            1314..2816\n                     /locus_tag="CRP_002"\n     CDS             1314..2816\n                     /locus_tag="CRP_002"\n                     /codon_start=1\n                     /transl_table=11\n                     /product="glucose inhibited division protein A"\n                     /protein_id="BAF35033.1"\n                     /translation="MNIFNIIIIGAGHSGIEAAISASKICNKIKIITSNLENLGIMSC\n                     NPSIGGIGKSHLVKELELFGGIMPEASDYSRIHSKLLNYKKGESVHSLRYQIDRILYK\n                     NYILKILFLKKNILIEQNEINKIIRFKKKILIFNKLKFFNIAKIIIVCAGTFINSKIY\n                     IGKNIKALNKAEKKSISYSFKKINLFISKLKTGTPPRLDLNYLNYKKLSVQYSDYTIS\n                     YGKNFNFNNNVKCFITNTDNKINNFIKKNIKNSSLFNLKFKSIGPRYCPSIEDKIFKF\n                     PNNKNHQIFLEPESYFSKEIYVNGLSNSLSYNIQKKLIKKILGIKKSYIIRYAYNIQY\n                     DYFDPRCLKISLNIKFANNIFLAGQINGTTGYEEASSQGFVAGINSARKILKLPLWKP\n                     KKWNSYIGVLLYDLTNFGIQEPYRIFTSKSDNRLFLRFDNAIFRLINISYYLGCLPIV\n                     KFKYYNSLIYKFYKNLINIRKIKLFDNFYLFKLIIIMSKYYGYIKKKYFK"\n     gene            2785..3477\n                     /locus_tag="CRP_003"\n     CDS             2785..3477\n                     /locus_tag="CRP_003"\n                     /codon_start=1\n                     /transl_table=11\n                     /product="F0F1-type ATP synthase A subunit"\n                     /protein_id="BAF35034.1"\n                     /translation="MVILKKNILNNFLNFKIIDLNLIILLLFIHLIVFYLLKNNNLMI\n                     LLSIYLNNFIKNSINLNSRNIIFFFSLVLFNIILFSNFIDLFPNNLIKNFLNLKQIEI\n                     VPTSNINITFCFSIISFLIIIMLTHKKIGFKKYIYSFFIYPINTEYLYLFNFIIESIS\n                     YIMKPISLSLRLFGNIFSSEIIFNIINNMNVFINSFLNLIWGIFHFIILPLQSFIFIT\n                     LVIIYVSQTLNH"\n     gene            3486..3719\n                     /locus_tag="CRP_004"\n     CDS             3486..3719\n                     /locus_tag="CRP_004"\n                     /codon_start=1\n                     /transl_table=11\n                     /product="F0F1-type ATP synthase C subunit"\n                     /protein_id="BAF35035.1"\n                     /translation="MNNLLILSSSIMIGLSSIGTGIGFGILGGKLLDSISRQPELDNL\n                     LLTRTFLMTGLLDAIPMISVGIGLYLIFVLSNK"\n     gene            3721..4176\n                     /locus_tag="CRP_005"\n     CDS             3721..4176\n                     /locus_tag="CRP_005"\n                     /codon_start=1\n                     /transl_table=11\n                     /product="putative F0F1-type ATP synthase B subunit"\n                     /protein_id="BAF35036.1"\n                     /translation="MNFNYTIINEFVSFLIFFYVSFKIIFPVILKKINNFLIIDYKNF\n                     VFNNQEKIIKKKLLDEIVKNENLTNKKFISLIEKIKKSILLEKQNFINFIKLEKINVL\n                     KIFKKKILNNNMLIIKNFLIEIKKLFINSFKNIFNEIICYNNEFIINYV"\n     gene            4169..4354\n                     /locus_tag="CRP_006"\n     CDS             4169..4354\n                     /locus_tag="CRP_006"\n                     /codon_start=1\n                     /transl_table=11\n                     /product="hypothetical protein"\n                     /protein_id="BAF35037.1"\n                     /translation="MFKFINRFLNLKKRYFYIFLINFFYFFNKCNFIKKKKIYKKIIT\n                     KKFENYLLKLIIQKYAK"\n     gene            4344..5789\n                     /locus_tag="CRP_007"\n     CDS             4344..5789\n                     /locus_tag="CRP_007"\n                     /codon_start=1\n                     /transl_table=11\n                     /product="F0F1-type ATP synthase alpha subunit"\n                     /protein_id="BAF35038.1"\n                     /translation="MLNEGIINKIYDSVVEVLGLKNAKYGEMILFSKNIKGIVFSLNK\n                     KNVNIIILNNYNELTQGEKCYCTNKIFEVPVGKQLIGRIINSRGETLDLLPEIKINEF\n                     SPIEKIAPGVMDRETVNEPLLTGIKSIDSMIPIGKGQRELIIGDRQTGKTTICIDTII\n                     NQKNKNIICVYVCIGQKISSLINIINKLKKFNCLEYTIIVASTASDSAAEQYIAPYTG\n                     STISEYFRDKGQDCLIVYDDLTKHAWAYRQISLLLRRPPGREAYPGDVFYLHSRLLER\n                     SSKVNKFFVNKKSNILKAGSLTAFPIIETLEGDVTSFIPTNVISITDGQIFLDTNLFN\n                     SGIRPSINVGLSVSRVGGAAQYKIIKKLSGDIRIMLAQYRELEAFSKFSSDLDSETKN\n                     QLIIGEKITILMKQNIHDVYDIFELILILLIIKHDFFRLIPINQVEYFENKIINYLRK\n                     IKFKNQIEIDNKNLENCLNELISFFISNSIL"\n     gene            5786..6544\n                     /locus_tag="CRP_008"\n     CDS             5786..6544\n                     /locus_tag="CRP_008"\n                     /codon_start=1\n                     /transl_table=11\n                     /product="F0F1-type ATP synthase gamma subunit"\n                     /protein_id="BAF35039.1"\n                     /translation="MIIKEINSKIKITTNINKLTNTLSMISLSKMNKYINLINNLDYI\n                     NIELKKILEYIIINIKSNVFCLIIITSNKGLCGNLNNEIIKYSLNYIKNNKNLDLILI\n                     GKKGIDFFNKKNFYIKEKIIFKDNELKNLVFNNKILNDLKKYENIFFISSKIIKNNVK\n                     IIKTDLYLKKKYNYLIKHNFNYDCFLKNFYNYNLKCLYLNNLFCELKSRMITMKSAAD\n                     NSKKIIKDMKLIKNKIRQFKVTQDMLEIINGSNL"\n     gene            6541..7884\n                     /locus_tag="CRP_009"\n     CDS             6541..7884\n                     /locus_tag="CRP_009"\n                     /codon_start=1\n                     /transl_table=11\n                     /product="F0F1-type ATP synthase beta subunit"\n                     /protein_id="BAF35040.1"\n                     /translation="MIGRIVQILGSIVDVEFKKNNIPYIYNALFIKEFNLYLEVQQQI\n                     GNNIVRTIALGSTYGLKRYLLVIDTKKPILTPVGNCTLGRILNVLGNPIDNNGEIISN\n                     KKKPIHCSPPKFSDQVFSNNILETGIKVIDLLCPFLRGGKIGLFGGAGVGKTINMMEL\n                     IRNIAIEHKGCSVFIGVGERTREGNDFYYEMKESNVLDKVSLIYGQMNEPSGNRLRVA\n                     LTGLSIAEEFREMGKDVLLFIDNIYRFTLAGTEISALLGRMPSAVGYQPTLAEEMGKL\n                     QERISSTKNGSITSVQAIYVPADDLTDPSPSTTFTHLDSTIVLSRQIAELGIYPAIDP\n                     LESYSKQLDPYIVGIEHYEIANSVKFYLQKYKELKDTIAILGMDELSENDQIIVKRAR\n                     KLQRFFSQPFFVGEIFTGIKGEYVNIKDTIQCFKNILNGEFDNINEKNFYMIGKI"\n     gene            7881..8123\n                     /locus_tag="CRP_010"\n     CDS             7881..8123\n                     /locus_tag="CRP_010"\n                     /codon_start=1\n                     /transl_table=11\n                     /product="hypothetical protein"\n                     /protein_id="BAF35041.1"\n                     /translation="MNLLILSIKNIIEYKNASILNVKTYLKLFSIMNNHINNICDVNQ\n                     IKLIFKNKIINIRINNGFLFQKKNNTKIICNFYEFL"\n     gene            8110..8997\n                     /locus_tag="CRP_011"\n     CDS             8110..8997\n                     /locus_tag="CRP_011"\n                     /codon_start=1\n                     /transl_table=11\n                     /product="ornithine carbamoyltransferase"\n                     /protein_id="BAF35042.1"\n                     /translation="MNFYNKHILNDFSFKKYEILTLFEISKKKIKNFLNNKNICILND\n                     KKSLRTINSLINSFNYLNIKYLQILNNHNIKKESFKDFSRTIGLNFDYLYYRCLNDKI\n                     LKIIAKYSSLIIVNLLSNGYHPIQALTDINSFFYNKKDVLMYIGNITSNVIRSIIILL\n                     SKINYLVVLISPIKYWFKFLIKKIFPKKKILISEKLILFKKKYYVYTDVWESMNNKNV\n                     KITDFLNLQINKKLFDLIKIKKVLHCMPRFNKSYLDFEISNLVFESDYFLVNNSIIKK\n                     NKIFKSYIFISNSFFFKII"\n     gene            complement(9084..9521)\n                     /locus_tag="CRP_012"\n     CDS             complement(9084..9521)\n                     /locus_tag="CRP_012"\n                     /codon_start=1\n                     /transl_table=11\n                     /product="3-dehydroquinate dehydratase"\n                     /protein_id="BAF35043.1"\n                     /translation="MFVCNKIINVLIINGPNINFLKKREKIYSKISFKKLKKKILKYS\n                     KNIINIKFYNSNCEGKIINFIQKNINFNYIIINPGAYSHYSIALLDCIKIFKGKIIEL\n',
    });

    it('should fetch the tileset info', (done) => {
      df.tilesetInfo((tsInfo) => {
        expect(tsInfo.tile_size).to.eql(1024);
        expect(tsInfo.max_zoom).to.eql(8);

        done();
      });
    });

    it('should fetch a tile', (done) => {
      df.fetchTilesDebounced(
        (tiles) => {
          expect(tiles).to.include.all.keys('0.0');

          expect(tiles['0.0'].length).to.be.above(0);

          done();
        },
        ['0.0'],
      );
    });
  });
});
