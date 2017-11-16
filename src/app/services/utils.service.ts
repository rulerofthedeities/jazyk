import {Injectable, EventEmitter} from '@angular/core';
import {Http, Headers} from '@angular/http';
import {Language, LanPair, Step, Level} from '../models/course.model';
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

  getActiveLanguages(): Language[] {
    const languages = this.getLanguages();
    return languages.filter(language => language.active);
  }

  getInterfaceLanguages(): Language[] {
    const languages = this.getLanguages();
    return languages.filter(language => language.interface);
  }

  private getLanguages() {
    const languages: Language[] = [
      {
        _id: 'en',
        name: 'EN',
        nativeName: 'English',
        interface: true,
        active: true
      },
      {
        _id: 'de',
        name: 'DE',
        nativeName: 'Deutsch',
        interface: false,
        active: true
      },
      {
        _id: 'fr',
        name: 'FR',
        nativeName: 'Français',
        interface: true,
        active: true
      },
      {
        _id: 'cs',
        name: 'CS',
        nativeName: 'Čeština',
        interface: false,
        active: true
      },
      {
        _id: 'nl',
        name: 'NL',
        nativeName: 'Nederlands',
        interface: true,
        active: false
      }
    ];

    return languages;
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
      'wordpart'
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
