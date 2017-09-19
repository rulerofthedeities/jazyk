import {Component, Input, Output, OnInit, EventEmitter} from '@angular/core';
import {FormBuilder, FormGroup, FormArray, FormControl, Validators} from '@angular/forms';
import {ValidationService} from '../../services/validation.service';
import {LanPair} from '../../models/course.model';
import {Exercise} from '../../models/exercise.model';

@Component({
  selector: 'km-build-sentence',
  templateUrl: 'sentence.component.html',
  styleUrls: ['sentence.component.css']
})

export class BuildSentenceComponent implements OnInit {
  @Input() languagePair: LanPair;
  @Input() private exercise: Exercise;
  @Input() text: Object;
  @Output() cancelNew = new EventEmitter<boolean>();
  sentenceForm: FormGroup;
  currentExercise: Exercise;
  isFormReady = false;

  constructor(
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
        sentence: ['', [Validators.required]],
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
}
