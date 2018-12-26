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

export interface Leader {
  userId: string;
  points: number;
  emailHash?: string;
  userName?: string;
  rank?: number;
  rankName?: string;
  isCurrentUser?: boolean;
  position?: number; // for current user if user not in top
}

export interface LeaderUser {
  _id: string;
  emailHash: string;
  userName: string;
}

export interface Position {
  position: number;
  points: number;
}
