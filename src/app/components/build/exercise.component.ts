import {Component, Input, Output, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {LanPair} from '../../models/course.model';
import {Filter, WordPair, WordPairDetail, Exercise} from '../../models/exercise.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-build-exercise',
  templateUrl: 'exercise.component.html',
  styles: [`
    :host {
      display: block;
      background-color: #efefef;
      padding: 16px;
      border-radius: 6px;
    }
  `]
})

export class BuildExerciseComponent implements OnInit, OnDestroy {
  @Input() languagePair: LanPair;
  @Input() lessonId: string;
  @Input() exercise: Exercise;
  @Input() text: Object;
  @Output() addedExercise = new EventEmitter<Exercise>();
  private componentActive = true;
  private isSelected = false;
  private selected: WordPairDetail;
  wordpairs: WordPair[];
  exerciseForm: FormGroup;
  lanForeign: string;
  lanLocal: string;
  lanList: string; // Language of the current dropdown
  isFormReady = false;
  isSaving = false;

  constructor(
    private formBuilder: FormBuilder,
    private buildService: BuildService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.lanLocal = this.languagePair.from.slice(0, 2);
    this.lanForeign = this.languagePair.to.slice(0, 2);
    this.buildForm(this.exercise);
  }

  onFocus(word: string, lan: string) {
    this.isSelected = false;
    this.changeFilter(word, lan);
  }

  onFilterChanged(word: string, lan: string) {
    // Only show list after user puts focus in field
    if (!this.isSelected) {
      this.changeFilter(word, lan);
    }
  }

  onWordSelected(wordpairDetail: WordPairDetail) {
    this.lanList = null;
    this.isSelected = true;
    this.selected = wordpairDetail;
    this.exerciseForm.patchValue({
      foreignWord: wordpairDetail.wordPair[this.lanForeign].word,
      localWord: wordpairDetail.wordPair[this.lanLocal].word
    });
    if (!this.exercise) {
      // Update word
      this.exerciseForm.patchValue({
        genus: wordpairDetail[this.lanLocal].genus
      });
    }
    console.log('selected', wordpairDetail);
  }


  onSaveNewWord(formValues: any) {
    this.isSaving = true;
    this.buildNewExercise(formValues);
  }

  private buildNewExercise(formValues: any) {
    const exercise: Exercise = {
      nr: 1,
      localWord: formValues.localWord,
      foreignWord: formValues.foreignWord
    };

    if (formValues.localWord === this.selected[this.lanLocal].word &&
        formValues.foreignWord === this.selected[this.lanForeign].word) {
      console.log('add data from wordpair');
      exercise.wordTpe = this.selected[this.lanForeign].wordTpe;
      exercise.genus = this.selected[this.lanForeign].genus;
      exercise.aspect = this.selected[this.lanForeign].aspect;
      exercise.followingCase = this.selected[this.lanForeign].followingCase;
    }

    this.saveNewExercise(exercise);
  }

  private saveNewExercise(exercise: Exercise) {
    this.buildService
    .addExercise(exercise, this.lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      savedExercise => {
        console.log('saved exercise ', savedExercise);
        this.addedExercise.emit(savedExercise);
        this.exerciseForm.reset();
        this.isSaving = false;
      },
      error => this.errorService.handleError(error)
    );
  }

  private buildForm(exercise: Exercise) {
    if (!this.exercise) {
      this.exerciseForm = this.formBuilder.group({
        localWord: ['', [Validators.required]],
        foreignWord: ['', [Validators.required]]
      });
    } else {
      this.exerciseForm = this.formBuilder.group({
        localWord: [exercise.localWord, [Validators.required]],
        foreignWord: [exercise.foreignWord, [Validators.required]]
      });
    }

    this.isFormReady = true;
  }

  private getWordList(filter: Filter) {
    if (filter.word) {
      this.buildService
      .fetchFilterWordPairs(filter, this.languagePair)
      .takeWhile(() => this.componentActive)
      .subscribe(
        wordpairs => this.wordpairs = wordpairs,
        error => this.errorService.handleError(error)
      );
    } else {
      this.lanList = null; // collapse dropdown list
    }
  }

  private changeFilter(word: string, lan: string) {
    const filter: Filter = {
      isExact: false,
      isFromStart: false,
      getTotal: false,
      languageId: lan,
      limit: 8,
      word
    };
    if (this.lanList !== lan) {
      this.wordpairs = null;
    }
    this.lanList = lan;
    this.getWordList(filter);
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
