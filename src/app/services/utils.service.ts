import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { Language, DependableOptions } from '../models/main.model';
import { appTitle } from './shared.service';
import { Observable } from 'rxjs';
import { Translation, Dependables } from '../models/main.model';
import { retry } from 'rxjs/operators';

@Injectable()
export class UtilsService {
  private _rankScores = [
    0,
    500,
    5000,
    30000,
    120000,
    360000,
    720000,
    1300000,
    2100000,
    3300000,
    5000000,
    7500000,
    11200000,
    15500000,
    22000000,
    31000000,
    46000000,
    70000000,
    111000000,
    200000000,
    400000000
  ];
  countDownFinishedEvent = new EventEmitter();

  constructor(
    private http: HttpClient,
    private titleService: Title
  ) {}

  fetchDependables(options: DependableOptions): Observable<Dependables> {
    const params = this.objToSearchParams(options);
    return this.http
    .get<Dependables>('/api/dependables/', {params})
    .pipe(retry(3));
  }

  private objToSearchParams(obj: Object): HttpParams {
    let params = new HttpParams();
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        params = params.set(key, obj[key]);
      }
    }
    return params;
  }

  fetchTranslations(lan: string, component: string): Observable<Translation[]> {
    return this.http
    .get<Translation[]>('/api/translations/' + lan + '/' + component)
    .pipe(retry(3));
  }

  getTranslation(translations: Translation[], key: string): string {
    const translation = translations.find( translationItem => translationItem.key === key);
    let txt = '';
    if (translation) {
      txt = translation.txt;
    }
    return txt;
  }

  getTranslatedText(translations: Translation[]): Object {
    const text = {};
    if (translations) {
      translations.forEach(translation => {
        text[translation.key] = translation.txt;
      });
    }
    return text;
  }

  getRank(score: number): number {
    let i;
    for (i = 0; i < this._rankScores.length && score >= this._rankScores[i]; i++) {}
    return i - 1;
  }

  get rankScores(): number[] {
    return this._rankScores;
  }

  getAllLanguage(): Language {
    return {
      code: 'eu',
      name: 'AllLanguages',
      nativeName: '',
      interface: true,
      active: true,
      article: false
    };
  }

  setPageTitle(text: Object, pageName: string, isBuild = false) {
    const separator = ' - ' + (isBuild ? '*' : '');
    let pageTitle = text ? text[pageName] : pageName;
    pageTitle = pageTitle ? separator + pageTitle : '';
    this.titleService.setTitle(appTitle + pageTitle);
  }

  getWordTypes(): string[] {
    return [
      'noun',
      'noungroup',
      'adjective',
      'adverb',
      'verb',
      'conjunction',
      'preposition',
      'interjection',
      'pronoun',
      'propernoun',
      'numeral',
      'particle',
      'determiner',
      'phrase',
      'abbreviation',
      'wordpart',
      'article'
    ];
  }

  /*** Events ***/

  countDownFinished() {
    this.countDownFinishedEvent.emit();
  }
}
