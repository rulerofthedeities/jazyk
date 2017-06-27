import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {LanPair} from '../../models/course.model';
import {Filter, WordPair, WordPairDetail} from '../../models/exercise.model';
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
  @Input() text: Object;
  private componentActive = true;
  selected: WordPairDetail;
  wordpairs: WordPair[];
  exerciseForm: FormGroup;
  lanForeign: string;
  lanLocal: string;
  lanList: string; // Language of the current dropdown
  isFormReady = false;
  isSelected = false;

  constructor(
    private formBuilder: FormBuilder,
    private buildService: BuildService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.lanLocal = this.languagePair.from.slice(0, 2);
    this.lanForeign = this.languagePair.to.slice(0, 2);
    this.buildForm();
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
    this.exerciseForm.patchValue({foreignWord: wordpairDetail.wordPair[this.lanForeign].word});
    this.exerciseForm.patchValue({localWord: wordpairDetail.wordPair[this.lanLocal].word});
    console.log('selected', wordpairDetail);
  }


  onSaveNewWord(formValues: any) {
    console.log('saving', formValues);
  }

  private buildForm() {
    this.exerciseForm = this.formBuilder.group({
      localWord: ['', [Validators.required]],
      foreignWord: ['', [Validators.required]]
    });

    this.isFormReady = true;
  }

  private getWordList(filter: Filter) {
    this.buildService
    .fetchFilterWordPairs(filter, this.languagePair)
    .takeWhile(() => this.componentActive)
    .subscribe(
      wordpairs => this.wordpairs = wordpairs,
      error => this.errorService.handleError(error)
    );
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
