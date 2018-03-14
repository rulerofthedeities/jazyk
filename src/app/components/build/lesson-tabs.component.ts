import {Component, Input, Output, EventEmitter, OnChanges} from '@angular/core';
import {ExerciseSteps} from '../../models/exercise.model';

@Component({
  selector: 'km-build-lesson-tabs',
  template: `
    <ul class="nav nav-tabs">
      <li *ngIf="steps.intro.active"
        [class.active]="tab==='intro'"
        (click)="onSelectTab('intro')">
        <a>{{text["Intro"]}}</a>
      </li>
      <li *ngIf="steps.practise.active || steps.study.active"
        [class.active]="tab==='words'"
        (click)="onSelectTab('words')">
        <a>{{text["Words"]}}</a>
      </li>
    </ul>
  `,
  styles: [`
    :host {
      display: block;
      margin: 0 -12px;
    }
    li {
      cursor: pointer;
    }
    a {
      color: white;
    }
    a:hover {
      color: black;
    }
  `]
})

export class BuildLessonTabsComponent implements OnChanges {
  @Input() text: Object;
  @Input() steps: ExerciseSteps;
  @Output() selected = new EventEmitter<string>();
  tab = 'words';

  ngOnChanges() {
    this.setDefaultTab();
  }

  onSelectTab(tab: string) {
    this.tab = tab;
    this.selected.emit(tab);
  }

  private setDefaultTab() {
    this.tab = 'words';
    if (!this.steps.practise.active && !this.steps.study.active) {
      this.tab = 'intro';
    }
    this.selected.emit(this.tab);
  }
}
