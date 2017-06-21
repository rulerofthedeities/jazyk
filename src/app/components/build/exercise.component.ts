import {Component, Input, Output, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {UtilsService} from '../../services/utils.service';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {WordPairDetail, WordPair, WordDetail, Word, Exercise} from '../../models/exercise.model';
import {LanPair} from '../../models/course.model';
import {File} from '../../models/exercise.model';
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
  private componentActive = true;
  lanForeign: string;
  lanLocal: string;
  exerciseForm: FormGroup;
  isFormReady = false;
  isNew = true;
  isSubmitted = false;
  wordPairTitle: String;
  exercise: Exercise;
  images: File[];

  constructor(
    private utilsService: UtilsService,
    private buildService: BuildService,
    private errorService: ErrorService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.lanLocal = this.languagePair.from.slice(0, 2);
    this.lanForeign = this.languagePair.to.slice(0, 2);
  }

  // Entry point from filter list
  newExercise(word: WordPairDetail) {
    this.isNew = true;
    this.setTitle(word.wordPair);
    this.createExercise(word);
  }

  onClickImage(i: number) {
    this.exercise.image = this.images[i].s3;
    console.log(this.exercise);
  }

  onSubmit(form: FormGroup) {
    this.isSubmitted = true;
    this.processSubmittedData(form.value);
    this.saveExercise();
  }

  private createExercise(word: WordPairDetail) {
    const localWord: Word = word.wordPair[this.lanLocal],
          foreignWord: Word = word.wordPair[this.lanForeign],
          localDetail: WordDetail = word[this.lanLocal],
          foreignDetail: WordDetail = word[this.lanForeign];
    console.log('local detail', localDetail);
    console.log('foreign detail', foreignDetail);
    this.images = foreignDetail.images;
    this.exercise = {
      nr: this.nr,
      wordPairDetailId: word._id,
      tpes: [],
      score: foreignDetail.score,
      wordTpe: foreignDetail.wordTpe,
      image: '',
      [this.lanLocal]: {
        word: localWord.word,
        hint: localWord.hint,
        info: localWord.info
      },
      [this.lanForeign]: {
        word: foreignWord.word
      }
    };
    if (foreignDetail.aspect) {
      this.exercise[this.lanForeign].aspect = foreignDetail.aspect;
    }
    if (foreignDetail.followingCase) {
      this.exercise[this.lanForeign].followingCase = foreignDetail.followingCase;
    }
    if (foreignDetail.genus) {
      this.exercise[this.lanForeign].genus = foreignDetail.genus;
    }
    this.buildForm();
  }

  private setTitle(wordPair: WordPair) {
    this.wordPairTitle = wordPair[this.lanForeign].word;
  }

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
