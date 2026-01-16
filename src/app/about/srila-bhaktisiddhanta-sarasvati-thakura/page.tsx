"use client";

import { AnimatedSection } from "@/components/layout/animated-section";
import { getAboutPage, type AboutPage } from "@/lib/services/firestore";
import Image from "next/image";
import { useEffect, useState } from "react";

const FALLBACK_HERO_TITLE = "Srila Bhaktisiddhanta Sarasvati Thakura";
const FALLBACK_INTRO =
  'Srila Bhaktisiddhanta Sarasvati was one of ten children born to Bhaktivinoda Thakura, a great Vaisnava teacher in the disciple-line from Lord Caitanya Himself. While living in a house named Narayana Chata, just near the temple of Lord Jagannatha in Puri, Bhaktivinoda Thakura was engaged as a prominent Deputy Magistrate and also served as the superintendent of the temple of Lord Jagannatha. Yet in spite of these responsibilities, he served the cause of Krishna with prodigious energy. While working to reform Gaudiya Vaisnavism in India, he prayed to Lord Caitanya, "Your teachings have been greatly depreciated and it is not in my power to restore them." Thus he prayed for a son to help him in his preaching mission. When, on February 6, 1874, Bhaktisiddhanta Sarasvati was born to Bhaktivinoda and Bhagavati Devi in Jagannatha Puri, the Vaisnavas considered him the answer to his father\'s prayers. He was born with the umbilical cord wrapped around his neck and draped across his chest like the sacred thread worn by brahmanas.';
const FALLBACK_SECOND_P1 =
  "Six months after the child was born, Bhaktivinoda arranged for his son to undergo the annaprasana ceremony with the prasada of Vimala Devi, and thereafter named the boy Bimala prasada. Around the same time the carts of the Jagannatha festival stopped at the gate of Bhaktivinoda's residence and for three days could not be moved. Bhaktivinoda Thakura's wife brought the infant onto the cart and approached the Deity of Lord Jagannatha. Spontaneously, the infant extended his arms and touched the feet of Lord Jagannatha and was immediately blessed with a garland that fell from the body of the Lord. Seeing this the priests chanted the name of Hari and told the child's mother that the boy would certainly become a great devotee one day. When Bhaktivinoda Thakura learned that the Lord's garland had fallen on his son, he realized that this was the son for whom he had prayed.";
const FALLBACK_SECOND_P2 =
  "Bimala Prasada stayed in Puri for ten months after his birth and then went to Bengal by palanquin on his mother's lap. His infancy was spent at Nadia District's Ranaghat hearing topics of Sri Hari from his mother.";
