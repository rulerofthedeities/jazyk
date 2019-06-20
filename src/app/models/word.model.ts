export interface Word {
  _id: string;
  bookId: string;
  lanCode: string;
  word: string;
  sortWord: string;
  root?: string;
  region: string;
  wordType: string;
  genus: string;
  article: string;
  audio: File[];
  score?: number;
  pinned?: boolean;
  expanded?: boolean;
  targetLanCode?: string;
  translationSummary?: string;
  dictionaryLetter?: string;
}

export interface UserWord {
  bookId: string;
  userId: string;
  wordId: string;
  bookLanCode: string;
  targetLanCode: string;
  pinned: boolean;
  translations: string;
}

export interface FlashCard {
  wordId: string;
  word: string;
  wordType: string;
  genus: string;
  article: string;
  audio: File[];
  translations: string;
  score: number;
}

export interface FlashCardResult extends FlashCard {
  points: number;
  answers: string;
}

export interface AnswerData {
  answers: string;
  points: number;
}

export interface UserWordData {
  bookId: string;
  countTotal: number;
  countTranslation: number;
}

interface File {
  fileName: string;
  hasMp3: boolean;
  s3: string;
}

export interface WordDefinition {
  omega?: string;
}

export interface OmegaDefinition {
  dmid: string;
  lanId: string;
  definitionLanId?: string;
  definitionTranslation?: string;
  definitionText?: string;
}

export interface OmegaDefinitions {
  source: string;
  word: string;
  omegaWord: string;
  omegaDefinitions: OmegaDefinition[];
}

export interface WordTranslation {
  _id?: string;
  translation: string;
  definition: string;
  lanCode: string;
  source: string;
  userId?: string;
}

export interface WordTranslations {
  _id?: string;
  lanCode: string;
  word: string;
  translations: WordTranslation[];
  summary?: string;
  dictionaryLetter?: string;
}

interface OmegaTranslationDefinition {
  spelling: string;
  langid: string;
  lang: string;
  text: string;
}

interface OmegaTranslationSyntrans {
  dmid: number;
  lang: number;
}

export interface OmegaTranslation {
  definition: OmegaTranslationDefinition;
  dmid: number;
  lang: string;
  langid: number;
  spelling: string;
  syntrans: OmegaTranslationSyntrans;
}
