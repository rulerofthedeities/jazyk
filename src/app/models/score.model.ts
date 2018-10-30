import { LanPair } from './main.model';

export interface SingleBookScore {
  bookId: string;
  bookTitle: string;
  lan: LanPair;
  points: number;
  isFinished?: boolean;
}

export interface BookScore {
  scores: SingleBookScore[];
  total: number;
}
