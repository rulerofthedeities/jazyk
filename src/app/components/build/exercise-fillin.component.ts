import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {ExerciseBase} from './exercise-base.component';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {ValidationService} from '../../services/validation.service';
import {Exercise, ExerciseType} from '../../models/exercise.model';

@Component({
  selector: 'km-build-fillin',
  templateUrl: 'exercise-fillin.component.html',
  styleUrls: ['exercise-wrapper.css']
})

export class BuildFillInComponent extends ExerciseBase implements OnInit, OnDestroy {

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
    if (!exercise) {
      // New FillIn
      this.exerciseForm = this.formBuilder.group({
        hint: ['', [Validators.required]],
        sentence: ['', ValidationService.checkFillInSentence]
      });
    } else {
      // Edit FillIn
      this.exerciseForm = this.formBuilder.group({
        hint: [exercise.foreign.hint, [Validators.required]],
        sentence: [exercise.foreign.word, ValidationService.checkFillInSentence]
      });
    }
    this.isFormReady = true;
  }

  protected buildNewExercise(formValues: any) {
    const exercise: Exercise = {
      foreign: {
        hint: formValues.hint,
        word: formValues.sentence},
      local: {word: ''},
      tpe: ExerciseType.FillIn,
      difficulty: 0
    };
    console.log('exercise', exercise);
    this.saveNewExercise(exercise);
  }

  protected buildExistingExercise(formValues: any) {
    const exercise: Exercise = this.currentExercise;
    exercise.foreign.hint = this.exerciseForm.value['hint'];
    exercise.foreign.word = this.exerciseForm.value['sentence'];
    console.log('updating', exercise);
    this.saveUpdatedExercise(exercise);
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
