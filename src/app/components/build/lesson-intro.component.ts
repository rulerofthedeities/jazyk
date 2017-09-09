import {Component, Input, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import {MarkdownService} from 'angular2-markdown';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-build-lesson-intro',
  template: `
    <div class="panel panel-default">
      <div class="panel-body">
        <div class="btn btn-success" (click)="onSaveIntro()">{{text["Save"]}}</div>
        <div class="col-xs-6">
          <textarea
            class="form-control"
            [(ngModel)]="intro"
            rows="50">
          </textarea>
        </div>
        <div class="col-xs-6">
          <markdown [data]="intro">
          </markdown>
        </div>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['lesson-intro.component.css']
})

export class BuildLessonIntroComponent implements OnInit, OnDestroy {
  @Input() lessonId: string;
  @Input() text: Object;
  private componentActive = true;
  intro = '';

  constructor(
    private buildService: BuildService,
    private errorService: ErrorService,
    private markdown: MarkdownService
  ) {}

  ngOnInit() {
    this.customizeMarkdown();
    this.loadIntro();
  }

  onSaveIntro() {
    this.buildService
    .updateIntro(this.lessonId, this.intro)
    .takeWhile(() => this.componentActive)
    .subscribe(
      intro => {},
      error => this.errorService.handleError(error)
    );
  }

  private loadIntro() {
    console.log('loading intro');
    this.buildService
    .fetchIntro(this.lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      intro => {
        if (intro) {
          this.intro = intro.intro;
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private customizeMarkdown() {
    this.markdown.renderer.table = (header: string, body: string) => {
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

  ngOnDestroy() {
    this.componentActive = false;
  }
}
