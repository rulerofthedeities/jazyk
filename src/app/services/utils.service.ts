import {Language} from '../models/course.model';

export class UtilsService {

  getActiveLanguages() {
    const languages = this.getLanguages();
    return languages.filter(language => language.active);
  }

  private getLanguages() {
    const languages: Language[] = [
      {
        _id: 'en-us',
        name: 'Amerikaans Engels',
        active: true
      },
      {
        _id: 'en-gb',
        name: 'Brits Engels',
        active: true
      },
      {
        _id: 'de-de',
        name: 'Duits',
        active: false
      },
      {
        _id: 'fr-fr',
        name: 'Frans',
        active: true
      },
      {
        _id: 'cs-cz',
        name: 'Tsjechisch',
        active: true
      }
    ];

    return languages;
  }
}
