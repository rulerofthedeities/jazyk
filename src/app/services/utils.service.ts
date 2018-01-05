import {Injectable, EventEmitter} from '@angular/core';
import {Http, Headers, URLSearchParams} from '@angular/http';
import {Language, LanPair, Step, Level} from '../models/course.model';
import {WordPairDetail} from '../models/word.model';
import {Observable} from 'rxjs/Observable';
import {Translation} from '../models/course.model';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

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
  private _awsPath = 's3.eu-central-1.amazonaws.com/jazyk/';
  countDownFinishedEvent = new EventEmitter();

  constructor(
    private http: Http
  ) {}

  fetchDependables(options: any) {
    const params = this.objToSearchParams(options);
    return this.http
    .get('/api/dependables/', {search: params})
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
  }

  private objToSearchParams(obj): URLSearchParams {
    const params = new URLSearchParams();
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        params.set(key, obj[key]);
      }
    }
    return params;
 }
  fetchTranslations(lan: string, component: string) {
    return this.http
    .get('/api/translations/' + lan + '/' + component)
    .map(response => response.json().obj)
    .catch(error => Observable.throw(error));
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
    translations.forEach(translation => {
      text[translation.key] = translation.txt;
    });
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

  get awsPath(): string {
    return this._awsPath;
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

  getSteps(): Step[] {
    return [
      {
        name: 'overview',
        level: Level.Lesson,
        alwaysShown: true
      },
      {
        name: 'intro',
        level: Level.Lesson,
        alwaysShown: false
      },
      {
        name: 'study',
        level: Level.Lesson,
        alwaysShown: false
      },
      {
        name: 'practise',
        level: Level.Lesson,
        alwaysShown: true
      },
      {
        name: 'exam',
        level: Level.Course,
        alwaysShown: false
      },
      {
        name: 'difficult',
        level: Level.Course,
        alwaysShown: true
      },
      {
        name: 'review',
        level: Level.Course,
        alwaysShown: true
      }
    ];
  }

  // Events

  countDownFinished() {
    this.countDownFinishedEvent.emit();
  }
}
