import {Component, Input, Output, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {FormBuilder, FormGroup, FormArray, FormControl, Validators} from '@angular/forms';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {ValidationService} from '../../services/validation.service';
import {LanPair} from '../../models/course.model';
import {Exercise, ExerciseType} from '../../models/exercise.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-build-sentence',
  templateUrl: 'sentence.component.html',
  styleUrls: ['sentence.component.css']
})

export class BuildSentenceComponent implements OnInit, OnDestroy {
  @Input() languagePair: LanPair;
  @Input() private exercise: Exercise;
  @Input() text: Object;
  @Input() lessonId: string;
  @Output() cancelNew = new EventEmitter<boolean>();
  private componentActive = true;
  sentenceForm: FormGroup;
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

  onAddNewSentence(form: any) {
    console.log('formValues', form.value);
    console.log('formValid', form.valid);
    if (form.valid) {
      this.buildNewExercise(form.value);
    }
  }

  onCancelNewSentence() {
    this.cancelNew.emit(true);
  }

  onAddOption() {
    this.addOption();
  }

  onRemoveOption(i: number) {
    this.removeOption(i);
  }

  private addOption() {
    const optionControls = <FormArray>this.sentenceForm.controls['options'];
    optionControls.push(new FormControl(''));
  }

  private removeOption(i: number) {
    const optionControls = <FormArray>this.sentenceForm.controls['options'];
    optionControls.removeAt(i);
  }

  private buildForm(exercise: Exercise) {
    if (!exercise) {
      // New sentence
      const optionControls: FormControl[] = [];
      optionControls.push(new FormControl(''));

      this.sentenceForm = this.formBuilder.group({
        sentence: ['', [Validators.required, ValidationService.checkSentence]],
        sentenceLocal: [''],
        options: new FormArray(optionControls)
      },
      {
        validator: ValidationService.checkSentenceOptions
      });
    } else {
      // Edit sentence
    }

    this.isFormReady = true;
  }

  private buildNewExercise(formValues: any) {
    const options = formValues.options.filter(option => option);
    console.log('filtered options', options);
    const exercise: Exercise = {
      foreign: {word: formValues.sentence},
      local: {word: formValues.sentenceLocal},
      options: options,
      tpe: ExerciseType.Sentence,
      difficulty: 0
    };
    this.saveNewExercise(exercise);
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
        // this.addedExercises.emit(savedExercises);
        this.sentenceForm.reset();
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
