import {Injectable, EventEmitter} from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {Language, LanPair, Step, Level, DependableOptions} from '../models/course.model';
import {WordPairDetail} from '../models/word.model';
import {Observable} from 'rxjs/Observable';
import {Translation, Dependables} from '../models/course.model';
import {retry, delay, map} from 'rxjs/operators';

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
    private http: HttpClient
  ) {}

  fetchDependables(options: DependableOptions): Observable<Dependables> {
    let params = this.objToSearchParams(options);
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
    translations.forEach(translation => {
      text[translation.key] = translation.txt;
    });
    return text;
  }

  insertKey(el: any, key: string) {
    // Inserts letter from virtual keyboard the current field
    el.focus();
    // Set new value
    const start: number = el.selectionStart,
          end: number = el.selectionEnd,
          value: string = el.value,
          left = value.substring(0, start),
          right = value.substr(end, value.length - end),
          newValue = left + key + right,
          newPosition = left.length + key.length;
    el.value = newValue;
    // Set new cursor position
    el.selectionStart = newPosition;
    el.selectionEnd = newPosition;
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

  /*** Events ***/

  countDownFinished() {
    this.countDownFinishedEvent.emit();
  }

}
