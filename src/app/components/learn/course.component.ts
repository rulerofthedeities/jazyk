import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router, NavigationEnd} from '@angular/router';
import {LearnService} from '../../services/learn.service';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {Course, Lesson, Language, Translation} from '../../models/course.model';
import {Exercise, ExerciseData, LearnSettings} from '../../models/exercise.model';
import 'rxjs/add/operator/takeWhile';

interface Map<T> {
  [K: string]: T;
}

@Component({
  templateUrl: 'course.component.html',
  styleUrls : ['course.component.css']
})

export class LearnCourseComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private courseId: string;
  private settings: LearnSettings;
  lesson: Lesson;
  errorMsg: string;
  infoMsg: string;
  course: Course;
  exercises: Exercise[];
  text: Object = {};
  currentStep = 0;
  stepCompleted: Map<boolean> = {};
  steps = ['intro', 'study', 'practise', 'test', 'review', 'exam'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private learnService: LearnService,
    private utilsService: UtilsService,
    private userService: UserService,
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
      delay: 2,
      keyboard: false
    };
  }

  stepTo(i: number) {
    this.currentStep = i;
  }

  onSkipStep() {
    if (this.currentStep < this.steps.length) {
      this.currentStep++;
    }
  }

  onStepCompleted(step: string, data: ExerciseData[]) {
    this.stepCompleted[step] = true;
    this.saveAnswers(step, data);
  }

  onSettingsUpdated(settings: LearnSettings) {
    this.settings = settings;
  }

  private setText(translations: Translation[]) {
    this.text = this.utilsService.getTranslatedText(translations);
  }

  private getTranslations() {
    this.utilsService
    .fetchTranslations(this.userService.user.lan, 'LearnComponent')
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
        this.lesson = lesson;
        this.setSteps();
        this.exercises = lesson.exercises.slice(0, 10);
      },
      error => this.errorService.handleError(error)
    );
  }

  private setSteps() {
    const steps = [];
    this.steps.forEach((step, i) => {
      if (step === 'review' || this.lesson.exerciseTpes[step].active) {
        steps.push(step);
        this.stepCompleted[step] = false;
      }
    });
    this.steps = steps;
  }

  private saveAnswers(step: string, data: ExerciseData[]) {
    console.log('saving answers', step, data);
    console.log('course', this.course._id);
    // check if user is logged in
    // save course id + exercise id + user id
    // must be idempotent?
    // for study, set flag studyDone
    // string with 0's or 1's for practise / test??
    // check algorithm to see what other data is required
    // http://www.blueraja.com/blog/477/a-better-spaced-repetition-learning-algorithm-sm2

    const result = {
      courseId: this.course._id,
      userId: this.userService.user._id,
      step,
      data: []
    };
    data.forEach(item => {
      result.data.push({
        exerciseId: item.exercise._id,
        result: item.data.isDone
      });
    });
    console.log('result:', result);
    this.userService
    .saveUserResults(JSON.stringify(result))
    .takeWhile(() => this.componentActive)
    .subscribe(
      userResult => {
        console.log('saved result', userResult);
        if (userResult) {

        }
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
