import {Component, Input, Output, OnInit, AfterViewInit,
  ElementRef, ChangeDetectorRef, Renderer, OnDestroy, EventEmitter} from '@angular/core';
import {FormBuilder, FormGroup, Validators, FormControl} from '@angular/forms';
import {UtilsService} from '../../services/utils.service';
import {BuildService} from '../../services/build.service';
import {PreviewService} from '../../services/preview.service';
import {ErrorService} from '../../services/error.service';
import {LanPair, LanConfig, LanConfigs, LessonOptions} from '../../models/course.model';
import {Exercise, ExerciseType} from '../../models/exercise.model';
import {Filter, WordPair, WordPairDetail, WordDetail, File} from '../../models/word.model';
import 'rxjs/add/operator/takeWhile';
import 'rxjs/add/operator/debounceTime';

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
  foreignRegions?: string[];
  localRegions?: string[];
}

interface NewExerciseOptions {
  isConjugation?: boolean;
  conjugationNr?: number;
  isGenus?: boolean;
  isArticle?: boolean;
  isComparison?: boolean;
  lastDoc?: boolean;
  addArticle?: boolean;
}

@Component({
  selector: 'km-build-exercise',
  templateUrl: 'exercise.component.html',
  styleUrls: ['exercise.component.css', 'exercise-wrapper.css']
})