const FALLBACK_LONG_PARAS = [
  "Bhaktivinoda and his wife were orthodox and virtuous; they never allowed their children to eat anything other than prasada, nor to associate with bad company. One day, when Bimala Prasada was still a child of no more than four years, his father mildly rebuked him for eating a mango not yet duly offered to Lord krishna. Bimala Prasada, although only a child, considered himself an offender to the Lord and vowed never to eat mangoes again. (This was a vow that he would follow throughout this life.) By the time Bimala Prasada was seven years old, he had memorized the entire Bhagavad-gita and could even explain its verses. His father then began training him in proofreading and printing, in conjunction with the publishing of the Vaisnava magazine Sajjana-tosani.",
  "In 1881, in the course of excavating for the construction of the Bhakti bhavana at Rambagan in Calcutta, a Deity of Kurmadeva was unearthed. After initiating his seven year old son, Bhaktivinoda entrusted Bimala with the service of the deity of Kurmadeva.",
  "On April 1, 1884, Bhaktivinoda was appointed the senior Deputy Magistrate of Serampore, where he admitted Bimala in the Serampore High School. When Bimala was a mere student in class five, he invented a new method of writing named Bicanto. During this period he took lessons in mathematics and astrology from Pandita Mahesacandra Cudamoni. However, he preferred to read devotional books rather than the school texts.",
  "In 1892, after passing his entrance examination, Bimala was admitted into the Sanskrit College of Calcutta. There he spent considerable time in the library studying various books on philosophy. He also studied the Vedas under the guidance of Prthvidhara Sarma. As a student he contributed many thoughtful articles to various religious journals. However he did not continue with his college studies for long.",
  "In 1897 he started an autonomous Catuspathi (Sanskrit school) wherefrom monthly journals entitled \"Jyotirvid\", \"Brihaspati\", and many old treatises on astrology were published. In 1898, while teaching at Sarasvata Catuspathi, he studied Siddhanta Kaumudi under Prthvidhara Sarma, at Bhakti bhavana. By the time he was twenty-five he had become well versed in Sanskrit, mathematics, and astronomy, and he had established himself as the author and publisher of many magazine articles and one ancient book, Surya-siddhanta, for which he received the epithet Siddhanta Sarasvati in recognition of his erudition.",
  "In 1895 Sarasvati Goswami accepted service under the Tripura Royal Government as an editor for the biography entitled Rajaratnakara, the life histories of the royal line of the independent Tripura Kingdom. Later he was entrusted with the responsibility of educating the Yuvaraja Bahadur and Rajkumar Vrajendra Kisore, in Bengali and Sanskrit.",
  "After a short period of time, Siddhanta Sarasvati took up the responsibilities for inspecting various ongoing activities in the royal palace for the state of Tripura. However, after finding envy, malice and corruption surfacing in every corner of his inspection, Siddhanta Sarasvati very quickly developed an aversion to state affairs and gave notice of his intention to retire to Maharaja Radhakisore Manikya Bahadur. The Maharaja approved of Siddhanta Sarasvati's plans for renunciation and awarded him full-pay pension. However, after three years Siddhanta Sarasvati also renounced his pension. With his father, he visited many tirthas and heard discourses from the learned panditas. In October 1898 Siddhanta Sarasvati accompanied Bhaktivinoda on a pilgrimage of Kasi, Prayaga, Gaya and other holy places. At Kasi a discussion was held with Ramamisra Sastri regarding the Ramanuja sampradaya. After this talk Siddhanta Sarasvati's life seemed to take a turn, his inclination towards renunciation increased, and he quietly continued to search for a guru.",
  "When Siddhanta Sarasvati was twenty-six his father, understanding the mind of his son, guided him to take initiation from a renounced Vaisnava saint, Gaurakishora dasa Babaji. Gaurakishora dasa Babaji was the embodiment of vairagya and was very selective about giving diksa. He lived beneath a tree near the bank of the Ganga and wore the abandoned clothes of dead bodies as a waist band (kaupina). Generally he ate plain rice soaked in Ganga water garnished with chili and salt. Sometimes he utilized discarded earthen pots, after properly washing them he would cook rice in them, offer it to Krishna, and then take Prasada.",
  "Following the advice of his father, Siddhanta Sarasvati went to Gaurakishora dasa and begged to be accepted as his disciple. Gaurakishora replied that he would not be able to give diksa unless he received the approval of Lord Chaitanya. However, when Siddhanta Sarasvati returned again, Gaurakishora said that he had forgotten to ask Lord Chaitanya. On the third visit, Gaurakishora stated that Lord Chaitanya had said that erudition is extremely insignificant in comparison to devotion to the Supreme Lord.",
  "Hearing this Siddhanta replied that since Gaurakishora was the servant of Kapatacudamani (the Supreme deceiver) hence he must be testing Sarasvati by withholding his consent. However Siddhanta Sarasvati remained firmly determined and remarked that Ramanuja Acarya had been sent back eighteen times before he finally received the grace of Gosthipurna, thus he too would wait patiently until the day that Gaurakishora would bestow his benedictions upon him. Seeing the commitment of Sarasvati, Gaurakishora was impressed and gave him diksa in the blissful grove of Godruma and told him, \"to preach the Absolute Truth and keep aside all other works.\"",
  "In March 1900 Sarasvati accompanied Bhaktivinoda on a pilgrimage of Balasore, Remuna, Bhuvanesvara, and Puri. As instructed by Bhaktivinoda, Sarasvati gave lectures from CC with profound purports. Through the initiative of Bhaktivinoda Thakura the flow of pure bhakti again began to inundate the world. After Lord Caitanya's disappearance a period of darkness ensued in which the river of bhakti had been choked and practically dried up. The end of the period was brought about by the undaunted preaching of Bhaktivinoda Thakura. He wrote a number of books on suddha-bhakti siddhanta and published numerous religious periodicals. He inspired many to take up the service of Lord Gauranga and instituted various Nama Hatta and Prapanna-asrama (Gaudiya matha centers).",
  "In 1905 Siddhanta Sarasvati took a vow to chant the Hare Krishna mantra a billion times. Residing in Mayapur in a grass hut near the birthplace of Lord Caitanya, he chanted the mantra day and night. He cooked rice once a day in an earthen pot and ate nothing more; he slept on the ground, and when the rainwater leaked trough the grass ceiling, he sat beneath an umbrella, chanting.",
  "In 1912 Manindra Nandi, the Maharaja of Kasimbazar, arranged to hold a large Vaisnava Sammilani at his palace. At the specific request of the Maharaja, Sarasvati Goswami attended the Sammilani and delivered four very brief speeches on suddha-bhakti on four consecutive days. However, he did not take any food during the Sammilani because of the presence of various groups of sahajiyas. After fasting for four days Sarasvati Goswami came to Mayapura and took the Prasada of Lord Chaitanya. Later when Maharaja Manindra Nandi realized what had happened he was deeply aggrieved and came to Mayapura to apologize to Siddhanta Sarasvati.",
  "During that time Bengal was full of sahajiya sects, such as Aul, Baul, Kartabhaja, Neda-nedi, Daravesa, Sain etc., who followed worldly practices in the name of spiritualism. Siddhanta Sarasvati launched a severe attack against those irreligious sects and did not spare anyone who deviated from the teachings of Lord Chaitanya. Even some well-known persons bearing the surname of Goswamis patronized these sahajiya sects during that period.",
  "Siddhanta Sarasvati was deeply grieved to see these groups of prakrita sahajiyas, in the garb of paramahamsa Goswami gurus, misleading the people. Thus he completely dissociated himself and resorted to performing bhajana in solitude. During this period of solitude, one day Lord Chaitanya, along with the six Goswamis, suddenly manifested before Siddhanta Sarasvati's vision and said: \"Do not be disheartened, take up the task of re-establishing Varnashrama with new vigour and preach the message of love for Sri Krishna everywhere.\" After receiving this message, Sarasvati Goswami was filled with inspiration to preach the glories of Lord Chaitanya enthusiastically.",
  "In 1911, while his aging father was lying ill, Siddhanta Sarasvati took up a challenge against pseudo Vaishnavas who claimed that birth in their caste was the prerequisite for preaching Krishna consciousness. The caste-conscious brahmana community had become incensed by Bhaktivinoda Thakura's presentation of many scriptural proofs that anyone, regardless of birth, could become a brahmana-Vaishnava. These smarta brahmanas, out to prove the inferiority of the Vaishnavas, arranged a discussion. On behalf of his indisposed father, young Siddhanta Sarasvati wrote an essay, \"The Conclusive Difference Between the Brahmana and the Vaishnava,\" and submitted it before his father. Despite his poor health, Bhaktivinoda Thakura was elated to hear the arguments that would soundly defeat the challenge of the smartas.",
  "On the request of Madhusudana dasa Goswami of Vrindavana and Visvambharananda deva Goswami of Gopiballabhapur, Siddhanta Sarasvati traveled to Midnapur, where panditas from all over India had gathered for a three-day discussion. Some of the smarta panditas who spoke first claimed that anyone born in a sudra family, even though initiated by a spiritual master, could never become purified and perform the brahminical duties of worshiping the deity or initiating disciples. Finally, Siddhanta Sarasvati delivered his speech. He began quoting Vedic references glorifying the brahmanas, and at this the smarta scholars became very much pleased. But when he began discussing the actual qualifications for becoming a brahmana, the qualities of the Vaisnavas, the relationship between the two, and who, according to the Vedic literature, is qualified to become a spiritual master and initiate disciples, the joy of the Vaisnava-haters disappeared. Siddhanta Sarasvati conclusively proved from the scriptures that if one is born as a sudra but exhibits the qualities of a brahmana then he should be honored as a brahmana, despite his birth. And if one is born in a brahmana family but acts like a sudra, then he is not a brahmana. After his speech, Siddhanta Sarasvati was congratulated by the president of the conference, and thousands thronged around him. It was a victory for Vaishnavism.",
  "Bhaktivinoda Thakura passed away in 1914 on the day of Gadadhara Pandita's disappearance. On the eve of his disappearance Bhaktivinoda instructed his son to preach the teachings of the six Goswamis and Lord Chaitanya far and wide. He also requested that Siddhanta Sarasvati develop the birthsite of Lord Gauranga. Mother Bhagavati Devi disappeared a few years later. Before her passing away, she held the hands of Sarasvati Goswami imploring him to preach the glories of Lord Gauranga and His dhama. Accepting the instructions of his parents as his foremost duty, Sarasvati Goswami took up this task of preaching with intense enthusiasm and vigour.",
  "With the passing away of his father, and his spiritual master a year later, Siddhanta Sarasvati continued the mission of Lord Chaitanya. He assumed editorship of Sajjana-tosani and established the Bhagwat Press in Krishnanagar. Then in 1918, in Mayapur, he sat down before a picture of Gaurakishora dasa Babaji and initiated himself into the sannyasa order. At this time he assumed the sannyasa title Bhaktisiddhanta Sarasvati Goswami Maharaja.",
  "Bhaktisiddhanta Sarasvati was dedicated to using the printing press as the best medium for large-scale distribution of Krishna consciousness. He thought of the printing press as a brhat mrdanga, a big mrdanga. The mrdanga drum played during kirtana could be heard for a block or two, whereas with the brhat mrdanga, the printing press, the message of Lord Chaitanya could be spread all over the world.",
  "Rohinikumar Ghosh, a nephew of Justice Candramadhava Ghosh of Calcutta High Court and originally a resident of Bhola in Barisal (now in Bangladesh), decided to renounce the world and engage himself in Hari bhajana. With this purpose in mind he came to Kulia in Navadvipa where he led the life of a Baul. However, he despised the practices of the sevadasis prevalent amongst the Baul sect. One day Rohini Ghosh happen to come to the Yogapitha when Sarasvati Goswami was lecturing there. Rohini was delighted to see the luminous appearance of Sarasvati Goswami and fascinated by his words. Late that night, after spending the whole day listening to Sarasvati Goswami's teachings, Rohini returned to his Baul guru's asrama at Kulia. Without taking any prasada, Rohini took rest contemplating the lessons on suddha-bhakti which he had heard that day. In his dream Rohini saw a Baul and his consort appear before him in the form of a tiger and tigress which were about to devour him. Trembling in fear Rohini desperately called out to Lord Chaitanya. Suddenly Rohini found himself being rescued from the clutches of the tigers by Bhaktisiddhanta Sarasvati. From that day Rohini left the Baul guru forever and took shelter at the feet of Sarasvati Goswami.",
  "Annadaprasad Datta, the elder brother of Sarasvati Goswami, suffered with severe headaches shortly before his disappearance. On the day of Annada's disappearance Sarasvati Goswami remained by his side all through the night, chanting Harinama. Before Annada passed a way he briefly regained consciousness and began apologizing to Sarasvati Goswami, who simply encouraged him to remember the Holy Name of the Lord. Suddenly the tilak mark of the Ramanuja sampradaya became clearly visible on Annada's forehead. Annada explained that in his past birth he had been a Vaisnava belonging to the Ramanuja sect. But due to committing an offense at the feet of Sarasvati Thakura, Annada had to be reborn. However, as a result of his past merit he was fortunate enough to be born into Bhaktivinoda's family. After finishing his account Annada breathed his last.",
  "Once on the day preceding Janmastami in the Bengali month of Bhadra, Sarasvati Goswami was engaged in bhajana at Mayapura but was feeling disturbed as he was unable to arrange for milk to be offered to the Deity. As soon as he began to think in this way he chastised himself: \"Have I thought like this for my own sake? That is wrong.\" Because it was the monsoon season, Lord Chaitanya's birth site was covered with water and was totally inaccessible except by boat. However, that afternoon, one milkman turned up there wading through water and slush carrying a large quantity of milk, ksira, butter, cottage-cheese etc. Apparently a zamindar named Harinarayana Cakravarti, guided by Lord Caitanya, had sent the milkman with all the items.",
  "After offering everything to the Deity the Devotees partook of the Prasada joyfully. Sarasvati Thakura was surprised to see so much Prasada and the Devotees explained what had happened. After taking prasada Siddhanta Sarasvati humbly appealed to the Lord: \"I am very sorry to have caused You so much trouble. Why did I have such an uncalled for thought? To fulfill my desire You have inspired another person and arranged to send these things.\"",
  "The world was amazed to see the supernatural power of Sarasvati Goswami. Many educated persons from highly respectable families were attracted to him and thus dedicated themselves to the service of Lord Gauranga. Between 1918 and 1937 Bhaktisiddhanta Sarasvati founded sixty-four suddha bhakti Mathas at the following places: Navadvipa, Mayapura, Calcutta, Chaka, Mymensingh, Naryanaganj, Chittagong, Midnapore, Remuna, Balasore, Puri, Alalanatha, Madras, Covoor, Delhi, Patna, Gaya, Lucknow, Varanasi, Hardwar, Allahabad, Mathura, Vrindavana, Assam, Kuruksetra, and outside India in London, and Rangoon. Sarasvati Goswami instituted Gaurapadapitha at Nrsimhacala on the top of the Mandara hill, and at several places in South India. He initiated twenty five highly educated persons into Bhagavata Tridandi sannyasa.",
  "He published the following periodicals on Suddha Bhakti in different languages: Sajjanatosani (a fortnightly Bengali), The Harmonist (an English fortnightly), Gaudiya (a Bengali weekly), Bhagavata (a Hindi fortnightly), Nadiya Prakasa (a Bengali daily), Kirtana (an Assamese monthly), Paramarthi (in Oriya).",
  "In addition he published a large number of Vaishnava books. In fact, he heralded a new era in the spiritual world. He deputed well-disciplined tridandi sannyasi's to preach the message of Lord Gauranga all over the world. For six years he continued to supervise this preaching work and when he found that his mission had attained its goal, to a reasonable extent, he decided to pass into the eternal service of Lord Gauranga.",
  "He recommended to all Vaishnavas to read these books: Caitanya Bhagavata (by Vrindavana dasa Thakura), Dasamula Siksa (by Bhaktivinoda Thakura), Sri Krishna Bhajanamrta (by Narahari Sarkara) and Prema Bhakti Candrika (by Narottama dasa Thakura). According to others, they were Prema Bhakti Candrika, Prarthana (by Narottama dasa Thakura) and Upadesamrta (by Rupa Goswami).",
  "A few days before his disappearance Bhaktisiddhanta Sarasvati called his foremost disciples and showered his blessings upon all his Devotees. He gave them the following instructions: \"With the utmost enthusiasm preach the message of Rupa Raghunatha. Our ultimate goal is to become a speck of dust touching the lotus feet of the followers of Rupa Goswami. All of you remain united in allegiance to the spiritual master (asraya-vigraha) in order to satisfy the senses of the Transcendental Entity of Non-Dual Knowledge. Do not give up the worship of Hari even amidst hundreds of dangers, hundreds of insults or hundreds of persecutions. Do not become unenthusiastic upon seeing that the majority of people in this world are not accepting the message of Krishna's sincere worship. Never give up the glorification of the topics of Krishna, they are your own personal bhajana and your very all and all. Being humble like a blade of grass and tolerant like a tree, constantly glorify Hari.\"",
  "In the early hours of the day on January 1, 1937 Bhaktisiddhanta Sarasvati Goswami passed away.",
];

