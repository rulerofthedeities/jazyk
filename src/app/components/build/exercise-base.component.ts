import {Input, Output, EventEmitter} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {LanPair} from '../../models/course.model';
import {Exercise, ExerciseType} from '../../models/exercise.model';
import 'rxjs/add/operator/takeWhile';

export abstract class ExerciseBase {
  @Input() languagePair: LanPair;
  @Input() protected exercise: Exercise;
  @Input() text: Object;
  @Input() lessonId: string;
  @Output() addedExercises = new EventEmitter<Exercise[]>();
  @Output() updatedExercise = new EventEmitter<Exercise>();
  @Output() cancelNew = new EventEmitter<boolean>();
  @Output() cancelEdit = new EventEmitter<boolean>();
  protected componentActive = true;
  exerciseForm: FormGroup;
  currentExercise: Exercise;
  isFormReady = false;
  isSaving = false;

  constructor(
    protected buildService: BuildService,
    protected errorService: ErrorService,
    protected formBuilder: FormBuilder
  ) {}

  init() {
    if (this.exercise) {
      this.currentExercise = JSON.parse(JSON.stringify(this.exercise));
    }
    this.buildForm(this.currentExercise);
  }

  onAddNewExercise(form: any) {
    if (form.valid) {
      this.isSaving = true;
      this.buildNewExercise(form.value);
    }
  }

  onUpdateExercise(form: any) {
    if (form.valid) {
      this.isSaving = true;
      this.buildExistingExercise(form.value);
    }
  }

  onCancelNew() {
    this.cancelNew.emit(true);
  }

  onCancelEdit() {
    this.cancelEdit.emit(true);
  }

  protected buildForm(exercise: Exercise) {}

  protected buildNewExercise(formValues: any) {}

  protected buildExistingExercise(formValues: any) {}

  protected saveNewExercise(exercise: Exercise) {
    const saveExercises: Exercise[] = [];
    saveExercises.push(exercise);
    this.buildService
    .addExercises(saveExercises, this.lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      savedExercises => {
        this.isSaving = false;
        console.log('saved exercises', savedExercises);
        this.addedExercises.emit(savedExercises);
        this.exerciseForm.reset();
      },
      error => this.errorService.handleError(error)
    );
  }

  protected saveUpdatedExercise(exercise: Exercise) {
    console.log('updating exercise ', exercise);
    this.buildService
    .updateExercise(exercise, this.lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      saved => {
        this.isSaving = false;
        console.log('updated exercise ', exercise);
        this.updatedExercise.emit(exercise);
        this.currentExercise = exercise;
        this.exercise = exercise;
      },
      error => this.errorService.handleError(error)
    );
  }
}