export class BuildExerciseComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() languagePair: LanPair;
  @Input() configs: LanConfigs;
  @Input() lessonId: string;
  @Input() lessonOptions: LessonOptions;
  @Input() exercise: Exercise;
  @Input() text: Object;
  @Input() focus: string;
  @Input() isBidirectional: boolean;
  @Output() addedExercises = new EventEmitter<Exercise[]>();
  @Output() updatedExercise = new EventEmitter<Exercise>();
  @Output() cancelEdit = new EventEmitter<boolean>();
  @Output() cancelNew = new EventEmitter<boolean>();
  private componentActive = true;
  private isSelected = false;
  private selected: WordPairDetail;
  private saveExercises: Exercise[] = []; // For batches
  currentExercise: Exercise;
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
  hasConjugations = false;
  hasGenus = false;
  hasArticle = false;
  hasComparison = false;
  maxFilterListLength = 8;

  constructor(
    private utilsService: UtilsService,
    private formBuilder: FormBuilder,
    private buildService: BuildService,
    private previewService: PreviewService,
    private errorService: ErrorService,
    private element: ElementRef,
    private ref: ChangeDetectorRef,
    private renderer: Renderer
  ) {}

  ngOnInit() {
    if (this.exercise) {
      this.currentExercise = JSON.parse(JSON.stringify(this.exercise));
      this.loadMedia();
    }
    this.lanLocal = this.languagePair.from;
    this.lanForeign = this.languagePair.to;
    this.addFields = {
      altForeign: false,
      annotationsForeign: false,
      images: false,
      audios: false
    };
    this.setFormData(this.configs);
    this.config = this.configs.foreign;
    this.buildForm(this.currentExercise);
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
    this.hasConjugations = false;
    this.hasGenus = false;
    this.hasArticle = false;
    this.hasComparison = false;
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
    }, {emitEvent: false});
    if (!this.currentExercise) {
      // Update word
      if (wordpairDetail[this.lanLocal]) {
        this.exerciseForm.patchValue({
          genus: wordpairDetail[this.lanLocal].genus
        });
      }
    }
    this.hasConjugations = this.checkConjugations(wordpairDetail);
    this.hasGenus = this.checkGenus(wordpairDetail);
    this.hasArticle = this.checkArticle(wordpairDetail);
    this.hasComparison = this.checkComparison(wordpairDetail);
  }

  onAddNewWord(form: any) {
    console.log('adding', form.values);
    if (form.valid) {
      this.isSaving = true;
      this.buildNewExercise(form.value, {
        isConjugation: false,
        isGenus: false,
        isArticle: false,
        isComparison: false,
        lastDoc: true,
        addArticle: this.lessonOptions ? this.lessonOptions.addArticle : false
      });
    }
  }

  onAddNewConjugations(form: any) {
    if (form.valid) {
      const options: NewExerciseOptions = {
        isConjugation: true
      };
      this.isSaving = true;
      for (let i = 0; i < 6; i++) {
        options.conjugationNr = i;
        options.lastDoc = i === 5;
        this.buildNewExercise(form.value, options);
      }
    }
  }

  onAddNewGenus(form: any) {
    if (form.valid) {
      const options: NewExerciseOptions = {
        isGenus: true,
        lastDoc: true
      };
      this.isSaving = true;
      this.buildNewExercise(form.value, options);
    }
  }

  onAddNewArticle(form: any) {
    if (form.valid) {
      const options: NewExerciseOptions = {
        isArticle: true,
        lastDoc: true
      };
      this.isSaving = true;
      this.buildNewExercise(form.value, options);
    }
  }

  onAddNewComparison(form: any) {
    if (form.valid) {
      const options: NewExerciseOptions = {
        isComparison: true,
        lastDoc: true
      };
      this.isSaving = true;
      this.buildNewExercise(form.value, options);
    }
  }

  onUpdateWord(form: any) {
    if (form.valid) {
      this.isSaving = true;
      this.buildExistingExercise(form.value);
    }
  }

  onCancelEdit() {
    this.cancelEdit.emit(true);
  }

  onCancelNewWord() {
    this.cancelNew.emit(true);
  }

  onCloseDropdown() {
    this.lanList = null;
  }

  onAdd(fld: string, tpe: string, word: string) {
    if (word) {
      if (this.currentExercise[tpe][fld]) {
        this.currentExercise[tpe][fld] += '|';
      } else {
        this.currentExercise[tpe][fld] = '';
      }
      this.currentExercise[tpe][fld] += word;
    }
  }

  onRemove(fld: string, tpe: string, i: number) {
    const items: string[] = this.currentExercise[tpe][fld].split('|');
    this.currentExercise[tpe][fld] = items.filter((item, itemi) => itemi !== i).join('|');
  }

  onReplace(fld: string, tpe: string, i: number) {
    const items: string[] = this.currentExercise[tpe][fld].split('|');
    const newWord = items[i];
    const formName = tpe + 'Word';
    items[i] = this.exerciseForm.value[formName];
    this.currentExercise[tpe][fld] = items.join('|');
    this.exerciseForm.patchValue({[formName]: newWord});
  }

  onActivateField(field: string) {
    this.addFields[field] = true;
  }

  onClickImage(i: number) {
    this.currentExercise.image = this.images[i].s3 === this.currentExercise.image ? undefined : this.images[i].s3;
  }

  onClickAudio(i: number) {
    this.currentExercise.audio = this.audios[i].s3 === this.currentExercise.audio ? undefined : this.audios[i].s3;
  }

  onUpdateRegion(newRegion: string, tpe: string) {
    if (this.currentExercise) {
      this.currentExercise[tpe].region = newRegion;
    } else {
      this.exerciseForm.patchValue({[tpe + 'Region']: newRegion});
    }
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
/*
  private getConfigs(lanPair: LanPair) {
    this.buildService
    .fetchLanConfigs(lanPair)
    .takeWhile(() => this.componentActive)
    .subscribe(
      config => {
        if (config) {
          console.log('config', config);
          this.config = config.foreign;
          this.formData.foreignRegions = config.foreign.regions;
          this.formData.localRegions = config.local.regions;
          this.buildForm(this.currentExercise);
        }
      },
      error => this.errorService.handleError(error)
    );
  }
  */

  private loadMedia() {
    if (!this.isMediaLoaded && this.currentExercise.wordDetailId) {
      this.buildService
      .fetchMedia(this.currentExercise.wordDetailId)
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

  private setFormData(configs: LanConfigs) {
    const tpes: string[] = this.utilsService.getWordTypes();
    this.formData = {
      wordTpes: [],
      localRegions: this.configs.local.regions || [],
      foreignRegions: this.configs.foreign.regions || []
    };
    tpes.forEach(tpe => {
      this.formData.wordTpes.push({name: tpe, nameLocal: this.text[tpe]});
    });
  }

  private buildNewExercise(formValues: any, options: NewExerciseOptions) {
    const exercise: Exercise = {
      local: {
        word: formValues.localWord,
        region: formValues.localRegion
      },
      foreign: {
        word: formValues.foreignWord,
        region: formValues.foreignRegion
      },
      tpe: ExerciseType.Word
    };
    const foreignAnnotations: string[] = [];
    const localAnnotations: string[] = [];

    if (this.selected &&
        this.selected[this.lanLocal] &&
        this.selected[this.lanForeign] &&
        formValues.localWord === this.selected[this.lanLocal].word &&
        formValues.foreignWord === this.selected[this.lanForeign].word) {

      const foreign = this.selected[this.lanForeign],
            local = this.selected[this.lanLocal];
      if (options.addArticle) {
        this.addArticle(exercise, this.selected[this.lanForeign], this.selected[this.lanLocal]);
      }
      exercise.wordDetailId = this.selected[this.lanForeign]._id; // For media files
      exercise.foreign.region = this.selected[this.lanForeign].region; // Override region for words selected from database !
      if (!options.isGenus && !options.isArticle) {
        /* Foreign */
        exercise.foreign.hint = this.selected.wordPair[this.lanForeign].hint;
        exercise.foreign.info = this.selected.wordPair[this.lanForeign].info;
        exercise.wordTpe = this.selected[this.lanForeign].wordTpe;
        exercise.genus = this.selected[this.lanForeign].genus;
        exercise.article = this.selected[this.lanForeign].article;
        if (this.selected[this.lanForeign].wordTpe === 'preposition') {
          exercise.followingCase = this.selected[this.lanForeign].followingCase;
        }
        exercise.aspect = this.selected[this.lanForeign].aspect;
        this.addAnnotations(foreignAnnotations, this.selected, 'foreign');
        exercise.foreign.annotations = foreignAnnotations.join('|');
        exercise.foreign.annotations = this.checkIfValue(exercise.foreign.annotations);
        if (this.selected.wordPair[this.lanForeign].alt) {
          exercise.foreign.alt = this.selected.wordPair[this.lanForeign].alt.map(alt => alt.word).join('|');
        }
        exercise.foreign.alt = this.checkIfValue(exercise.foreign.alt);
        if (this.selected[this.lanForeign].audios) {
          exercise.audio = this.selected[this.lanForeign].audios[0].s3;
        }
        if (this.selected[this.lanForeign].images) {
          exercise.image = this.selected[this.lanForeign].images[0].s3;
        }
        /* Local */
        this.addAnnotations(localAnnotations, this.selected, 'local');
        exercise.local.hint = this.selected.wordPair[this.lanLocal].hint;
        if (this.selected.wordPair[this.lanLocal].alt) {
          exercise.local.alt = this.selected.wordPair[this.lanLocal].alt.map(alt => alt.word).join('|');
        }
        exercise.local.alt = this.checkIfValue(exercise.local.alt);
        exercise.local.annotations = localAnnotations.join('|');
        exercise.local.annotations = this.checkIfValue(exercise.local.annotations);
      }

      /* Genus test */
      if (options.isGenus) {
        exercise.tpe = ExerciseType.Genus;
        exercise.wordTpe = foreign.wordTpe;
        if (foreign.audios) {
          exercise.audio = foreign.audios[0].s3;
        }
        exercise.genus = foreign.genus;
        exercise.options = this.config.genera.join('|');
      }

      /* Article test */
      if (options.isArticle) {
        exercise.tpe = ExerciseType.Article;
        exercise.wordTpe = foreign.wordTpe;
        if (foreign.audios) {
          exercise.audio = foreign.audios[0].s3;
        }
        exercise.article = foreign.article;
        exercise.options = this.config.articles.join('|');
        exercise.local.word = local.article + ' ' + formValues.localWord;
      }

      /* Comparison test */
      if (options.isComparison) {
        exercise.tpe = ExerciseType.Comparison;
        if (this.selected[this.lanForeign].comparative) {
          exercise.foreign.word += '|' + this.selected[this.lanForeign].comparative.split(';')[0];
        }
        if (this.selected[this.lanForeign].superlative) {
          exercise.foreign.word += '|' + this.selected[this.lanForeign].superlative.split(';')[0];
        }
      }

      /* Conjugation test */
      if (options.isConjugation) {
        const nr = options.conjugationNr,
              foreignPronouns = this.config.subjectPronouns;
        // Split conjugation if there are multiple
        const localWords = this.selected[this.lanLocal].conjugation[nr].split(';'),
              foreignWords = this.selected[this.lanForeign].conjugation[nr].split(';');
        // Add first word in list as the main word
        const localPronoun = '(' + this.text['subjectpronoun' + nr.toString()] + ') ',
              foreignPronoun = '(' + foreignPronouns[nr] + ') ';
        exercise.local.word = localPronoun + localWords[0];
        exercise.foreign.word = foreignPronoun + foreignWords[0];
        // Add other words as synonyms
        localWords.shift();
        if (localWords.length > 0) {
          if (exercise.local.alt) {
            exercise.local.alt += '|' + localPronoun + localWords.join('|');
          } else {
            exercise.local.alt = localPronoun + localWords.join('|');
          }
        }
        foreignWords.shift();
        if (foreignWords.length > 0) {
          if (exercise.foreign.alt) {
            exercise.foreign.alt += '|' + foreignPronoun + foreignWords.join('|');
          } else {
            exercise.foreign.alt = foreignPronoun + foreignWords.join('|');
          }
        }
      }
    }
    this.saveNewExercise(exercise, options.lastDoc);
  }

  private buildExistingExercise(formValues: any) {
    const exercise: Exercise = this.currentExercise;
    exercise.local.word = this.exerciseForm.value['localWord'];
    exercise.foreign.word = this.exerciseForm.value['foreignWord'];
    exercise.wordTpe = this.exerciseForm.value['wordTpe'];
    exercise.foreign.annotations = this.checkIfValue(exercise.foreign.annotations);
    exercise.foreign.region = this.checkIfValue(exercise.foreign.region);
    exercise.foreign.alt = this.checkIfValue(exercise.foreign.alt);
    exercise.foreign.info = this.checkIfValue(this.exerciseForm.value['info']);
    exercise.foreign.hint = this.checkIfValue(this.exerciseForm.value['foreignHint']);
    exercise.local.annotations = this.checkIfValue(exercise.local.annotations);
    exercise.local.region = this.checkIfValue(exercise.local.region);
    exercise.local.alt = this.checkIfValue(exercise.local.alt);
    exercise.local.hint = this.checkIfValue(this.exerciseForm.value['localHint']);
    exercise.genus = this.checkIfValue(this.exerciseForm.value['genus']);
    exercise.article = this.checkIfValue(this.exerciseForm.value['article']);
    exercise.followingCase = this.checkIfValue(this.exerciseForm.value['followingCase']);
    exercise.aspect = this.checkIfValue(this.exerciseForm.value['aspect']);

    console.log('updating', exercise);
    this.saveUpdatedExercise(exercise);
  }

  private addArticle(exercise: Exercise, foreign: WordDetail, local: WordDetail) {
    const aForeign = foreign.article || '',
          aLocal = local.article || '';
    exercise.foreign.word = (aForeign + ' ' + exercise.foreign.word).trim();
    exercise.local.word = (aLocal + ' ' + exercise.local.word).trim();
  }

  private checkIfValue(field: string): string {
    // Prevent saving empty values to db
    let value = undefined;
    if (field) {
      value = field;
    }
    return value;
  }

  private addAnnotations(annotations: string[], word: WordPairDetail, tpe: string) {
    const detail: WordDetail = tpe === 'foreign' ? word[this.lanForeign] : word[this.lanLocal];

    if (tpe === 'local') {
      // add expected foreign wordtype to local annotations
      if (word[this.lanForeign].wordTpe) {
        annotations.push(this.text[word[this.lanForeign].wordTpe]);
      }
      if (word[this.lanForeign].aspect) {
        annotations.push(this.text[word[this.lanForeign].aspect]);
      }
      if (word[this.lanForeign].motion) {
        annotations.push(this.text[word[this.lanForeign].motion]);
      }
    }

    if (tpe === 'foreign') {
      // Wordtpe
      if (detail.wordTpe === 'adverb' || detail.wordTpe === 'adjective' || detail.wordTpe === 'preposition') {
        annotations.push(this.text[detail.wordTpe]);
      }
    }

    // If verb has aspect or motion, add to annotations
    if (detail.aspect) {
      annotations.push(this.text[detail.aspect]);
    }
    if (detail.motion) {
      annotations.push(this.text[detail.motion]);
    }
    if (detail.isPlural) {
      annotations.push(this.text['plural']);
    }
    if (detail.isDiminutive) {
      annotations.push(this.text['diminutive']);
    }
    if (detail.isComparative) {
      annotations.push(this.text['comparative']);
    }
    if (detail.isSuperlative) {
      annotations.push(this.text['superlative']);
    }
  }

  private saveNewExercise(exercise: Exercise, lastInBatch: boolean) {
    // Difficulty later to be replaced with user data
    exercise.difficulty = 0;
    this.saveExercises.push(exercise);
    if (lastInBatch) {
      console.log('saving exercises', this.saveExercises);
      this.buildService
      .addExercises(this.saveExercises, this.lessonId)
      .takeWhile(() => this.componentActive)
      .subscribe(
        savedExercises => {
          console.log('saved exercises', savedExercises);
          this.addedExercises.emit(savedExercises);
          this.exerciseForm.reset();
          this.isSaving = false;
          this.saveExercises = [];
        },
        error => this.errorService.handleError(error)
      );
    }
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
        this.isSaving = false;
      },
      error => this.errorService.handleError(error)
    );
  }

  private buildForm(exercise: Exercise) {
    if (!exercise) {
      // New exercise
      this.exerciseForm = this.formBuilder.group({
        localWord: ['', [Validators.required]],
        foreignWord: ['', [Validators.required]],
        localRegion: [this.formData.localRegions[0] || this.languagePair.from],
        foreignRegion: [this.lessonOptions.region || this.formData.foreignRegions[0] || this.languagePair.to]
      });
    } else {
      // Edit exercise
      this.exerciseForm = this.formBuilder.group({
        localWord: [exercise.local.word, [Validators.required]],
        foreignWord: [exercise.foreign.word, [Validators.required]],
        localHint: [exercise.local.hint],
        foreignHint: [exercise.foreign.hint],
        localRegion: [exercise.local.region],
        foreignRegion: [exercise.foreign.region],
        info: [exercise.foreign.info],
        wordTpe: [exercise.wordTpe],
        genus: [exercise.genus],
        article: [exercise.article],
        followingCase: [exercise.followingCase],
        aspect: [exercise.aspect]
      });
    }
    this.setupFilterEvent();
    this.isFormReady = true;
  }

  private checkConjugations(wordpairDetail: WordPairDetail): boolean {
    // Check if both local and foreign details have entries for all conjugations
    let hasConjugations = false;
    if (wordpairDetail[this.lanForeign].wordTpe === 'verb') {
      const hasForeign = this.checkLanConjugations(wordpairDetail[this.lanForeign].conjugation);
      const hasLocal = this.checkLanConjugations(wordpairDetail[this.lanLocal].conjugation);
      hasConjugations = hasForeign && hasLocal;
    }
    return hasConjugations;
  }

  private checkLanConjugations(conjugations: string[]): boolean {
    // Check if this worddetail has entries for all conjugations
    if (conjugations && conjugations.length === 6) {
      return true;
    }
  }

  private checkGenus(wordpairDetail: WordPairDetail): boolean {
    const detail = wordpairDetail[this.lanForeign];
    if ((detail.wordTpe === 'noun' || detail.wordTpe === 'noungroup') && detail.genus) {
      return true;
    }
  }

  private checkArticle(wordpairDetail: WordPairDetail): boolean {
    const detail = wordpairDetail[this.lanForeign];
    if ((detail.wordTpe === 'noun' || detail.wordTpe === 'noungroup') && detail.article && this.configs.foreign.articles.length > 1) {
      return true;
    }
  }

  private checkComparison(wordpairDetail: WordPairDetail): boolean {
    const detail = wordpairDetail[this.lanForeign];
    if ((detail.wordTpe === 'adjective' || detail.wordTpe === 'adverb') && detail.comparative && detail.superlative) {
      return true;
    }
  }

  private setupFilterEvent() {
    let foreign = '',
        local = '';
    this.exerciseForm.controls['foreignWord']
    .valueChanges
    .debounceTime(300)
    .takeWhile(() => this.componentActive)
    .subscribe(newValue => {
      if (newValue !== foreign) {
        this.changeFilter(newValue, this.lanForeign);
        foreign = newValue;
      }
    });
    this.exerciseForm.controls['localWord']
    .valueChanges
    .takeWhile(() => this.componentActive)
    .debounceTime(300)
    .subscribe(newValue => {
      if (newValue !== local) {
        this.changeFilter(newValue, this.lanLocal);
        local = newValue;
      }
    });
  }

  private changeFilter(word: string, lan: string) {
    const filter: Filter = {
      isExact: false,
      isFromStart: false,
      getTotal: false,
      languageId: lan,
      limit: 12,
      word
    };
    if (this.lanList !== lan) {
      this.wordpairs = null;
    }
    this.lanList = lan;
    this.getWordList(filter);
  }

  private getWordList(filter: Filter) {
    if (filter.word) {
      this.buildService
      .fetchFilterWordPairs(filter, this.languagePair)
      .takeWhile(() => this.componentActive)
      .subscribe(
        wordpairs => {
          let word, score;
          const filteredList = [];
          wordpairs.forEach(wp => {
            word = wp[filter.languageId].word;
            score = this.previewService.getDamerauLevenshteinDistance(word, filter.word);
            filteredList.push({wordpair: wp, score});
          });
          filteredList.sort((a, b) => a.score - b.score);
          this.wordpairs = filteredList.map(item => item.wordpair).slice(0, this.maxFilterListLength);
        },
        error => this.errorService.handleError(error)
      );
    } else {
      this.lanList = null; // collapse dropdown list
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
