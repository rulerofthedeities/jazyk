import {Component, Input, Output, EventEmitter, OnInit, OnDestroy} from '@angular/core';
import {MarkdownService} from 'angular2-markdown';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {Lesson} from '../../models/course.model';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-learn-intro',
  template: `
    <markdown [data]="intro">
    </markdown>

    <button type="button" class="btn btn-success" (click)="onStartStudy();">
      {{text["StartStudy"]}}
    </button>`,
  styleUrls: ['../markdown.css']
})

export class LearnIntroComponent implements OnInit, OnDestroy {
  @Input() private lesson: Lesson;
  @Input() private lessonChanged: Subject<Lesson>;
  @Input() text: Object;
  @Output() stepCompleted = new EventEmitter();
  private componentActive = true;
  intro = '';

  constructor(
    private learnService: LearnService,
    private errorService: ErrorService,
    private markdown: MarkdownService
  ) {}

  ngOnInit() {
    this.init();
    this.checkLessonChanged();
  }

  onStartStudy() {
    this.stepCompleted.emit();
  }

  private init() {
    this.loadIntro();
    this.customizeMarkdown();
  }

  private checkLessonChanged() {
    this.lessonChanged
    .takeWhile(() => this.componentActive)
    .subscribe((event: Lesson) => {
      console.log('LESSON CHANGED in intro TO ', event.name);
      this.lesson = event;
      this.init();
    });
  }

  private loadIntro() {
    this.learnService
    .fetchIntro(this.lesson._id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      intro => this.intro = intro.intro,
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
