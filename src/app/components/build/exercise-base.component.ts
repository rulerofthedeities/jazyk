import {Input, Output, EventEmitter} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {LanPair, LanConfigs} from '../../models/course.model';
import {Exercise, ExerciseType} from '../../models/exercise.model';
import {takeWhile} from 'rxjs/operators';

interface FormData {
  foreignRegions?: string[];
  localRegions?: string[];
}

export abstract class ExerciseBase {
  @Input() languagePair: LanPair;
  @Input() configs: LanConfigs;
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
  exType = ExerciseType;
  formData: FormData;

  constructor(
    protected buildService: BuildService,
    protected errorService: ErrorService,
    protected formBuilder: FormBuilder
  ) {}

  init() {
    if (this.exercise) {
      this.currentExercise = JSON.parse(JSON.stringify(this.exercise));
    }
    this.formData = {
      localRegions: this.configs.local.regions,
      foreignRegions: this.configs.foreign.regions
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

  onUpdateRegion(newRegion: string, tpe: string) {
    if (this.currentExercise) {
      this.currentExercise[tpe].region = newRegion;
    } else {
      this.exerciseForm.patchValue({[tpe + 'Region']: newRegion});
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
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      savedExercises => {
        this.isSaving = false;
        this.addedExercises.emit(savedExercises);
        this.exerciseForm.reset();
      },
      error => this.errorService.handleError(error)
    );
  }

  protected saveUpdatedExercise(exercise: Exercise) {
    this.buildService
    .updateExercise(exercise, this.lessonId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      saved => {
        this.isSaving = false;
        this.updatedExercise.emit(exercise);
        this.currentExercise = exercise;
        this.exercise = exercise;
      },
      error => this.errorService.handleError(error)
    );
  }

  protected checkIfValue(field: string): string {
    // Prevent saving empty values to db
    let value = undefined;
    if (field) {
      value = field;
    }
    return value;
  }
}
