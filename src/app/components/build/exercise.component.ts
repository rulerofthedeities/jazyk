import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, FormArray, FormControl, Validators} from '@angular/forms';
import {UtilsService} from '../../services/utils.service';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {WordPairDetail, WordPair, Exercise, ExerciseType, ExerciseDirection} from '../../models/exercise.model';
import {LanPair} from '../../models/course.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-build-exercise',
  templateUrl: 'exercise.component.html'
})

export class BuildExerciseComponent implements OnInit, OnDestroy {
  @Input() languagePair: LanPair;
  @Input() lessonId: string;
  @Input() nr: number;
  exerciseForm: FormGroup;
  exerciseTypes: ExerciseType[];
  componentActive = true;
  isFormReady = false;
  isNew = true;
  isSubmitted = false;
  wordPairTitle: String;
  exercise: Exercise;
  lanFrom: string;
  lanTo: string;

  constructor(
    private utilsService: UtilsService,
    private buildService: BuildService,
    private errorService: ErrorService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.lanFrom = this.languagePair.from.slice(0, 2);
    this.lanTo = this.languagePair.to.slice(0, 2);
  }

  // Entry point from filter
  newExercise(word: WordPairDetail) {
    this.setTitle(word.wordPair);
    this.getExerciseTypes(word);
    console.log('wpd', word);
    this.exercise = {
      nr: this.nr,
      lessonId: this.lessonId,
      wordPairDetailId: word._id,
      languagePair: this.lanFrom + this.lanTo,
      exerciseTypes: this.exerciseTypes,
      wordTpe: word.wordPair.wordTpe,
      [this.lanFrom]: {word: word.wordPair[this.lanFrom].word},
      [this.lanTo]: {word: word.wordPair[this.lanTo].word}
    };
    this.buildForm();
  }

  getExerciseTypes(word: WordPairDetail) {
    console.log('getting exercise types for', word);
    this.exerciseTypes = this.utilsService.getExerciseTypes(word, this.languagePair);
  }

  setTitle(wordPair: WordPair) {
    this.wordPairTitle = wordPair[this.lanFrom].word + ' / ' + wordPair[this.lanTo].word;
  }

  getExerciseTypeLabel(exerciseType: ExerciseType): string {
    let direction = '';

    switch (exerciseType.direction) {
      case ExerciseDirection.fromNl:
        direction = ' (' + this.lanFrom + ' -> ' + this.lanTo + ')';
      break;
      case ExerciseDirection.toNl:
        direction = ' (' + this.lanTo + ' -> ' + this.lanFrom + ')';
      break;
      case ExerciseDirection.same:
        ;
      break;
    }

    return exerciseType.label + direction;
  }

  buildForm() {

    // Test Type options
    const testTypeControls: FormControl[] = [];
    this.exerciseTypes.forEach(tpe => {
      testTypeControls.push(new FormControl(tpe.isDefault));
    });

    this.exerciseForm = this.formBuilder.group({
      exerciseTypes: new FormArray(testTypeControls)
    });

    this.isFormReady = true;
  }

  onSubmit(form: FormGroup) {
    console.log('submitting');
    this.isSubmitted = true;
    this.processSubmittedData(form.value);
    this.saveExercise();
  }

  processSubmittedData(data: any) {
    // Exercise types
    const selectedExerciseTypes: ExerciseType[] = [];
    for (let i = 0; i < this.exerciseTypes.length; i++) {
      if (data.exerciseTypes[i]) {
        selectedExerciseTypes.push(this.exerciseTypes[i]);
      }
    }
    this.exercise.exerciseTypes = selectedExerciseTypes;

    // TODO: fetch score / wordcount if alternative word is selected!!

    console.log('exercise', this.exercise);
  }

  saveExercise() {
    if (this.isNew) {
      this.buildService
      .addExercise(this.exercise)
      .takeWhile(() => this.componentActive)
      .subscribe(
        exercise => {
          this.isNew = false;
          this.isSubmitted = false;
          console.log('saved exercise ', exercise._id);
          //TODO: send update to lesson component
        },
        error => this.errorService.handleError(error)
      );
    } else {
      console.log('updating exercise ', this.exercise._id);
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
