import {Component, OnInit, ViewEncapsulation } from '@angular/core';
import {MarkdownService} from 'angular2-markdown';

@Component({
  selector: 'km-build-lesson-intro',
  template: `
    <div class="panel panel-default">
      <div class="panel-body">
        <div class="col-xs-6">
          <textarea
            class="form-control"
            [(ngModel)]="textData"
            rows="50">
          </textarea>
        </div>
        <div class="col-xs-6">
          <markdown [data]="textData">
          </markdown>
        </div>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['lesson-intro.component.css']
})

export class BuildLessonIntroComponent implements OnInit {
  textData = `
  # title

  | Tables   |      Are      |  Cool |
  |----------|:-------------:|------:|
  | col 1 is |  left-aligned | $1600 |
  | col 2 is |    centered   |   $12 |
  | col 3 is | right-aligned |    $1 |
  `;

  constructor(
    private _markdown: MarkdownService
  ) {}

  ngOnInit() {
    this._markdown.renderer.table = (header: string, body: string) => {
      return `
      <table class="mdtable">
        <thead>
          ${header}
        </thead>
        <tbody>
          ${body}
        </tbody>
      </table>
      `;
    };
  }
}
