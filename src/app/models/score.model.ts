import { LanPair } from './main.model';

export interface SingleBookScore {
  book: string;
  lan: LanPair;
  points: number;
}

export interface BookScore {
  scores: SingleBookScore[];
  total: number;
}
