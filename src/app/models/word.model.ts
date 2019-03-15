export interface Word {
  _id: string;
  bookId: string;
  lanCode: string;
  word: string;
  root?: string;
  region: string;
  wordType: string;
  genus: string;
  article: string;
  audio: File[];
  pinned?: boolean;
}

export interface UserWord {
  bookId: string;
  userId: string;
  wordId: string;
  lanCode: string;
  pinned: boolean;
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
  translation: string;
  definition: string;
  lanCode: string;
  source: string;
}

export interface WordTranslations {
  lanCode: string;
  word: string;
  translations: WordTranslation[];
}

