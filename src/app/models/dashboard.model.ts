import {Course} from './course.model';
import {Message, Notification} from './user.model';

interface Learning {
  subscribed: number;
  unsubscribed: number;
  total: number;
}

export interface SummaryData {
  score: number;
  coursesLearning: Learning;
}

export interface CommunicationData {
  messages: Message[];
  notifications: Notification[];
}

export interface RecentCourse {
  dt: Date;
  course: Course;
}