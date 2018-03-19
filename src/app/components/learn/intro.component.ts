import {Component, Input} from '@angular/core';

@Component({
  selector: 'km-intro',
  template: `<div [innerHTML]="html | sanitizeHtml"></div>`,
  styleUrls: ['intro.component.css'],
})

export class IntroComponent {
  @Input() html: string;
}