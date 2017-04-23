import {Language, LanPair} from '../models/course.model';
import {WordPairDetail, ExerciseType, ExerciseDirection} from '../models/exercise.model';

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

  getExerciseTypes(word: WordPairDetail, lan: LanPair): ExerciseType[] {
    const tpes: ExerciseType[] = [],
          lanFrom = lan.from.slice(-2),
          lanTo = lan.to.slice(-2);
    console.log(lan, word.wordPair);
    tpes.push(this.getExerciseType(10));
    tpes.push(this.getExerciseType(11));
    tpes.push(this.getExerciseType(12));
    tpes.push(this.getExerciseType(13));
    if (word.wordPair[lanFrom].wordCount > 2) {
      tpes.push(this.getExerciseType(20));
      tpes.push(this.getExerciseType(21));
    }
    if (word[lanFrom]) {
      if (word[lanFrom].images && word[lanFrom].images.length > 0) {
        tpes.push(this.getExerciseType(30));
        tpes.push(this.getExerciseType(31));
      }
      if (word[lanFrom].audio && word[lanFrom].audio.length > 0) {
        tpes.push(this.getExerciseType(40));
        tpes.push(this.getExerciseType(41));
      }
      if (word[lanFrom].conjugation && word[lanFrom].conjugation.singular.length > 2 && word[lanFrom].conjugation.plural.length > 2 &&
        word[lanTo].conjugation && word[lanTo].conjugation.singular.length > 2 && word[lanTo].conjugation.plural.length > 2) {
        tpes.push(this.getExerciseType(50));
      }
      if (word[lanFrom].comparative && word[lanFrom].superlative &&
        word[lanTo].comparative && word[lanTo].superlative) {
        tpes.push(this.getExerciseType(51));
      }
      if (word[lanFrom].diminutive && word[lanTo].diminutive) {
        tpes.push(this.getExerciseType(52));
      }
    }
    return tpes;
  }

  private getExerciseType(nr: number): ExerciseType {
    return this.getAllExerciseTypes().filter(tpe => tpe.nr === nr)[0];
  }

  private getAllExerciseTypes(): ExerciseType[] {
    const tpes: ExerciseType[] = [];

    tpes.push({
      nr: 10,
      label: 'Toon Woord - Voer woord in',
      direction: ExerciseDirection.fromNl,
      isDefault: true
    });
    tpes.push({
      nr: 11,
      label: 'Toon Woord - Voer woord in',
      direction: ExerciseDirection.toNl,
      isDefault: true
    });
    tpes.push({
      nr: 12,
      label: 'Toon Woord - Selecteer woord',
      direction: ExerciseDirection.fromNl,
      isDefault: true
    });
    tpes.push({
      nr: 13,
      label: 'Toon Woord - Selecteer woord',
      direction: ExerciseDirection.toNl,
      isDefault: true
    });
    tpes.push({
      nr: 20,
      label: 'Toon zin - Selecteer woorden',
      direction: ExerciseDirection.fromNl,
      isDefault: true
    });
    tpes.push({
      nr: 21,
      label: 'Toon zin - Vul woord in',
      direction: ExerciseDirection.fromNl,
      isDefault: true
    });
    tpes.push({
      nr: 30,
      label: 'Toon foto - Voer woord in',
      direction: ExerciseDirection.fromNl,
      isDefault: false
    });
    tpes.push({
      nr: 31,
      label: 'Toon foto - Selecteer woord',
      direction: ExerciseDirection.fromNl,
      isDefault: false
    });
    tpes.push({
      nr: 40,
      label: 'Speel audio - Voer woord in',
      direction: ExerciseDirection.same,
      isDefault: true
    });
    tpes.push({
      nr: 41,
      label: 'Toon woord - selecteer audio',
      direction: ExerciseDirection.same,
      isDefault: false
    });
    tpes.push({
      nr: 50,
      label: 'Vervoegingen',
      direction: ExerciseDirection.fromNl,
      isDefault: false
    });
    tpes.push({
      nr: 51,
      label: 'Trappen van vergelijking',
      direction: ExerciseDirection.fromNl,
      isDefault: false
    });
    tpes.push({
      nr: 52,
      label: 'Voer woord + verkleinwoord in',
      direction: ExerciseDirection.fromNl,
      isDefault: false
    });

    return tpes;
  }
}
