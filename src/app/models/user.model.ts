export interface UserApp {
  learnLan: string;
  courses?: string[];
}

export interface User {
  _id?: string;
  email: string;
  password: string;
  userName: string;
  lan: string;
  jazyk?: UserApp;
  grammator?: UserApp;
  vocabulator?: UserApp;
}
