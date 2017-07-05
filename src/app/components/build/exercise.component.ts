import {Component, Input, Output, OnInit, AfterViewInit,
  ElementRef, ChangeDetectorRef, Renderer, OnDestroy, EventEmitter} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {UtilsService} from '../../services/utils.service';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {LanPair, LanConfig} from '../../models/course.model';
import {Filter, WordPair, WordPairDetail, Exercise, File} from '../../models/exercise.model';
import 'rxjs/add/operator/takeWhile';

interface AddFields {
  altForeign: boolean;
  annotationsForeign: boolean;
  images: boolean;
  audios: boolean;
}

interface WordTpe {
  name: string;
  nameLocal: string;
}

interface FormData {
  wordTpes: WordTpe[];
}

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
  isMediaLoaded = false;
  isSaving = false;
  addFields: AddFields;
  formData: FormData;
  customField: string; // field dependent on wordtpe
  config: LanConfig;
  images: File[];
  audios: File[];

  constructor(
    private utilsService: UtilsService,
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
    this.addFields = {
      altForeign: false,
      annotationsForeign: false,
      images: false,
      audios: false
    };
    this.setFormData();
    this.getConfig(this.lanForeign);
  }

  ngAfterViewInit() {
    const focusElement = this.element.nativeElement.querySelector('#' + this.focus);
    console.log('focus', this.focus, focusElement);
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
    console.log('word selected');
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

  onAdd(fld: string, tpe: string, word: string) {
    console.log('adding', fld, word);
    if (word) {
      if (this.exercise[tpe][fld]) {
        this.exercise[tpe][fld] += '|';
      } else {
        this.exercise[tpe][fld] = '';
      }
      this.exercise[tpe][fld] += word;
    }
  }

  onRemove(fld: string, tpe: string, i: number) {
    const items: string[] = this.exercise[tpe][fld].split('|');
    this.exercise[tpe][fld] = items.filter((item, itemi) => itemi !== i).join('|');
  }

  onActivateField(field: string) {
    this.addFields[field] = true;
  }

  onLoadMedia() {
    // Fetching audio and images for wordpairId if wordpairId exists
    if (!this.isMediaLoaded) {
      this.loadMedia();
    }
  }

  onClickImage(i: number) {
    this.exercise.image = this.images[i].s3;
  }

  getDynamicFieldLabel(): string {
    let label = '';
    this.customField = '';
    if (this.exerciseForm.value['wordTpe']) {
      switch (this.exerciseForm.value['wordTpe']) {
        case 'noun':
          if (this.lanForeign === 'cs' || this.lanForeign === 'de' || this.lanForeign === 'fr') {
            label = 'Gender';
            this.customField = 'genus';
          }
          if (this.lanForeign === 'nl') {
            label = 'Article';
            this.customField = 'article';
          }
          break;
        case 'adjective':
          if (this.lanForeign === 'fr') {
            label = 'Gender';
            this.customField = 'genus';
          }
          break;
        case 'preposition':
          if (this.lanForeign === 'cs' || this.lanForeign === 'de') {
            label = '+Case';
            this.customField = 'followingCase';
          }
          break;
        case 'verb':
          if (this.lanForeign === 'cs') {
            label = 'Aspect';
            this.customField = 'aspect';
          }
          break;
      }
      label = this.text[label] ? this.text[label] : label;
      label += label === '' ? '' : ':';
    }
    return label;
  }

  private getConfig(lanCode: string) {
    this.buildService
    .fetchLanConfig(lanCode)
    .takeWhile(() => this.componentActive)
    .subscribe(
      config => {
        if (config) {
          console.log('config', config);
          this.config = config;
          this.buildForm(this.exercise);
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private loadMedia() {
    if (this.exercise.wordDetailId) {
      this.buildService
      .fetchMedia(this.exercise.wordDetailId)
      .takeWhile(() => this.componentActive)
      .subscribe(
        media => {
          if (media) {
            this.images = media.images;
            this.audios = media.audios;
            this.isMediaLoaded = true;
          }
        },
        error => this.errorService.handleError(error)
      );
    }
  }

  private setFormData() {
    const tpes: string[] = this.utilsService.getWordTypes();
    this.formData = {wordTpes: []};
    tpes.forEach(tpe => {
      this.formData.wordTpes.push({name: tpe, nameLocal: this.text[tpe]});
    });
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
      exercise.wordDetailId = this.selected[this.lanForeign]._id; // For media files
      /* Foreign */
      exercise.foreign.hint = this.selected.wordPair[this.lanForeign].hint;
      exercise.foreign.info = this.selected.wordPair[this.lanForeign].info;
      exercise.wordTpe = this.selected[this.lanForeign].wordTpe;
      exercise.genus = this.selected[this.lanForeign].genus;
      exercise.article = this.selected[this.lanForeign].article;
      exercise.followingCase = this.selected[this.lanForeign].followingCase;
      exercise.aspect = this.selected[this.lanForeign].aspect;
      // this.addAnnotation(foreignAnnotations, this.selected[this.lanForeign].aspect);
      // this.addAnnotation(foreignAnnotations, this.selected[this.lanForeign].wordTpe);
      exercise.foreign.annotations = foreignAnnotations.join('|');
      if (this.selected.wordPair[this.lanForeign].alt) {
        exercise.foreign.alt = this.selected.wordPair[this.lanForeign].alt.map(alt => alt.word).join('|');
      }
      if (this.selected[this.lanForeign].audios) {
        exercise.audio = this.selected[this.lanForeign].audios[0].s3;
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

  private addAnnotation(annotations: string[], newAnnotation: string) {
    if (newAnnotation) {
      annotations.push(newAnnotation);
    }
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
        foreignWord: [exercise.foreign.word, [Validators.required]],
        localHint: [exercise.local.hint],
        foreignHint: [exercise.foreign.hint],
        wordTpe: [exercise.wordTpe],
        genus: [exercise.genus],
        article: [exercise.article],
        followingCase: [exercise.followingCase],
        aspect: [exercise.aspect],
        info: [exercise.foreign.info]
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
