import {Injectable, EventEmitter} from '@angular/core';
import {Http, Headers} from '@angular/http';
import {Language, LanPair} from '../models/course.model';
import {WordPairDetail} from '../models/word.model';
import {Observable} from 'rxjs/Observable';
import {Translation} from '../models/course.model';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

@Injectable()
export class UtilsService {
  countDownFinishedEvent = new EventEmitter();

  constructor(
    private http: Http
  ) {}

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

  getDefaultLanguage(): string {
    const languages = this.getActiveLanguages();
    let lan = '';
    if (languages.length > 0) {
      lan = languages[0]._id;
    }
    return lan;
  }

  getActiveLanguages() {
    const languages = this.getLanguages();
    return languages.filter(language => language.active);
  }

  private getLanguages() {
    const languages: Language[] = [
      {
        _id: 'en',
        name: 'EN',
        active: true
      },
      {
        _id: 'de',
        name: 'DE',
        active: false
      },
      {
        _id: 'fr',
        name: 'FR',
        active: true
      },
      {
        _id: 'cs',
        name: 'CS',
        active: true
      }
    ];

    return languages;
  }

  getWordTypes(): string[] {
    return [
      'noun',
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
      'wordpart'
    ];
  }

  // Events

  countDownFinished() {
    this.countDownFinishedEvent.emit();
  }
}
