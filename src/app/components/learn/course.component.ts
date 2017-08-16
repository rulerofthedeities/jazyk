import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router, NavigationEnd} from '@angular/router';
import {LearnService} from '../../services/learn.service';
import {UtilsService} from '../../services/utils.service';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {Course, Lesson, Language, Translation} from '../../models/course.model';
import {Exercise, ExerciseData, ExerciseResult} from '../../models/exercise.model';
import {LearnSettings} from '../../models/user.model';
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
  private nrOfQuestions = 5; // Get from user settings
  lesson: Lesson;
  errorMsg: string;
  infoMsg: string;
  course: Course;
  exercises: Exercise[];
  results: ExerciseResult[];
  text: Object = {};
  currentStep = 0;
  stepCompleted: Map<boolean> = {};
  steps = ['intro', 'study', 'practise', 'test', 'review', 'exam'];
  isReady = false;

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

    this.settings = this.userService.user.jazyk.learn;
    this.nrOfQuestions = this.settings.nrOfWords || this.nrOfQuestions;
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
        this.exercises = lesson.exercises.slice(0, this.nrOfQuestions);
        this.fetchPreviousResults(this.exercises);
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

  private fetchPreviousResults(exercises: Exercise[]) {
    const exerciseIds = exercises.map(exercise => exercise._id);

    this.learnService
    .getPreviousResults(this.userService.user._id, this.course._id, 'study', exerciseIds)
    .takeWhile(() => this.componentActive)
    .subscribe(
      results => {
        console.log('previous results', results);
        if (results) {
          console.log(results.length);
          this.results = results;
        }
        this.isReady = true;
      },
      error => this.errorService.handleError(error)
    );
  }

  private saveAnswers(step: string, data: ExerciseData[]) {
    console.log('saving answers', step, data);
    console.log('course', this.course._id);

    const result = {
      courseId: this.course._id,
      userId: this.userService.user._id,
      step,
      data: []
    };
    data.forEach(item => {
      result.data.push({
        exerciseId: item.exercise._id,
        done: item.data.isDone,
        points: item.data.points || 0
      });
    });
    console.log('result:', result);
    this.learnService
    .saveUserResults(JSON.stringify(result))
    .takeWhile(() => this.componentActive)
    .subscribe(
      userResult => {
        console.log('saved result', userResult);
        if (userResult) {
          // add results to data object
          result.data.forEach((resultItem, i) => {
            data[i].result = resultItem;
          });
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
