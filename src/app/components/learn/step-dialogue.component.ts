import {Component, EventEmitter, Input, Output, OnInit, OnDestroy} from '@angular/core';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {Dialogue, Step, Level, LanPair, Lesson} from '../../models/course.model';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-learn-dialogue',
  template: `
  <section style="padding: 12px;">
    <km-dialogue
      [languagePair]="lanPair"
      [dialogue]="lesson.dialogue">
    </km-dialogue>

    <button *ngIf="buttonText"
      type="button"
      class="btn btn-success"
      (click)="onContinue();">
      {{text[buttonText]}}
    </button>
  </section>`,
  styleUrls: ['step.component.css']
})

export class LearnDialogueComponent implements OnInit, OnDestroy {
  @Input() lesson: Lesson;
  @Input() private lessonChanged: Subject<Lesson>;
  @Input() private steps: Step[];
  @Input() lanPair: LanPair;
  @Input() text: Object;
  @Output() stepCompleted = new EventEmitter();
  private componentActive = true;
  dialogue: Dialogue;
  buttonText = '';

  constructor(
    private learnService: LearnService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.init();
    this.checkLessonChanged();
  }

  onContinue() {
    this.stepCompleted.emit();
  }

  private init() {
    console.log('steps dialogue', this.steps, this.lesson);
    this.checkNextStep();
  }

  private checkNextStep() {
    // Check what to show on next button
    if (this.steps) {
      const lessonSteps = this.steps.filter(step => step.level === Level.Lesson);
      if (lessonSteps[lessonSteps.length - 1].name === 'dialogue') {
        // this is the last step -> go to next lesson
        this.buttonText = 'ToNextLesson';
      } else {
        const currentStep = this.steps[1].name === 'dialogue' ? 1 : 2;
        if (this.steps[currentStep + 1].name === 'study') {
          this.buttonText = 'StartStudy';
        } else {
          this.buttonText = 'GoToPractise';
        }
      }
    }
  }

  private checkLessonChanged() {
    this.lessonChanged
    .takeWhile(() => this.componentActive)
    .subscribe((lesson: Lesson) => {
      console.log('LESSON CHANGED in dialogue TO ', lesson.name);
      this.lesson = lesson;
      this.init();
      window.scroll(0, 0);
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
