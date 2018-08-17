export interface UserApp {
  learnLan: string;
}

export interface MainSettings {
  lan: string; // Interface lan
  myLan: string; // User lan
  background: boolean;
  gender: string;
}

export interface LearnSettings {
  lan: string;
  nrOfWordsStudy: number;
  nrOfWordsLearn: number;
  nrOfWordsReview: number;
  nrOfWordsStudyRepeat: number;
  nrOfWordsLearnRepeat: number;
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

export interface PublicProfile {
  profile: Profile;
  courses: string[];
  userName: string;
  dtJoined: Date;
  emailHash: string;
  _id: string;
}

export interface CompactProfile {
  _id: string;
  userName?: string;
  emailHash?: string;
  isFollower?: boolean;
  isFollow?: boolean;
  userOnly?: boolean; // show only user name and icon
  loadData?: boolean; // load profile data in the profile
}

interface AppDates {
  joined?: Date;
  lastLogin?: Date;
}

export interface JazykConfig {
  courses?: string[];
  learn: LearnSettings;
  profile: Profile;
  dt: AppDates;
}

export interface User {
  _id?: string;
  email: string;
  emailHash: string;
  password?: string;
  userName: string;
  main: MainSettings;
  jazyk?: JazykConfig;
  grammator?: UserApp;
  vocabulator?: UserApp;
}

export interface Notification {
  _id?: string;
  userId: string;
  title: string;
  message: string;
  read?: boolean;
  dt?: Date;
}

interface MessageUser {
  id: string;
  userName: string;
  emailHash?: string;
  read?: boolean;
  trash?: boolean;
  deleted?: boolean;
}

export interface Message {
  _id?: string;
  sender: MessageUser;
  recipient: MessageUser;
  message: string;
  parentId?: string;
  dt?: Date;
}

export interface Follower {
  followId: string;
}

export interface Followed {
  userId: string;
}

export interface Network {
  follows: Follower[];
  followed: Followed[];
}
