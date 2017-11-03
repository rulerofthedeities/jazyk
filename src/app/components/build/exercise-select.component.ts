import {Component, Input, Output, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {FormBuilder, FormArray, FormControl, Validators} from '@angular/forms';
import {ExerciseBase} from './exercise-base.component';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {ValidationService} from '../../services/validation.service';
import {Exercise, ExerciseType} from '../../models/exercise.model';

@Component({
  selector: 'km-build-select',
  templateUrl: 'exercise-select.component.html',
  styleUrls: ['exercise-select.component.css', 'exercise-wrapper.css']
})

export class BuildSelectComponent extends ExerciseBase implements OnInit, OnDestroy {

  constructor(
    protected buildService: BuildService,
    protected errorService: ErrorService,
    protected formBuilder: FormBuilder
  ) {
    super(buildService, errorService, formBuilder);
  }

  ngOnInit() {
    super.init();
  }

  onAddOption() {
    this.addOption();
  }

  onRemoveOption(i: number) {
    this.removeOption(i);
  }

  private addOption() {
    const optionControls = <FormArray>this.exerciseForm.controls['options'];
    optionControls.push(new FormControl(''));
  }

  private removeOption(i: number) {
    const optionControls = <FormArray>this.exerciseForm.controls['options'];
    optionControls.removeAt(i);
  }

  protected buildForm(exercise: Exercise) {
    if (!exercise) {
      // New sentence
      const optionControls: FormControl[] = [];
      optionControls.push(new FormControl(''));
      this.exerciseForm = this.formBuilder.group({
        select: ['', [Validators.required, ValidationService.checkSelect]],
        selectLocal: [''],
        options: new FormArray(optionControls)
      },
      {
        validator: ValidationService.checkSelectOptions
      });
    } else {
      // Edit sentence
      const optionControls: FormControl[] = [];
      exercise.options.forEach(option =>
        optionControls.push(new FormControl(option))
      );
      this.exerciseForm = this.formBuilder.group({
        sentence: [exercise.foreign.word, [Validators.required, ValidationService.checkSelect]],
        sentenceLocal: [exercise.local.word],
        options: new FormArray(optionControls)
      },
      {
        validator: ValidationService.checkSelectOptions
      });
    }
    this.isFormReady = true;
  }

  protected buildNewExercise(formValues: any) {
    const options = formValues.options.filter(option => option);
    console.log('filtered options', options);
    const exercise: Exercise = {
      foreign: {word: formValues.sentence},
      local: {word: formValues.sentenceLocal},
      options: options,
      tpe: ExerciseType.Select,
      difficulty: 0
    };
    this.saveNewExercise(exercise);
  }

  protected buildExistingExercise(formValues: any) {
    const options = formValues.options.filter(option => option);
    const exercise: Exercise = this.currentExercise;
    exercise.foreign.word = this.exerciseForm.value['sentence'];
    exercise.local.word = this.exerciseForm.value['sentenceLocal'];
    exercise.options = options;
    console.log('updating', exercise);
    this.saveUpdatedExercise(exercise);
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
