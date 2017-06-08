export class Error {
  constructor(
    public title: string,
    public message: string,
    public details: string
  ) {}
}

export interface UserError {
  code: string;
  src: any;
  msg?: string;
  module?: string;
}

