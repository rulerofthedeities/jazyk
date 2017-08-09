export interface UserApp {
  learnLan: string;
  courses?: string[];
}

export interface User {
  email: string;
  password: string;
  userName: string;
  lan: string;
  jazyk?: UserApp;
  grammator?: UserApp;
  vocabulator?: UserApp;
}
