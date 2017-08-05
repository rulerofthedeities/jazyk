export interface Error {
  title: string;
  msg: string;
}

export interface UserError {
  code: string;
  src: any;
  msg?: string;
  module?: string;
}

