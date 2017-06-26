import {Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {LanPair} from '../../models/course.model';

@Component({
  selector: 'km-build-exercise',
  template: `
    <section>
      <form *ngIf="isFormReady"
        [formGroup]="exerciseForm"
        class="form-horizontal">

        <div class="form-group">
          <label 
            for="foreignWord" 
            class="control-label col-xs-1">
            <img src="/assets/img/flags/{{this.languagePair.to}}.png">
          </label>
          <div class="col-xs-11">
            <input 
              class="form-control" 
              id="foreignWord"
              autocomplete="off"
              autofocus
              placeholder="{{text['Enterword' + lanForeign]}}"
              required
              formControlName="foreignWord">
          </div>
        </div>

        <div class="form-group">
          <label 
            for="localWord" 
            class="control-label col-xs-1">
            <img src="/assets/img/flags/{{this.languagePair.from}}.png">
          </label>
          <div class="col-xs-11">
            <input 
              class="form-control" 
              id="localWord"
              autocomplete="off"
              autofocus
              placeholder="{{text['Enterword' + lanLocal]}}"
              required
              formControlName="localWord">
          </div>
        </div>

      </form>
    </section>
  `,
  styles: [`
    section {
      background-color: #efefef;
      padding: 16px;
      border-radius: 6px;
    }
  `]
})

export class BuildExerciseComponent implements OnInit {
  @Input() languagePair: LanPair;
  @Input() lessonId: string;
  @Input() text: Object;
  exerciseForm: FormGroup;
  lanForeign: string;
  lanLocal: string;
  isFormReady = false;

  constructor(
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.lanLocal = this.languagePair.from.slice(0, 2);
    this.lanForeign = this.languagePair.to.slice(0, 2);
    this.buildForm();
  }

  private buildForm() {
    this.exerciseForm = this.formBuilder.group({
      localWord: ['', [Validators.required]],
      foreignWord: ['', [Validators.required]]
    });

    this.isFormReady = true;
  }

}
