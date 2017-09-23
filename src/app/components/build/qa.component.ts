import {Component, Input, Output, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {LanPair} from '../../models/course.model';
import {Exercise, ExerciseType} from '../../models/exercise.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-build-qa',
  templateUrl: 'qa.component.html',
  styleUrls: ['exercise-wrapper.css']
})

export class BuildQAComponent implements OnInit, OnDestroy {
  @Input() languagePair: LanPair;
  @Input() private exercise: Exercise;
  @Input() text: Object;
  @Input() lessonId: string;
  @Output() addedExercises = new EventEmitter<Exercise[]>();
  @Output() updatedExercise = new EventEmitter<Exercise>();
  @Output() cancelNew = new EventEmitter<boolean>();
  @Output() cancelEdit = new EventEmitter<boolean>();
  private componentActive = true;
  qaForm: FormGroup;
  currentExercise: Exercise;
  isFormReady = false;

  constructor(
    private buildService: BuildService,
    private errorService: ErrorService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    if (this.exercise) {
      this.currentExercise = JSON.parse(JSON.stringify(this.exercise));
    }
    this.buildForm(this.currentExercise);
  }

  onAddNewExercise(form: any) {
    if (form.valid) {
      this.buildNewExercise(form.value);
    }
  }

  onUpdateExercise(form: any) {
    if (form.valid) {
      this.buildExistingExercise(form.value);
    }
  }

  onCancelNew() {
    this.cancelNew.emit(true);
  }

  onCancelEdit() {
    this.cancelEdit.emit(true);
  }

  private buildForm(exercise: Exercise) {
    if (!exercise) {
      // New QA
      this.qaForm = this.formBuilder.group({
        question: ['', [Validators.required]],
        answer: ['']
      });
    } else {
      // Edit QA
      this.qaForm = this.formBuilder.group({
        question: [exercise.foreign.hint, [Validators.required]],
        answer: [exercise.foreign.word]
      });
    }
    this.isFormReady = true;
  }

  private buildNewExercise(formValues: any) {
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

  private buildExistingExercise(formValues: any) {
    const exercise: Exercise = this.currentExercise;
    exercise.foreign.hint = this.qaForm.value['question'];
    exercise.foreign.word = this.qaForm.value['answer'];
    console.log('updating', exercise);
    this.saveUpdatedExercise(exercise);
  }

  private saveNewExercise(exercise: Exercise) {
    const saveExercises: Exercise[] = [];
    saveExercises.push(exercise);
    this.buildService
    .addExercises(saveExercises, this.lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      savedExercises => {
        console.log('saved exercises', savedExercises);
        this.addedExercises.emit(savedExercises);
        this.qaForm.reset();
      },
      error => this.errorService.handleError(error)
    );
  }

  private saveUpdatedExercise(exercise: Exercise) {
    console.log('updating exercise ', exercise);
    this.buildService
    .updateExercise(exercise, this.lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      saved => {
        console.log('updated exercise ', exercise);
        this.updatedExercise.emit(exercise);
        this.currentExercise = exercise;
        this.exercise = exercise;
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
