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
  private nrOfQuestions = 5;
  private settingsUpdated = false;
  lesson: Lesson;
  errorMsg: string;
  infoMsg: string;
  course: Course;
  exercises: Exercise[];
  results: ExerciseResult[];
  text: Object = {};
  currentStep = 0;
  stepCompleted: Map<boolean> = {};
  steps = ['intro', 'study', 'practise', 'test', 'review', 'exam', 'overview'];
  isReady = false;
  isStepsReady = false;

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
    if (this.settingsUpdated) {
      this.saveSettings();
    }
  }

  onSettingsUpdated(settings: LearnSettings) {
    this.settingsUpdated = true;
    this.settings = settings;
  }

  onLessonSelected(lesson: Lesson) {
    console.log('new lesson selected', lesson);
    this.lesson = lesson;
    this.getStepData();
    this.exercises = lesson.exercises.slice(0, this.nrOfQuestions);
    this.isReady = true;
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

  private getStepData() {
    this.learnService
    .getResultsCount(this.courseId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      results => {
        console.log('step count', results);
        if (results) {
          const courseTotal = this.course.exerciseCount;
          results.map(result => result.nrRemaining = Math.max(0, courseTotal - result.nrDone));
          this.results = results;
          console.log('step count2', results);
        }
        this.setSteps();
      },
      error => this.errorService.handleError(error)
    );
  }

  private setSteps() {
    const steps = [];
    this.steps.forEach((step, i) => {
      if (step === 'review' || (this.lesson.exerciseTpes[step] && this.lesson.exerciseTpes[step].active)) {
        steps.push(step);
        this.stepCompleted[step] = false;
      }
    });
    this.steps = steps;
    this.isStepsReady = true;
  }

  private saveAnswers(step: string, data: ExerciseData[]) {
    console.log('saving answers', step, data);
    console.log('course', this.course._id);
    const result = {
      courseId: this.course._id,
      lessonId: this.lesson._id,
      step,
      data: []
    };
    data.forEach( (item, i) => {
      result.data.push({
        exerciseId: item.exercise._id,
        done: item.data.isDone,
        points: item.data.points || 0,
        learnLevel: item.data.learnLevel || 0,
        sequence: i // To find the last saved doc for docs with same save time
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

  private saveSettings() {
    console.log('saving settings');
    this.userService
    .saveLearnSettings(this.settings)
    .takeWhile(() => this.componentActive)
    .subscribe(
      saved => {
        this.settingsUpdated = false;
        console.log('settings saved', saved);
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
