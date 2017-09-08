import {Component, Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'km-build-lesson-tabs',
  template: `
    <ul class="nav nav-tabs">
      <li *ngIf="isIntro"
        [class.active]="tab==='intro'"
        (click)="onSelectTab('intro')">
        <a>{{text["Intro"]}}</a>
      </li>
      <li 
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

export class BuildLessonTabsComponent {
  @Input() text: Object;
  @Input() tab: string;
  @Input() isIntro: boolean;
  @Output() selected = new EventEmitter<string>();

  onSelectTab(tab: string) {
    if (this.isIntro) {
      this.selected.emit(tab);
    }
  }
}
