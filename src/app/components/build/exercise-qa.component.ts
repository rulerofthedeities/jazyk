import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {ExerciseBase} from './exercise-base.component';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {ValidationService} from '../../services/validation.service';
import {Exercise, ExerciseType} from '../../models/exercise.model';

@Component({
  selector: 'km-build-qa',
  templateUrl: 'exercise-qa.component.html',
  styleUrls: ['exercise-wrapper.css']
})

export class BuildQAComponent extends ExerciseBase implements OnInit, OnDestroy {

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
      // New QA
      this.exerciseForm = this.formBuilder.group({
        question: ['', [Validators.required]],
        answer: ['', ValidationService.checkQAnswer]
      });
    } else {
      // Edit QA
      this.exerciseForm = this.formBuilder.group({
        question: [exercise.foreign.hint, [Validators.required]],
        answer: [exercise.foreign.word, ValidationService.checkQAnswer]
      });
    }
    this.isFormReady = true;
  }

  protected buildNewExercise(formValues: any) {
    const exercise: Exercise = {
      foreign: {
        hint: formValues.question,
        word: formValues.answer},
      local: {word: ''},
      tpe: ExerciseType.QA,
      difficulty: 0
    };
    console.log('exercise', exercise);
    this.saveNewExercise(exercise);
  }

  protected buildExistingExercise(formValues: any) {
    const exercise: Exercise = this.currentExercise;
    exercise.foreign.hint = this.exerciseForm.value['question'];
    exercise.foreign.word = this.exerciseForm.value['answer'];
    console.log('updating', exercise);
    this.saveUpdatedExercise(exercise);
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
