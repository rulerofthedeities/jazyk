import {LanPair} from './course.model';

export interface Score {
  course: string;
  lan: LanPair;
  points: number;
}

export interface CourseScore {
  scores: Score[];
  total: number;
}
