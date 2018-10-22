import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { EventMessage } from '../models/error.model';
import { Language, Translation, Dependables, DependableOptions } from '../models/main.model';
import { environment } from 'environments/environment';
import { Observable, Subject } from 'rxjs';
import { retry } from 'rxjs/operators';

export const appTitle = 'Jazyk';
export const awsPath = 's3.eu-central-1.amazonaws.com/jazyk/';

@Injectable()
export class SharedService {
  private eventMessages: EventMessage[] = [];
  private messageLimit = 10;
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
    125000000,
    250000000,
    500000000
  ];
  exerciseModeChanged = new Subject<boolean>();
  justLoggedInOut = new Subject<boolean>();
  eventMessage = new Subject<EventMessage>();
  audioEvent = new Subject<string>();

  constructor(
    private http: HttpClient,
    private titleService: Title
  ) {}

  private objToSearchParams(obj: Object): HttpParams {
    let params = new HttpParams();
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        params = params.set(key, obj[key]);
      }
    }
    return params;
  }

  fetchDependables(options: DependableOptions): Observable<Dependables> {
    const params = this.objToSearchParams(options);
    return this.http
    .get<Dependables>('/api/dependables/', {params})
    .pipe(retry(3));
  }

  fetchTranslations(lan: string, component: string): Observable<Translation[]> {
    return this.http
    .get<Translation[]>('/api/translations/' + lan + '/' + component)
    .pipe(retry(3));
  }

  // Cross-lazy loaded module Events
  changeExerciseMode(isStarted: boolean) {
    this.exerciseModeChanged.next(isStarted);
  }

  userJustLoggedIn() {
    this.justLoggedInOut.next(true);
  }

  userJustLoggedOut() {
    this.justLoggedInOut.next(false);
  }

  sendEventMessage(newMessage: EventMessage) {
    newMessage.dt = new Date();
    this.eventMessages.unshift(newMessage);
    this.eventMessages.slice(0, this.messageLimit);
    this.eventMessage.next(newMessage);
  }

  stopAudio() {
    this.audioEvent.next('stop');
  }

  pauseAudio() {
    this.audioEvent.next('pause');
  }

  get lastEventMessage(): string {
    return this.eventMessages[0] ? this.eventMessages[0].message : '';
  }

  get eventMessageList(): EventMessage[] {
    return this.eventMessages;
  }

  // Dev log
  log(label: string, msg: any, tpe = 'info') {
    if (!environment.production) {
      console.log(label + ':', JSON.stringify(msg, undefined, 2));
    }
  }

  setPageTitle(text: Object, pageName: string, isBuild = false) {
    const separator = ' - ' + (isBuild ? '*' : '');
    let pageTitle = text ? text[pageName] : pageName;
    pageTitle = pageTitle ? separator + pageTitle : '';
    this.titleService.setTitle(appTitle + pageTitle);
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

  getDaysBetweenDates(firstDate: Date, secondDate: Date): number {
    const oneDay = 24 * 60 * 60 * 1000, // ms in a day
          diffDays = Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay));
    return diffDays;
  }

  getRank(score: number): number {
    let i;
    for (i = 0; i < this._rankScores.length && score >= this._rankScores[i]; i++) {}
    return i - 1;
  }

  get rankScores(): number[] {
    return this._rankScores;
  }

  clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
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

  getBookDifficulty(book): {difficultyWidth: number, difficultyPerc: number} {
    let difficulty = book.difficulty.weight;
    difficulty = Math.max(10, difficulty - 240);
    difficulty = difficulty * 2.4;
    difficulty = Math.min(1000, difficulty);
    const difficultyWidth = Math.round(difficulty / 5),
          difficultyPerc = Math.round(difficulty / 10);
    return {difficultyWidth, difficultyPerc};
  }
}
