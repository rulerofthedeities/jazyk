import {Component, Input} from '@angular/core';
import {ExerciseData, LearnSettings} from '../../models/exercise.model';
import {LanPair} from '../../models/course.model';

@Component({
  selector: 'km-question',
  template: `
    <div *ngIf="currentData">
      <div class="local" *ngIf="tpe==='local'">
        <h1>
          <span>
            <img src="/assets/img/flags/{{lanPair.from}}.png" class="flag">
          </span>
          <span class="word">
            {{currentData.exercise.local.word}}
          </span>
        </h1>
        <div class="wordinfo">
          <div
            class="label label-annotation"
            *ngFor="let annotation of currentData.data.annotations">
            {{annotation}}
          </div>
          <div class="hint" *ngIf="currentData.exercise.local.hint">
            {{text["hint"]}}: {{currentData.exercise.local.hint}}
          </div>
        </div>
      </div>

      <div class="foreign" *ngIf="tpe==='foreign'">
        <h1>
          <span>
            <img src="/assets/img/flags/{{lanPair.to}}.png" class="flag">
          </span>
          <span 
            class="word" 
            kmWordColor 
              [identifier]="currentData.exercise.genus" 
              [tpe]="currentData.exercise.wordTpe"
              [active]="settings.color">
            {{currentData.exercise?.foreign?.word}}
          </span>
          <span class="suffix">{{currentData.data.suffix}}</span>
          <span class="suffix">{{currentData.data.genus}}</span>
          <span class="audio pull-right" *ngIf="currentData.exercise.audios && currentData.exercise.audios.length > 0">
            <km-audio-file
              [fileName]="currentData.exercise.audios[0]"
              [active]="!settings.mute"
              autoPlay="true">
            </km-audio-file>
          </span>
        </h1>
        <div class="wordinfo">
          <div
            class="label label-annotation"
            *ngFor="let annotation of currentData.data.annotations">
            {{annotation}}
          </div>
          <div class="hint" *ngIf="currentData.exercise.foreign?.hint">
            {{text["hint"]}}: {{currentData.exercise.foreign?.hint}}
          </div>
          <div class="info" *ngIf="currentData.exercise.foreign?.info">
            {{currentData.exercise.foreign?.info}}
          </div>
        </div>
      </div>
    </div>`,
  styles: [`
    h1 {
      margin-top: 0;
      font-size: 46px;
    }
    .label-annotation {
      background-color: #f3f3f3;
      border: 1px dotted black;
      color: #333;
      margin-right: 3px;
      border-radius: 6px;
    }
  `]
})

export class LearnQuestionComponent {
  @Input() lanPair: LanPair;
  @Input() text: Object;
  @Input() currentData: ExerciseData;
  @Input() tpe: string;
  @Input() settings: LearnSettings = null;
}
