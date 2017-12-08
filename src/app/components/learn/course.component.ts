import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router, NavigationEnd} from '@angular/router';
import {LearnService} from '../../services/learn.service';
import {UtilsService} from '../../services/utils.service';
import {SharedService} from '../../services/shared.service';
import {UserService} from '../../services/user.service';
import {AuthService} from '../../services/auth.service';
import {ErrorService} from '../../services/error.service';
import {ModalConfirmComponent} from '../modals/modal-confirm.component';
import {Course, Lesson, Language, Translation, Step, Level} from '../../models/course.model';
import {Exercise, ExerciseData, ExerciseResult, ExerciseType, QuestionType} from '../../models/exercise.model';
import {LearnSettings} from '../../models/user.model';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/takeWhile';

interface Map<T> {
  [K: string]: T;
}

interface StepCount {
  nrDone: number;
  nrRemaining: number;
  step?: string;
}

interface ResultData {
  exerciseId: string;
  lessonId: string;
  tpe: number;
  done: boolean;
  points: number;
  learnLevel: number;
  sequence: number; // To find the last saved doc for docs with same save time
  isLearned?: boolean;
  daysBetweenReviews?: number;
  percentOverdue?: number;
  streak: string;
  isLast: boolean;
  isDifficult: boolean;
  isCorrect: boolean;
}

@Component({
  templateUrl: 'course.component.html',
  styleUrls : ['course.component.css']
})

