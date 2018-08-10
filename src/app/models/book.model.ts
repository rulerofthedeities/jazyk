interface Difficulty {
  bookId: string;
  nrOfSentences: number;
  nrOfUniqueWords: number;
  nrOfWords: number;
  totalScore: number;
  avgLengthScore: number;
  avgWordScore: number;
  avgLength: number;
  weight: number;
}

export interface Book {
  _id: string;
  title: string;
  source: string;
  category: string;
  lanCode: string;
  author: string;
  year: number;
  img: string;
  difficulty: Difficulty;
  isPublished: boolean;
}

interface Sentence {
  text: string;
  isNewParagraph?: boolean;
}

export interface Chapter {
  _id: string;
  bookId: string;
  title: string;
  level: number;
  sequence: number;
  content: string;
  nrOfWords: number;
  nrOfUniqueWords: number;
  totalScore: number;
  chapterNr?: string;
  sentences: Sentence[];
}
