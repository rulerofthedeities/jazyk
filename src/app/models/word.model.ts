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
  sequence: number;
}

interface File {
  fileName: string;
  hasMp3: boolean;
  s3: string;
}
