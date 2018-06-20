import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {ExerciseBase} from './exercise-base.component';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Exercise} from '../../models/exercise.model';

@Component({
  selector: 'km-build-comparison',
  templateUrl: 'exercise-comparison.component.html',
  styleUrls: ['exercise-wrapper.css']
})

export class BuildComparisonComponent extends ExerciseBase implements OnInit, OnDestroy {

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
      foreignWord: [words[0], [Validators.required]],
      foreignComparative: [words[1], [Validators.required]],
      foreignSuperlative: [words[2], [Validators.required]]
    });
    this.isFormReady = true;
  }

  protected buildExistingExercise(formValues: any) {
    const exercise: Exercise = this.currentExercise,
          words = formValues['foreignWord'].replace(/\|/g, '') + '|'
                  + formValues['foreignComparative'].replace(/\|/g, '') + '|'
                  + formValues['foreignSuperlative'].replace(/\|/g, '');
    exercise.local.word = formValues['localWord'];
    exercise.foreign.word = words;
    this.saveUpdatedExercise(exercise);
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
