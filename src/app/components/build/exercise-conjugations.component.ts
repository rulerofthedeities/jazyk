import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {ExerciseBase} from './exercise-base.component';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {ValidationService} from '../../services/validation.service';
import {Exercise, ExerciseType} from '../../models/exercise.model';

@Component({
  selector: 'km-build-conjugations',
  templateUrl: 'exercise-conjugations.component.html',
  styleUrls: ['exercise-wrapper.css']
})

export class BuildConjugationsComponent extends ExerciseBase implements OnInit, OnDestroy {
  pronouns: string[];
  conjugations: string[];

  constructor(
    protected buildService: BuildService,
    protected errorService: ErrorService,
    protected formBuilder: FormBuilder
  ) {
    super(buildService, errorService, formBuilder);
  }

  ngOnInit() {
    super.init();
  }

  protected buildForm(exercise: Exercise) {
    const words = exercise.foreign.word.split('|'),
          // alts = exercise.foreign.alt.split('|'),
          defaultInstruction = exercise.local.info || this.text['instructionConjugations'].replace('%s', words[0]);
    // this.mergeAlts(words, alts);
    this.pronouns = this.configs.foreign.subjectPronouns;
    this.conjugations = this.buildConjugationFormControlNames();
    this.exerciseForm = this.formBuilder.group({
      localRegion: [this.formData.localRegions[0] || this.languagePair.from],
      foreignRegion: [this.formData.foreignRegions[0] || this.languagePair.to],
      localWord: [exercise.local.word, [Validators.required]], // infinitive local
      foreignWord: [words[0], [Validators.required]], // infinitive foreign
      conjugation1: [words[1], [Validators.required]],
      conjugation2: [words[2], [Validators.required]],
      conjugation3: [words[3], [Validators.required]],
      conjugation4: [words[4], [Validators.required]],
      conjugation5: [words[5], [Validators.required]],
      conjugation6: [words[6], [Validators.required]],
      instructions: [defaultInstruction]
    });
    this.isFormReady = true;
  }

  protected buildExistingExercise(formValues: any) {
    const exercise: Exercise = this.currentExercise;
    let words = formValues['foreignWord'].replace(/\|/g, '');
    for (let i = 1; i < 7; i++) {
      words += '|' + formValues['conjugation' + i].replace(/\|/g, '');
    }
    exercise.local.info = formValues['instructions'];
    exercise.local.word = formValues['localWord'];
    exercise.foreign.word = words;
    this.saveUpdatedExercise(exercise);
  }
/*
  private mergeAlts(words: string[], alts: string[]) {
    alts.forEach((alt, i) => {
      if (alt) {
        words[i + 1] += ';' + alt;
      }
    });
  }
*/
  private buildConjugationFormControlNames(): string[] {
    const conjugations: string[] = [];
    for (let i = 1; i < 7; i++) {
      conjugations.push('conjugation' + i);
    }
    return conjugations;
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
