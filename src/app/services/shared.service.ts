import { Injectable, Optional, Inject, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { EventMessage } from '../models/error.model';
import { Book } from '../models/book.model';
import { Translation, Dependables, DependableOptions } from '../models/main.model';
import { environment } from '../../environments/environment';
import { Observable, Subject } from 'rxjs';
import { retry } from 'rxjs/operators';

export const appTitle = 'Jazyk';
export const awsPath = 'jazyk.s3.eu-central-1.amazonaws.com/';

@Injectable()
export class SharedService {
  private eventMessages: EventMessage[] = [];
  private messageLimit = 10;
  private _hostName = '';
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
  announcementModeChanged = new Subject<boolean>();
  justLoggedInOut = new Subject<boolean>();
  eventMessage = new Subject<EventMessage>();
  audioEvent = new Subject<string>();
  scoreChanged = new Subject<number>();
  audioEnded = new Subject<boolean>();

  constructor(
    private http: HttpClient,
    private titleService: Title,
    @Optional() @Inject('ORIGIN_URL') private originUrl: string
  ) {
    this._hostName = this.originUrl || '';
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

  /*** Audio ***/

  audioHasEnded(ended: boolean) {
    this.audioEnded.next(ended);
  }

  fetchDependables(options: DependableOptions): Observable<Dependables> {
    const params = this.objToSearchParams(options);
    return this.http
    .get<Dependables>(this._hostName + '/api/dependables', {params})
    .pipe(retry(3));
  }

  fetchTranslations(lan: string, component: string): Observable<Translation[]> {
    return this.http
    .get<Translation[]>(this._hostName + '/api/translations/' + lan + '/' + component)
    .pipe(retry(3));
  }

  // Cross-lazy loaded module Events
  changeExerciseMode(isStarted: boolean) {
    this.exerciseModeChanged.next(isStarted);
  }

  closeAnnouncement() {
    this.announcementModeChanged.next(false);
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

  onScoreChanged(newScore: number) {
    this.scoreChanged.next(newScore);
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
    let i: number;
    for (i = 0; i < this._rankScores.length && score >= this._rankScores[i]; i++) {}
    return i - 1;
  }

  getNextRank(rank: number): number {
    if (rank < this._rankScores.length - 1) {
      return rank + 1;
    } else {
      return null;
    }
  }

  getPointsToGo(score: number, nextRank: number): number {
    return this._rankScores[nextRank] - score;
  }

  get rankScores(): number[] {
    return this._rankScores;
  }

  clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }

  shuffleArray(arr: any[]): any[] {
    // Fisher-Yates (aka Knuth) Shuffle.
    let currentIndex = arr.length,
        randomIndex,
        temporaryValue;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      // And swap it with the current element.
      temporaryValue = arr[currentIndex];
      arr[currentIndex] = arr[randomIndex];
      arr[randomIndex] = temporaryValue;
    }

    return arr;
  }

  getContentLanguageCode(lanCode: string): string {
    let contentLan = lanCode;

    switch (lanCode) {
      case 'en': contentLan = 'en-us'; break;
      case 'de': contentLan = 'de-de'; break;
      case 'fr': contentLan = 'fr-fr'; break;
      case 'nl': contentLan = 'nl-nl'; break;
    }

    return contentLan;
  }

  getBookDifficulty(book: Book): {difficultyWidth: number, difficultyPerc: number} {
    let difficulty = book.difficulty.weight;
    difficulty = Math.max(10, difficulty - 210);
    difficulty = difficulty * 2.35;
    difficulty = Math.min(1000, difficulty);
    const difficultyWidth = Math.round(difficulty / 5),
          difficultyPerc = Math.round(difficulty / 10);
    return {difficultyWidth, difficultyPerc};
  }

  getPercentage(a: number, b: number): number {
    // calculates the truncated percentage
    return Math.trunc(Math.min(100, (a / b) * 100));
  }

  getCoverImagePath(book: Book) {
    if (!!book.coverImg) {
      return `https://${awsPath}books/covers/${book.lanCode}/${book.coverImg}`;
    } else {
      return '/assets/img/books/blankcover.png'; // default book cover
    }
  }

  getAudioTitle(book: Book) {
    return `https://${awsPath}audiobooks/${book.lanCode}/${book.audioDirectory}/${book.audioTitle.s3}`;
  }

  detectChanges(cdr: ChangeDetectorRef) {
    if (cdr && !cdr['destroyed']) {
      cdr.detectChanges();
    }
  }
}
