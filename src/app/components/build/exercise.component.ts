import {Component, Input, Output, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {UtilsService} from '../../services/utils.service';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {WordPairDetail, WordPair, Exercise} from '../../models/exercise.model';
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
  @Output() addedExercise = new EventEmitter<Exercise>();
  exerciseForm: FormGroup;
  // exerciseTypes: ExerciseType[];
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
    this.isNew = true;
    this.setTitle(word.wordPair);
    // this.getExerciseTypes(word);
    console.log('wpd', word);
    this.exercise = {
      nr: this.nr,
      wordPairDetailId: word._id,
      tpes: [],
      wordTpe: word.wordPair.wordTpe,
      [this.lanFrom]: {
        word: word.wordPair[this.lanFrom].word,
        hint: word.wordPair[this.lanFrom].hint,
        info: word.wordPair[this.lanFrom].info
      },
      [this.lanTo]: {
        word: word.wordPair[this.lanTo].word
      }
    };
    this.buildForm();
  }

  setTitle(wordPair: WordPair) {
    this.wordPairTitle = wordPair[this.lanTo].word;
  }

  onSubmit(form: FormGroup) {
    console.log('submitting');
    this.isSubmitted = true;
    this.processSubmittedData(form.value);
    this.saveExercise();
  }

/*
  private getExerciseTypes(word: WordPairDetail) {
    console.log('getting exercise types for', word);
    this.exerciseTypes = this.utilsService.getExerciseTypes(word, this.languagePair);
  }

  private getExerciseTypeLabel(exerciseType: ExerciseType): string {
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
  */

  private buildForm() {
    // Test Type options
    /*
    const testTypeControls: FormControl[] = [];
    this.exerciseTypes.forEach(tpe => {
      testTypeControls.push(new FormControl(tpe.isDefault));
    });
    */


    // woord in nl (mogelijk alt woord)
    // alt woorden in nl
    // hint
    // info
    // foto -> default auto (laat selecteren of removen)
    // audio -> default auto (laat selecteren of removen)
    // verb -> indien conjugations, laat selecteren (test ook vervoegingen)
    // noun -> indien diminutive, laat selecteren (test ook diminutive)?
    // adj -> indien comparative / superlative, laat selecteren (test ook comp/sup?)
    // ...
    this.exerciseForm = this.formBuilder.group({
      // exerciseTypes: new FormArray(testTypeControls)
    });

    this.isFormReady = true;
  }

  private processSubmittedData(data: any) {
    // Exercise types
    /*
    const selectedExerciseTypes: number[] = [];
    for (let i = 0; i < this.exerciseTypes.length; i++) {
      if (data.exerciseTypes[i]) {
        selectedExerciseTypes.push(this.exerciseTypes[i].nr);
      }
    }
    this.exercise.tpes = selectedExerciseTypes;
*/

    //TODO: fetch score / wordcount if alternative word is selected!!

    console.log('exercise', this.exercise);
  }

  private saveExercise() {
    if (this.isNew) {
      this.buildService
      .addExercise(this.exercise, this.lessonId)
      .takeWhile(() => this.componentActive)
      .subscribe(
        exercise => {
          this.isNew = false;
          this.isSubmitted = false;
          console.log('saved exercise ', exercise);
          this.addedExercise.emit(exercise);
        },
        error => this.errorService.handleError(error)
      );
    } else {
      console.log('updating exercise ', this.exercise);
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
