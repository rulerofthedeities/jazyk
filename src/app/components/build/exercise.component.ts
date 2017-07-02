import {Component, Input, Output, OnInit, AfterViewInit, ElementRef, ChangeDetectorRef, Renderer, OnDestroy, EventEmitter} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {LanPair} from '../../models/course.model';
import {Filter, WordPair, WordPairDetail, Exercise} from '../../models/exercise.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-build-exercise',
  templateUrl: 'exercise.component.html',
  styleUrls: ['exercise.component.css']
})

export class BuildExerciseComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() languagePair: LanPair;
  @Input() lessonId: string;
  @Input() exercise: Exercise;
  @Input() text: Object;
  @Input() focus: string;
  @Output() addedExercise = new EventEmitter<Exercise>();
  @Output() cancelEdit = new EventEmitter<boolean>();
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
    private errorService: ErrorService,
    private element: ElementRef,
    private ref: ChangeDetectorRef,
    private renderer: Renderer
  ) {}

  ngOnInit() {
    this.lanLocal = this.languagePair.from.slice(0, 2);
    this.lanForeign = this.languagePair.to.slice(0, 2);
    this.buildForm(this.exercise);
  }

  ngAfterViewInit() {
    const focusElement = this.element.nativeElement.querySelector('#' + this.focus);
    if (focusElement) {
      this.renderer.invokeElementMethod(focusElement, 'focus', []);
      this.ref.detectChanges();
    }
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

  onCancelEdit() {
    this.cancelEdit.emit(true);
  }

  onCloseDropdown() {
    this.lanList = null;
  }

  onAddAlt(tpe: string, word: string) {
    console.log('adding alt', word);
    if (word) {
      if (this.exercise[tpe].alt) {
        this.exercise[tpe].alt += '|';
      }
      this.exercise[tpe].alt += word;
    }
  }

  onRemoveAlt(tpe: string, i: number) {
    const alts: string[] = this.exercise[tpe].alt.split('|');
    this.exercise[tpe].alt = alts.filter((alt, alti) => alti !== i).join('|');
  }

  private buildNewExercise(formValues: any) {
    const exercise: Exercise = {
      nr: 1,
      local: {word: formValues.localWord},
      foreign: {word: formValues.foreignWord}
    };
    const foreignAnnotations: string[] = [];

    if (formValues.localWord === this.selected[this.lanLocal].word &&
        formValues.foreignWord === this.selected[this.lanForeign].word) {
      /* Foreign */
      exercise.foreign.hint = this.selected.wordPair[this.lanForeign].hint;
      exercise.foreign.info = this.selected.wordPair[this.lanForeign].info;
      exercise.wordTpe = this.selected[this.lanForeign].wordTpe;
      exercise.genus = this.selected[this.lanForeign].genus;
      exercise.followingCase = this.selected[this.lanForeign].followingCase;
      if (this.selected[this.lanForeign].aspect) {
        foreignAnnotations.push(this.selected[this.lanForeign].aspect);
      }
      exercise.foreign.annotations = foreignAnnotations.join('|');
      console.log('annotations', foreignAnnotations);
      if (this.selected.wordPair[this.lanForeign].alt) {
        exercise.foreign.alt = this.selected.wordPair[this.lanForeign].alt.map(alt => alt.word).join('|');
      }
      if (this.selected[this.lanForeign].audios) {
        exercise.audios = this.selected[this.lanForeign].audios.map(audio => audio.s3);
      }
      if (this.selected[this.lanForeign].images) {
        exercise.image = this.selected[this.lanForeign].images[0].s3;
      }
      /* Local */
      exercise.local.hint = this.selected.wordPair[this.lanLocal].hint;
      exercise.local.info = this.selected.wordPair[this.lanLocal].info;
      if (this.selected.wordPair[this.lanLocal].alt) {
        exercise.local.alt = this.selected.wordPair[this.lanLocal].alt.map(alt => alt.word).join('|');
      }
    }

    console.log('saving exercise ', exercise);

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
        localWord: [exercise.local.word, [Validators.required]],
        foreignWord: [exercise.foreign.word, [Validators.required]]
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
