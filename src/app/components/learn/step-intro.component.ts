import {Component, Input, Output, EventEmitter, OnInit, OnDestroy} from '@angular/core';
import {MarkdownService} from 'ngx-md';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {Lesson, Step, Level, Intro} from '../../models/course.model';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-learn-intro',
  template: `
  <section style="padding: 12px;">
    <div innerHtml="intro?.html | sanitizeHtml"></div>
    <button *ngIf="buttonText"
      type="button"
      class="btn btn-success"
      (click)="onContinue();">
      {{text[buttonText]}}
    </button>
  </section>`,
  styleUrls: ['../markdown.css', 'step.component.css']
})

export class LearnIntroComponent implements OnInit, OnDestroy {
  @Input() private lesson: Lesson;
  @Input() private lessonChanged: Subject<Lesson>;
  @Input() private steps: Step[];
  @Input() text: Object;
  @Output() stepCompleted = new EventEmitter();
  private componentActive = true;
  intro: Intro;
  buttonText: string;

  constructor(
    private learnService: LearnService,
    private errorService: ErrorService,
    private markdown: MarkdownService
  ) {}

  ngOnInit() {
    this.init();
    this.checkLessonChanged();
  }

  onContinue() {
    this.stepCompleted.emit();
  }

  private init() {
    this.checkNextStep();
    this.loadIntro();
    this.customizeMarkdown();
  }

  private checkNextStep() {
    // Check what to show on next button
    if (this.steps) {
      const lessonSteps = this.steps.filter(step => step.level === Level.Lesson);
      if (lessonSteps[lessonSteps.length - 1].name === 'intro') {
        // this is the last step -> go to next lesson
        this.buttonText = 'ToNextLesson';
      } else {
        switch (this.steps[2].name) {
          case 'dialogue': this.buttonText = 'GoTo' + this.lesson.dialogue.tpe;
          break;
          case 'study': this.buttonText = 'StartStudy';
          break;
          default: this.buttonText = 'GoToPractise';
        }
      }
    }
  }

  private checkLessonChanged() {
    this.lessonChanged
    .takeWhile(() => this.componentActive)
    .subscribe((lesson: Lesson) => {
      console.log('LESSON CHANGED in intro TO ', lesson.name);
      this.lesson = lesson;
      this.init();
    });
  }

  private loadIntro() {
    this.learnService
    .fetchIntro(this.lesson._id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      intro => this.intro = intro,
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
