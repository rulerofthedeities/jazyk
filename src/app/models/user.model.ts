export interface UserApp {
  learnLan: string;
}

export interface LearnSettings {
  lan: string;
  nrOfWords: number;
  countdown: boolean;
  mute: boolean;
  color: boolean;
  delay: number; // # of seconds before local word appears
  keyboard: boolean;
}

export interface Jazyk {
  courses?: string[];
  learn: LearnSettings;
}

export interface User {
  _id?: string;
  email: string;
  password: string;
  userName: string;
  lan: string;
  jazyk?: Jazyk;
  grammator?: UserApp;
  vocabulator?: UserApp;
}
