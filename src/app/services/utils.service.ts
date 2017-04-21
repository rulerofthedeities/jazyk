import {Language, LanPair} from '../models/course.model';
import {Exercise, ExerciseType, ExerciseDirection} from '../models/exercise.model';

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

  getExerciseTypes(exercise: Exercise, lan: LanPair): ExerciseType[] {
    const tpes: ExerciseType[] = [];

    tpes.push(this.getExerciseType(10));
    tpes.push(this.getExerciseType(11));
    tpes.push(this.getExerciseType(12));
    tpes.push(this.getExerciseType(13));


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
      direction: ExerciseDirection.fromNl
    });
    tpes.push({
      nr: 11,
      label: 'Toon Woord - Voer woord in',
      direction: ExerciseDirection.toNl
    });
    tpes.push({
      nr: 12,
      label: 'Toon Woord - Selecteer woord',
      direction: ExerciseDirection.fromNl
    });
    tpes.push({
      nr: 13,
      label: 'Toon Woord - Selecteer woord',
      direction: ExerciseDirection.toNl
    });
    tpes.push({
      nr: 20,
      label: 'Toon zin - Selecteer woorden',
      direction: ExerciseDirection.fromNl
    });
    tpes.push({
      nr: 21,
      label: 'Toon zin - Vul woord in',
      direction: ExerciseDirection.fromNl
    });
    tpes.push({
      nr: 30,
      label: 'Toon foto - Voer woord in',
      direction: ExerciseDirection.fromNl
    });
    tpes.push({
      nr: 31,
      label: 'Toon foto - Selecteer woord',
      direction: ExerciseDirection.fromNl
    });
    tpes.push({
      nr: 40,
      label: 'Speel audio - Voer woord in',
      direction: ExerciseDirection.same
    });
    tpes.push({
      nr: 41,
      label: 'Toon woord - selecteer audio',
      direction: ExerciseDirection.same
    });
    tpes.push({
      nr: 50,
      label: 'Vervoegingen',
      direction: ExerciseDirection.fromNl
    });
    tpes.push({
      nr: 51,
      label: 'Trappen van vergelijking',
      direction: ExerciseDirection.fromNl
    });
    tpes.push({
      nr: 52,
      label: 'Voer woord + verkleinwoord in',
      direction: ExerciseDirection.fromNl
    });

    return tpes;
  }
}