export default function SrilaBhaktisiddhantaPage() {
  const [page, setPage] = useState<AboutPage | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await getAboutPage("srila-bhaktisiddhanta");
      if (mounted && data) {
        setPage(data);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const heroTitle = page?.heroTitle ?? FALLBACK_HERO_TITLE;
  const firstSection = page?.sections.find((s) => s.id === "bhaktisiddhanta-1");
  const firstIntro = firstSection?.paragraphs?.[0] ?? FALLBACK_INTRO;
  const secondSection = page?.sections.find(
    (s) => s.id === "bhaktisiddhanta-2"
  );
  const secondParas =
    secondSection?.paragraphs ?? [FALLBACK_SECOND_P1, FALLBACK_SECOND_P2];
  const thirdSection = page?.sections.find(
    (s) => s.id === "bhaktisiddhanta-3"
  );
  const longBioParas = thirdSection?.paragraphs ?? FALLBACK_LONG_PARAS;

  return (
    <div className="bg-background text-foreground">
      <div className="container max-w-screen-2xl py-16 md:py-24">
        {/* First section: Image on left, text on right */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
          <div className="md:col-span-2 flex justify-center md:justify-start order-2 md:order-1">
            <AnimatedSection direction="left">
              <div className="relative">
                <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-primary/35 via-primary/5 to-transparent opacity-70 blur-2xl" />
                <div className="relative rounded-3xl shadow-xl transition-transform duration-300 hover:scale-105">
                  <Image
                    src="/Srila-Bhaktisidhanta-01.jpg"
                    alt="Srila Bhaktisiddhanta Sarasvati Thakura"
                    width={600}
                    height={800}
                    className="h-auto w-auto max-w-full rounded-xl"
                  />
                </div>
              </div>
            </AnimatedSection>
          </div>
          <div className="md:col-span-3 prose prose-lg max-w-none text-foreground/80 space-y-6 order-1 md:order-2">
            <AnimatedSection direction="right" delay={150}>
              <div>
                <h1 className="text-3xl md:text-4xl font-headline font-bold text-foreground mb-6">
                  {heroTitle}
                </h1>
                <p>{firstIntro}</p>
              </div>
            </AnimatedSection>
          </div>
        </div>

        {/* Second section: Image on right, text on left */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mt-12 items-center">
          <div className="md:col-span-3 prose prose-lg max-w-none text-foreground/80 space-y-6">
            <AnimatedSection direction="left">
              <div>
                {secondParas.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
            </AnimatedSection>
          </div>
          <div className="md:col-span-2 flex justify-center md:justify-end">
            <AnimatedSection direction="right" delay={150}>
              <div className="relative">
                <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-primary/35 via-primary/5 to-transparent opacity-70 blur-2xl" />
                <div className="relative rounded-3xl shadow-xl transition-transform duration-300 hover:scale-105">
                  <Image
                    src="/Srila-Bhaktisidhanta-02.jpg"
                    alt="Srila Bhaktisiddhanta Sarasvati Thakura"
                    width={600}
                    height={800}
                    className="h-auto w-auto max-w-full rounded-xl"
                  />
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
        <div className="mt-12">
          <AnimatedSection direction="up" delay={250} rootMargin="0px 0px 200px 0px" threshold={0.01}>
            <div
              className="prose prose-lg max-w-none text-foreground/80 space-y-6"
              style={{ textAlign: 'justify' }}
            >
              {longBioParas.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>
    </div >
  );
}
