import type { Lang } from "@/lib/types";

export interface AboutContent {
  eyebrow: string;
  title: string;
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
  /** Closing paragraph, set apart from the rest. */
  closing: string;
  factsTitle: string;
  facts: { label: string; value: string }[];
}

/** Personal text of the About page, in both languages. Edit here. */
export const about: Record<Lang, AboutContent> = {
  en: {
    eyebrow: "About",
    title: "Hi, I'm Salvatore.",
    intro:
      "I'm a die-hard gamer, and I've loved nerd culture since I was a kid.",
    sections: [
      {
        heading: "Where it all started",
        paragraphs: [
          "My mother introduced me to PC gaming through classics like Warcraft and Age of Empires. As far as I remember, my favourite game was an MS-DOS title called Jurassic War, and we would spend entire evenings playing it together.",
          "As you can guess, she loved RTS games, and she passed that passion on to me. It grew into a love for the whole world of video games, in all its forms.",
        ],
      },
      {
        heading: "Why this place exists",
        paragraphs: [
          "Today I love practically every video game there is. Having played more than 1,500 titles in my life, I decided to open this personal space where I give my take and tell the blunt truth about every single title, free of any influence.",
        ],
      },
      {
        heading: "From consoles to the PC",
        paragraphs: [
          "Over the years I've owned every Nintendo console and every PlayStation up to the 3. After the PS3 I went all-in on PC gaming, with the dream of becoming a competitive player.",
          "I've played many competitive titles and I've always been in the high ranks. Among my favourites, the ones that made my “story”, are definitely World of Warcraft, Hearthstone, League of Legends and Rainbow Six: Siege.",
        ],
      },
    ],
    closing:
      "Today, gaming is my escape from the harsh reality of “adults” (:D), and it's also a sweet memory of my mother, who is no longer with us. Going back to the games that made my childhood takes me back to when I was a kid, having fun with her.",
    factsTitle: "At a glance",
    facts: [
      { label: "Games played", value: "1,500+" },
      { label: "Childhood favourite", value: "Jurassic War (MS-DOS)" },
      { label: "Consoles owned", value: "Every Nintendo, every PlayStation up to the 3" },
      { label: "Then", value: "PC gaming, aiming at competitive play" },
      { label: "Games that made my story", value: "World of Warcraft, Hearthstone, League of Legends, Rainbow Six: Siege" },
    ],
  },
  it: {
    eyebrow: "Chi sono",
    title: "Ciao, sono Salvatore.",
    intro:
      "Sono un gamer incallito e un amante della cultura nerd sin da quando ero bambino.",
    sections: [
      {
        heading: "Da dove tutto è iniziato",
        paragraphs: [
          "Mia madre mi introdusse al PC gaming attraverso giochi storici come Warcraft e Age of Empires. Che io ricordi, il mio gioco preferito era un titolo per MS-DOS chiamato Jurassic War: passavamo serate intere a giocarci insieme.",
          "Come si può intuire, lei era un'amante dei giochi RTS e ha trasmesso a me questa passione. Una passione che poi si è evoluta, portandomi ad abbracciare il mondo videoludico a 360°.",
        ],
      },
      {
        heading: "Perché esiste questo spazio",
        paragraphs: [
          "Oggi sono un amante di praticamente tutti i videogiochi esistenti. Avendo giocato più di 1500 titoli in tutta la mia vita, ho pensato di aprire questo spazio personale dove dico la mia e racconto la cruda verità su ogni singolo titolo, senza alcuna influenza.",
        ],
      },
      {
        heading: "Dalle console al PC",
        paragraphs: [
          "Nella mia vita sono stato possessore di tutte le console Nintendo e di tutte le PlayStation fino alla 3. Dopo la 3 mi sono dedicato completamente al PC gaming, con il sogno di diventare un giocatore competitivo.",
          "Ho giocato a molti titoli competitivi, nei quali sono sempre stato nei ranghi alti. Fra i miei preferiti, quelli che hanno fatto la mia “storia”, ci sono sicuramente World of Warcraft, Hearthstone, League of Legends e Rainbow Six: Siege.",
        ],
      },
    ],
    closing:
      "Oggi il gaming è la mia via di fuga dalla dura realtà degli “adulti” (:D) ed è anche un dolce ricordo di mia madre, che non c'è più. Tornare su quei titoli che hanno fatto la mia infanzia mi riporta a quando ero bambino e mi divertivo con lei.",
    factsTitle: "In breve",
    facts: [
      { label: "Giochi giocati", value: "Più di 1500" },
      { label: "Il preferito dell'infanzia", value: "Jurassic War (MS-DOS)" },
      { label: "Console possedute", value: "Tutte le Nintendo, tutte le PlayStation fino alla 3" },
      { label: "Poi", value: "PC gaming, con il sogno del competitivo" },
      { label: "I giochi che hanno fatto la mia storia", value: "World of Warcraft, Hearthstone, League of Legends, Rainbow Six: Siege" },
    ],
  },
};