export class LearnCourseComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private courseId: string;
  private settings: LearnSettings;
  private settingsUpdated = false;
  private isLearnedLevel = 12; // minimum level before it is considered learned
  private courseStep: string; // Step to start with defined by route
  lesson: Lesson;
  errorMsg: string;
  infoMsg: string;
  course: Course;
  countPerStep: Map<StepCount> = {};
  text: Object = {};
  currentStep = 0;
  steps: Step[];
  courseLevel: Level;
  isStepsReady = false;
  exercisesStarted = false;
  maxStreak = 20;
  exercisesInterrupted: Subject<boolean> = new Subject();
  stepcountzero: Subject<boolean> = new Subject();
  level = Level;
  isDemo: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private learnService: LearnService,
    private sharedService: SharedService,
    private utilsService: UtilsService,
    private authService: AuthService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.isDemo = !this.authService.isLoggedIn();
    this.route.params
    .takeWhile(() => this.componentActive)
    .subscribe(
      params => {
        if (params['id']) {
          this.courseId = params['id'];
          this.courseStep = this.validateCourseStep(params['step']);
          this.getTranslations();
        }
      }
    );
    this.sharedService.exerciseModeChanged.subscribe(
      started => this.exercisesStarted = started
    );
    this.settings = this.userService.user.jazyk.learn;
  }

  stepTo(i: number) {
    this.currentStep = i;
    this.courseLevel = this.steps[i].level;
  }

  onSkipStep() {
    this.nextStep();
  }

  onStepBack() {
    this.previousStep();
  }

  onStartStudy() {
    this.stepTo(1);
  }

  onStepCompleted(step: string, data: ExerciseData[]) {
    if (!this.isDemo) {
      if (step === 'intro') {
        this.nextStep();
      } else {
        this.saveAnswers(step, data);
        if (this.settingsUpdated) {
          this.saveSettings();
        }
      }
    }
  }

  onExitExercises(confirm: ModalConfirmComponent) {
    confirm.showModal = true;
  }

  onExitConfirmed(exitOk: boolean) {
    if (exitOk) {
      this.sharedService.changeExerciseMode(false);
      this.exercisesInterrupted.next(true);
    }
  }

  onLessonCompleted(lessonId: string) {
    this.getNextLesson(lessonId);
  }

  onSettingsUpdated(settings: LearnSettings) {
    this.settingsUpdated = true;
    this.settings = settings;
  }

  onLessonSelected(lesson: Lesson) {
    this.lessonSelected(lesson);
  }

  onContinueCourse() {
    this.getCurrentLesson();
  }

  capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  private validateCourseStep(step: string): string {
    console.log('validating course step', step);
    if (step) {
      if (step === 'review' || step === 'difficult' || step === 'exam') {
        this.courseLevel = Level.Course;
        return step;
      } else {
        this.router.navigate(['/learn/course/' + this.courseId]);
      }
    } else {
      this.courseLevel = Level.Lesson;
    }
  }

  private nextStep() {
    if (this.currentStep < this.steps.length) {
      this.currentStep++;
    }
  }

  private previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  private setText(translations: Translation[]) {
    this.text = this.utilsService.getTranslatedText(translations);
  }

  private getTranslations() {
    this.utilsService
    .fetchTranslations(this.userService.user.main.lan, 'LearnComponent')
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
            this.getCurrentLesson();
            console.log('course', course);
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
    this.setSteps();
    if (!this.isDemo) {
      this.fetchStepData();
    } else {
      this.processStepResults(null);
    }
  }

  private fetchStepData() {
    this.learnService
    .fetchStepData(this.courseId, this.lesson._id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      results => {
        console.log('step data results:', results);
        this.processStepResults(results);
      },
      error => this.errorService.handleError(error)
    );
  }

  private processStepResults(results: any) {
    this.countPerStep = {};
    if (results) {
      this.getCourseStepCount(results);
      this.getLessonStepCount(results.lesson);
      if (this.courseLevel === Level.Lesson) {
        this.setDefaultLessonStep(results.lesson.length);
      } else {
        this.setCourseStep();
      }
    } else {
      // No data or not logged in
      this.getLessonStepCount(null);
      this.setDefaultLessonStep(null);
    }
    this.isStepsReady = true;
  }

  private setSteps() {
    const steps = this.utilsService.getSteps();
    this.steps = [];
    steps.forEach((step, i) => {
      if (this.showStep(step)) {
        this.steps.push(step);
      }
    });
  }

  private showStep(step: Step): boolean {
    if (step.alwaysShown) {
      return true;
    }
    if (this.lesson.exerciseSteps[step.name] && this.lesson.exerciseSteps[step.name].active) {
      if (step.name === 'study') {
        // Check if there are words to study
        const word = this.lesson.exercises.find(exercise => exercise.tpe === ExerciseType.Word);
        return word ? true : false;
      } else if (step.name === 'exam') {
        return this.learnService.getExamCount(this.course.totalCount) > 0 ? true : false;
      } else {
        return true;
      }
    }
  }

  private setDefaultLessonStep(results: number) {
    let defaultStep = 0;
    if (results > 0) {
      // When pressing button 'continue course'
      if (this.hasStep('study') && this.countPerStep['study'].nrRemaining > 0) {
        defaultStep = this.getStepNr('study');
      } else if (this.hasStep('practise')) {
        defaultStep = this.getStepNr('practise');
      }
    } else {
      // new course: show intro if it exists otherwise show button to start study;
      if (this.hasStep('intro')) {
        defaultStep = this.getStepNr('intro');
      } else if (this.hasStep('study')) {
        defaultStep = this.getStepNr('study');
      } else if (this.hasStep('practise')) {
        defaultStep = this.getStepNr('practise');
      }
    }
    this.currentStep = defaultStep;
  }

  private setCourseStep() {
    const step = this.courseStep;
    if (this.hasStep(step)) {
      this.currentStep = this.getStepNr(step);
    }
  }

  hasStep(stepName: string): boolean {
    return this.steps.find(step => step.name === stepName) ? true : false;
  }

  private getStepNr(stepName: string): number {
    let stepNr = -1;
    this.steps.forEach( (step, i) => {
      if (step.name === stepName) {
        stepNr = i;
      }
    });
    return stepNr;
  }

  private getCourseStepCount(count: any) {
    // Fill in default step count
    this.steps.forEach(step => {
      if (step.level === Level.Course && !this.countPerStep[step.name]) {
        this.countPerStep[step.name] = {nrDone: 0, nrRemaining: 0};
      }
    });
    this.countPerStep['difficult'].nrRemaining = count.difficult;
    this.countPerStep['review'].nrRemaining = count.review;
    if (this.countPerStep['exam']) {
      this.countPerStep['exam'].nrRemaining = this.learnService.getExamCount(this.course.totalCount);
    }
  }

  private getLessonStepCount(results: StepCount[]) {
    let total: number;
    const lessonTotal = this.lesson.exercises.length,
          studyTotal = this.lesson.exercises.filter(exercise => exercise.tpe === ExerciseType.Word).length;

    // Check how many results have been done per tab
    if (results && results.length > 0) {
      results.forEach(result => {
        total = result.step === 'study' ? studyTotal : lessonTotal;
        if (!this.countPerStep[result.step]) {
          this.countPerStep[result.step] = {nrDone: result.nrDone || 0, nrRemaining: total - result.nrDone || 0};
        }
      });
    }
    // Fill in step count for the steps without a result
    this.steps.forEach(step => {
      total = step.name === 'study' ? studyTotal : lessonTotal;
      if (step.level === Level.Lesson && !this.countPerStep[step.name]) {
        this.countPerStep[step.name] = {nrDone: 0, nrRemaining: total};
      }
    });
    // Practise step must have study finished or tpe != word
    if (this.countPerStep['practise'] && this.countPerStep['study']) { // Study is optional!!
      const diff = this.countPerStep['practise'].nrRemaining - this.countPerStep['study'].nrRemaining;
      if (!this.isDemo) {
        this.countPerStep['practise'].nrRemaining = Math.max(0, diff);
      }
    }
  }

  private saveAnswers(step: string, data: ExerciseData[]) {
    console.log('saving answers', step, data);
    const lastResult: Map<ResultData> = {}; // Get most recent result per exercise (for isLearned && reviewTime)
    const streak: Map<string> = {}; // Get streaks for exercise
    const allCorrect: Map<boolean> = {}; // Exercise is only correct if all answers for an exercise are correct
    const result = {
      courseId: this.course._id,
      lessonId: this.courseLevel === Level.Lesson ? this.lesson._id : undefined,
      step,
      data: []
    };
    if (data && data.length > 0) { // No data for study repeats
      data.forEach( (item, i) => {
        console.log('result', item);
        streak[item.exercise._id] =
          this.buildStreak(item.data.questionType, streak[item.exercise._id], item.result, item.data.isCorrect, item.data.isAlmostCorrect);
        const newResult: ResultData = {
          exerciseId: item.exercise._id,
          tpe: item.exercise.tpe,
          done: item.data.isDone || false,
          points: item.data.points || 0,
          learnLevel: item.data.learnLevel || 0,
          streak: streak[item.exercise._id],
          sequence: i,
          isLast: false,
          isDifficult: false,
          isCorrect: item.data.isCorrect,
          lessonId: item.result ? item.result.lessonId : this.lesson._id
        };
        lastResult[item.exercise._id] = newResult;
        allCorrect[item.exercise._id] = allCorrect[item.exercise._id] !== false ? item.data.isCorrect  : false;
        result.data.push(newResult);
      });
      console.log('Checking last result', result);
      this.checkLastResult(step, lastResult, allCorrect, data);
      this.updateStepCount(step, lastResult);
      console.log('Saving result', result);
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
  }

  private buildStreak(qTpe: QuestionType, streak: string, result: ExerciseResult, isCorrect: boolean, isAlmostCorrect: boolean): string {
    let newStreak = '';

    if (result) {
      newStreak = streak || result.streak || '';
    }
    if (qTpe !== QuestionType.Preview) {
      newStreak += isCorrect ? '1' : isAlmostCorrect ? '2' : '0';
    }

    newStreak = newStreak.slice(0, this.maxStreak);
    return newStreak;
  }

  private saveSettings() {
    this.userService
    .saveLearnSettings(this.settings)
    .takeWhile(() => this.componentActive)
    .subscribe(
      saved => {
        this.settingsUpdated = false;
      },
      error => this.errorService.handleError(error)
    );
  }

  private checkLastResult(step: string, lastResult: Map<ResultData>, allCorrect: Map<boolean>, data: ExerciseData[]) {
    // Only use the most recent result per exerciseid to determine isLearned / review time
    for (const key in lastResult) {
      if (lastResult.hasOwnProperty(key)) {
        lastResult[key].isDifficult = this.checkIfDifficult(step, lastResult[key].streak);
        // Check if word is learned
        if (step === 'review' || step === 'difficult' || (lastResult[key].learnLevel || 0) >= this.isLearnedLevel) {
          lastResult[key].isLearned = true;
          // Calculate review time
          const exercise: ExerciseData = data.find(ex => ex.exercise._id === key);
          this.calculateReviewTime(lastResult[key], allCorrect[key], exercise);
        }
        lastResult[key].isLast = true;
      }
    }
  }

  private calculateReviewTime(result: ResultData, isCorrect: boolean, exercise: ExerciseData) {
    console.log('algo - calculating review time for', exercise);
    if (exercise) {
      const difficulty = exercise.exercise.difficulty || this.getInitialDifficulty(exercise.exercise) || 30,
            dateLastReviewed = exercise.result ? exercise.result.dt : new Date(),
            daysBetweenReviews = exercise.result ? exercise.result.daysBetweenReviews || 0.25 : 0.25,
            performanceRating = exercise.data.grade / 5 || 0.6;
      let difficultyPerc = difficulty / 100 || 0.3,
          percentOverdue = 1,
          newDaysBetweenReviews = 1;
      console.log('algo - CALCULATE REVIEW TIME', exercise.exercise.foreign.word);
      console.log('algo - difficulty', difficulty);
      console.log('algo - dateLastReviewed', dateLastReviewed);
      console.log('algo - daysBetweenReviews', daysBetweenReviews);
      console.log('algo - performanceRating', performanceRating);

      if (isCorrect) {
        const daysSinceLastReview = this.learnService.getDaysBetweenDates(new Date(dateLastReviewed), new Date());
        percentOverdue = Math.min(2, daysSinceLastReview / daysBetweenReviews);
      }
      const performanceDelta = this.learnService.clamp((8 - 9 * performanceRating) / 17, -1, 1);
      console.log('algo - performanceDelta', performanceDelta);
      difficultyPerc += percentOverdue * performanceDelta;
      const difficultyWeight = 3 - 1.7 * difficultyPerc;
      console.log('algo - difficultyWeight', difficultyWeight);
      if (isCorrect) {
        newDaysBetweenReviews = daysBetweenReviews * (1 + (difficultyWeight - 1) * percentOverdue);
      } else {
        newDaysBetweenReviews = daysBetweenReviews * Math.max(0.25, 1 / (Math.pow(difficultyWeight, 2)));
      }
      console.log('algo - correct', isCorrect);
      console.log('algo - newDaysBetweenReviews', newDaysBetweenReviews);
      console.log('algo - percentOverdue', percentOverdue);
      result.daysBetweenReviews = newDaysBetweenReviews;
      result.percentOverdue = percentOverdue;
    }
  }

  private checkIfDifficult(step: string, streak: string): boolean {
    // Checks if the word has to be put in the difficult step
    let isDifficult = false;
    if ((step !== 'study') && streak) {
      // Check how many incorrect in last 5 results
      let tmpStreak = streak.slice(-5);
      let correctCount = (tmpStreak.match(/1/g) || []).length;
      let inCorrectCount = tmpStreak.length - correctCount;
      if (inCorrectCount > 1) {
        isDifficult = true;
      } else {
        // Check how many incorrect in last 10 results
        tmpStreak = streak.slice(-10);
        correctCount = (tmpStreak.match(/1/g) || []).length;
        inCorrectCount = tmpStreak.length - correctCount;
        if (inCorrectCount > 2) {
          isDifficult = true;
        }
      }
    }
    return isDifficult;
  }

  private getInitialDifficulty(exercise: Exercise): number {
    // Combination of character length & word length
    // Only if no difficulty has been set
    const word = exercise.foreign.word.trim(),
          lengthScore = Math.min(70, word.length * 3),
          wordScore =  Math.min(10, word.split(' ').length) * 5,
          difficulty = lengthScore + wordScore;
    console.log('difficulty for', word, difficulty);
    return difficulty;
  }

  private updateStepCount(step: string, lastResult: Map<ResultData>) {
    let done: number,
        remaining: number;
    const nrOfResults = Object.keys(lastResult).length;
    switch (step) {
      case 'study':
        // Studied - Decrease study count
        done = this.countPerStep[step].nrDone + nrOfResults;
        remaining = Math.max(0, this.countPerStep[step].nrRemaining - nrOfResults);
        this.countPerStep[step] = {nrDone: done, nrRemaining: remaining};
        // Studied - Increase practise count
        remaining = this.countPerStep['practise'].nrRemaining + nrOfResults;
        this.countPerStep['practise'].nrRemaining = remaining;
      break;
      case 'practise':
        // Check which results have isLearned flag
        for (const key in lastResult) {
          if (lastResult.hasOwnProperty(key)) {
            if (lastResult[key].isLearned === true) {
              // Learned - Decrease practise count
              remaining = this.countPerStep['practise'].nrRemaining - 1;
              this.countPerStep['practise'].nrRemaining = Math.max(0, remaining);
              if (this.countPerStep['practise'].nrRemaining === 0) {
                this.stepcountzero.next(true);
              }
            }
          }
        };
      break;
      case 'difficult':
        // Check which results have isDifficult false
        for (const key in lastResult) {
          if (lastResult.hasOwnProperty(key)) {
            if (lastResult[key].isDifficult === false) {
              // Not difficult anymore - Decrease difficult count
              remaining = this.countPerStep['difficult'].nrRemaining - 1;
              this.countPerStep['difficult'].nrRemaining = Math.max(0, remaining);
              if (this.countPerStep['difficult'].nrRemaining === 0) {
                this.stepcountzero.next(true);
              }
            }
          }
        };
      break;
      case 'review':
        remaining = this.countPerStep['review'].nrRemaining - nrOfResults;
        this.countPerStep['review'].nrRemaining = Math.max(0, remaining);
        if (this.countPerStep['review'].nrRemaining === 0) {
          this.stepcountzero.next(true);
        }
      break;
    }
  }

  /* Lesson selector */

  private lessonSelected(lesson: Lesson) {
    console.log('LESSON SELECTED', lesson);
    if (lesson) {
      this.lesson = lesson;
      this.getStepData();
    }
  }

  private getCurrentLesson() {
    // Check where this course was left off
    if (!this.isDemo) {
      this.fetchMostRecentLesson()
    } else {
      this.getFirstLesson();
    }
    
  }

  private fetchMostRecentLesson() {
    this.learnService
    .fetchMostRecentLesson(this.course._id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      userResult => {
        if (userResult && userResult.lessonId) {
          // set chapter & lesson to the latest result
          console.log('LESSON to load', userResult.lessonId);
          this.getLesson(userResult.lessonId);
        } else {
          // start from beginning of the course
          console.log('NO LESSON to load; start from beginning');
          this.getFirstLesson();
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private getLesson(lessonId: string) {
    // Get data and start lesson
    this.learnService
    .fetchLesson(lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      lesson => this.lessonSelected(lesson),
      error => this.errorService.handleError(error)
    );
  }

  private getFirstLesson() {
    // Get first lesson from course data
    const chapterLessons = this.course.lessons.filter(lesson => lesson.lessonIds.length > 0);
    const chapterLesson = chapterLessons[0];
    if (chapterLesson) {
      const lessonId = chapterLesson.lessonIds[0];
      this.getLesson(lessonId);
    }
  }

  private getNextLesson(currentLessonId: string) {
    // Go to next lesson
    let currentFound = false,
        newLessonId;
    this.course.lessons.forEach(chapter => {
      chapter.lessonIds.forEach(lessonId => {
        if (currentFound && !newLessonId) {
          newLessonId = lessonId;
        } else {
          currentFound = currentLessonId === lessonId;
        }
      });
    });
    if (newLessonId) {
      console.log('new lesson id', newLessonId);
      this.getLesson(newLessonId);
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
