import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {MarkdownService} from 'angular2-markdown';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-learn-intro',
  template: `
    <markdown [data]="intro">
    </markdown>`,
  styleUrls: ['../markdown.css']
})

export class LearnIntroComponent implements OnInit, OnDestroy {
  @Input() lessonId: string;
  private componentActive = true;
  intro = '';

  constructor(
    private learnService: LearnService,
    private errorService: ErrorService,
    private markdown: MarkdownService
  ) {}

  ngOnInit() {
    this.loadIntro();
    this.customizeMarkdown();
  }

  private loadIntro() {
    this.learnService
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
    this.markdown.renderer.blockquote = (quote: string) => {
      return `<blockquote class="mdquote">${quote}</blockquote>`;
    };
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}