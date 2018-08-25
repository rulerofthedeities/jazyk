import {LanPair} from './course.model';

export interface SingleCourseScore {
  course: string;
  lan: LanPair;
  points: number;
}
export interface SingleBookScore {
  book: string;
  lan: LanPair;
  points: number;
}

export interface CourseScore {
  scores: SingleCourseScore[];
  total: number;
}

export interface BookScore {
  scores: SingleBookScore[];
  total: number;
}
