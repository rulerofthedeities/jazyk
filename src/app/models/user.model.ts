export interface UserApp {
  learnLan: string;
}

export interface LearnSettings {
  lan: string;
  nrOfWordsStudy: number;
  nrOfWordsLearn: number;
  nrOfWordsReview: number;
  countdown: boolean;
  mute: boolean;
  color: boolean;
  delay: number; // # of seconds before local word appears
  keyboard: boolean;
}

export interface Profile {
  realName: string;
  timeZone: string;
  location: string;
  bio: string;
  nativeLan: string;
}

export interface JazykConfig {
  courses?: string[];
  learn: LearnSettings;
  profile: Profile;
}

export interface User {
  _id?: string;
  email: string;
  password?: string;
  userName: string;
  lan: string;
  jazyk?: JazykConfig;
  grammator?: UserApp;
  vocabulator?: UserApp;
}
