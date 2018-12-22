export interface UserApp {
  learnLan: string;
}

export interface MainSettings {
  lan: string; // Interface lan
  myLan: string; // User lan
  background: boolean;
  gender: string;
}

export interface ReadSettings {
  lan: string;
  countdown: boolean;
  delay: number; // countdown
}

export interface AppSettings {
  main: MainSettings;
  read: ReadSettings;
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
  userName: string;
  dtJoined: Date;
  emailHash: string;
  _id: string;
}

export interface CompactProfile {
  _id: string;
  userName?: string;
  emailHash?: string;
}

interface AppDates {
  joined?: Date;
  lastLogin?: Date;
}

export interface JazykConfig {
  read: ReadSettings;
  profile: Profile;
  dt: AppDates;
}

interface MailVerification {
  isVerified: boolean;
}

export interface MailOptIn {
  info: boolean;
}

export interface User {
  _id?: string;
  email: string;
  emailHash: string;
  password?: string;
  userName: string;
  main: MainSettings;
  jazyk?: JazykConfig;
  isAdmin: boolean;
  mailVerification: MailVerification;
  mailOptIn: MailOptIn;
}

export interface UserSignIn {
  email: string;
  password: string;
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

export interface Network {
  followers: string[];
  following: string[];
  buddies: string[];
  followersDetail: CompactProfile[];
  followingDetail: CompactProfile[];
  buddiesDetail: CompactProfile[];
  showFollowers: boolean;
  showFollowing: boolean;
  showBuddies: boolean;
  loadingFollowers: boolean;
  loadingFollowing: boolean;
  loadingBuddies: boolean;
}

export interface MailData {
  subject: string;
  bodyText: string;
  bodyHtml: string;
  linkText?: string;
}

export interface MailDataOptions {
  userName?: string;
  isNewUser?: boolean;
  email?: string;
  expireHours?: number;
}
