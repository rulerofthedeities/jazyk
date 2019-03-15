export enum AccessLevel { None, Reader, Author, Editor, Manager, Owner }

export interface Map<T> {
  [K: string]: T;
}

export interface Language {
  name: string;
  nativeName: string;
  code: string;
  interface: boolean;
  active: boolean;
  article: boolean;
  articles?: string[];
  regions?: string[];
  count?: number;
  omegaLanId?: string;
}

export interface LanPair {
  from: string;
  to: string;
}

export interface RegionAudio {
  s3: string;
  region?: string;
}

export interface UserAccess {
  userId: string;
  level: number;
}

export interface Translation {
  key: string;
  txt: string;
}

export interface LicenseUrl {
  license: string;
  url: string;
}

export interface Dependables {
  translations: Translation[];
  languages: Language[]; // interface languages
  userLanguages: Language[]; // my languages
  bookLanguages: Language[];
  licenseUrls: LicenseUrl[];
  invalidNames: string;
}

export interface DependableOptions {
  lan?: string;
  component?: string;
  getTranslations?: boolean;
  getLanguages?: boolean;
  getLicenses?: boolean;
  getInvalidNames?: boolean;
}

export interface Option {
  label: string;
  value: string;
}
