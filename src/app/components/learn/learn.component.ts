import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router, NavigationEnd} from '@angular/router';
import {LearnService} from '../../services/learn.service';
import {UtilsService} from '../../services/utils.service';
import {ErrorService} from '../../services/error.service';
import {Course, Lesson, Language, Translation} from '../../models/course.model';
import {Exercise, LearnSettings} from '../../models/exercise.model';
import {config} from '../../app.config';
import 'rxjs/add/operator/takeWhile';

@Component({
  templateUrl: 'learn.component.html',
  styleUrls : ['learn.component.css']
})

export class LearnComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private courseId: string;
  private lesson: Lesson;
  private settings: LearnSettings;
  errorMsg: string;
  infoMsg: string;
  course: Course;
  exercises: Exercise[];
  text: Object = {};
  step = 'study';
  stepCompleted = [false, false, false];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private learnService: LearnService,
    private utilsService: UtilsService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.route.params
    .takeWhile(() => this.componentActive)
    .subscribe(
      params => {
        if (params['id']) {
          this.courseId = params['id'];
          this.getTranslations();
        }
      }
    );

    this.settings = {
      mute: false,
      color: true,
      delay: 2
    };
  }

  stepTo(step: string) {
    this.step = step;
  }

  onSkipStep(step: string) {
    console.log('skipping to', step);
    this.step = step;
  }

  onStepCompleted(step: string) {
    this.stepCompleted[0] = true;
  }

  onSettingsUpdated(settings: LearnSettings) {
    console.log('settings updated 2', settings);
    this.settings = settings;
  }

  private setText(translations: Translation[]) {
    this.text = this.utilsService.getTranslatedText(translations);
  }

  private getTranslations() {
    const lan = config.language.slice(0, 2);
    this.utilsService
    .fetchTranslations(lan, 'LearnComponent')
    .takeWhile(() => this.componentActive)
    .subscribe(
      translations => {
        this.getCourse(translations, this.courseId);
        this.setText(translations);
      },
      error => this.errorService.handleError(error)
    );
  }

  private getCourse(translations: Translation[], courseId: string) {
    this.learnService
    .fetchCourse(courseId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      course => {
        if (course) {
          if (course.isPublished) {
            this.course = course;
            this.getCurrentLesson(courseId);
          } else {
            this.infoMsg = this.utilsService.getTranslation(translations, 'notpublished');
          }
        } else {
          this.errorMsg = this.errorService.userError({code: 'learn01', src: courseId});
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private getCurrentLesson(courseId: string) {
    this.learnService
    .fetchFirstLesson(courseId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      lesson => {
        console.log(lesson);
        this.lesson = lesson;
        this.exercises = lesson.exercises.slice(0, 10);
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
