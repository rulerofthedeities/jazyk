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
