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
    const words = exercise.foreign.word.split('|');
    this.exerciseForm = this.formBuilder.group({
      localRegion: [this.formData.localRegions[0] || this.languagePair.from],
      foreignRegion: [this.formData.foreignRegions[0] || this.languagePair.to],
      localWord: [exercise.local.word, [Validators.required]],
      conjugation0: [words[0], [Validators.required]],
      conjugation1: [words[1], [Validators.required]],
      conjugation2: [words[2], [Validators.required]],
      conjugation3: [words[3], [Validators.required]],
      conjugation4: [words[4], [Validators.required]],
      conjugation5: [words[5], [Validators.required]]
    });
    this.isFormReady = true;
  }

  protected buildExistingExercise(formValues: any) {
    const exercise: Exercise = this.currentExercise;
    let words = '';
    for (let i = 0; i < 6; i++){
      words += formValues['conjugation' + i];
      if (i < 5) {
        words += '|';
      }
    }
    exercise.local.word = formValues['localWord'];
    exercise.foreign.word = words;
    this.saveUpdatedExercise(exercise);
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
