import {Component, Input, Output, EventEmitter, OnInit, OnDestroy} from '@angular/core';
import {LearnService} from '../../services/learn.service';
import {PreviewService} from '../../services/preview.service';
import {ErrorService} from '../../services/error.service';
import {Lesson, Step, Level, Intro} from '../../models/course.model';
import {Subject} from 'rxjs';
import {takeWhile} from 'rxjs/operators';

@Component({
  selector: 'km-learn-intro',
  templateUrl: 'step-intro.component.html',
  styleUrls: ['step.component.css']
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
    private previewService: PreviewService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.previewService.loadAudioButtonScript();
    this.init();
    this.checkLessonChanged();
  }

  onContinue() {
    this.stepCompleted.emit();
  }

  private init() {
    this.checkNextStep();
    this.loadIntro();
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
    .pipe(takeWhile(() => this.componentActive))
    .subscribe((lesson: Lesson) => {
      this.lesson = lesson;
      this.init();
      window.scroll(0, 0);
    });
  }

  private loadIntro() {
    this.learnService
    .fetchIntro(this.lesson._id)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      intro => this.intro = intro,
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
