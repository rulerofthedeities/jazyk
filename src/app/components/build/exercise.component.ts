import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {UtilsService} from '../../services/utils.service';
import {WordPairDetail, Exercise} from '../../models/exercise.model';
import {ExerciseType} from '../../models/exercise.model';

@Component({
  selector: 'km-build-exercise',
  template: `
  EXERCISE
  <pre>
    {{exerciseTypes|json}}
    {{word|json}}
  </pre>


  <!--
  <form *ngIf="exerciseForm"
    [formGroup]="exerciseForm"
    (ngSubmit) = "onSubmit(wordForm.value)"
    class="form-horizontal">
    
    <button
      type="submit" 
      class="btn btn-success" 
      [disabled]="!wordForm.valid">
      Voeg woord toe
    </button>
  </form>
  -->
  `
})

export class BuildExerciseComponent implements OnInit {
  @Input() word: WordPairDetail;
  // exerciseForm: FormGroup;
  exerciseTypes: ExerciseType[];
  isFormReady = false;
  exercise: Exercise;

  constructor(
    private utilsService: UtilsService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    // this.exerciseTypes = this.utilsService.getExerciseTypes(this.exercise, lanPair);
  }

/*
  newWord() {
    this.currentQuestion = {
      wordPairId: '',
      testTypes: []
    };
    this.buildForm();
  }

  buildForm() {
    this.wordForm = this.formBuilder.group({
      wordPairId: [this.currentQuestion.wordPairId],
      testTypes: [this.currentQuestion.testTypes]
    });
    this.isFormReady = true;
  }
*/
}
