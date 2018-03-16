import {Component, OnInit, OnDestroy, ViewChild} from '@angular/core';
import {ActivatedRoute, Router, NavigationEnd} from '@angular/router';
import {maxLearnLevel, maxStreak, isLearnedLevel, LearnService} from '../../services/learn.service';
import {UtilsService} from '../../services/utils.service';
import {SharedService} from '../../services/shared.service';
import {UserService} from '../../services/user.service';
import {AuthService} from '../../services/auth.service';
import {ErrorService} from '../../services/error.service';
import {ModalConfirmComponent} from '../modals/modal-confirm.component';
import {ModalPromotionComponent} from '../modals/modal-promotion.component';
import {Course, Lesson, Language, Translation,
        Step, Level, LessonId, StepCount, StepData} from '../../models/course.model';
import {Exercise, ExerciseData, ExerciseExtraData, ExerciseResult, Points,
        ExerciseType, QuestionType} from '../../models/exercise.model';
import {LearnSettings} from '../../models/user.model';
import {Subject} from 'rxjs/Subject';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/takeWhile';

interface Map<T> {
  [K: string]: T;
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
  timeDelta?: number;
  daysBetweenReviews?: number;
  percentOverdue?: number;
  streak: string;
  isLast: boolean;
  isDifficult: boolean;
  isRepeat: boolean;
  isCorrect: boolean;
}

@Component({
  templateUrl: 'course.component.html',
  styleUrls : ['course.component.css']
})

export class LearnCourseComponent implements OnInit, OnDestroy {
  @ViewChild(ModalPromotionComponent) promotionComponent: ModalPromotionComponent;
  private componentActive = true;
  private courseId: string;
  private settings: LearnSettings;
  private settingsUpdated = false;
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
  isLessonReady = false;
  exercisesStarted = false;
  exercisesInterrupted: Subject<boolean> = new Subject();
  stepcountUpdated: BehaviorSubject<Map<StepCount>> = new BehaviorSubject<Map<StepCount>>({});
  lessonChanged: Subject<Lesson> = new Subject();
  continueCourseLevel: Subject<boolean> = new Subject();
  level = Level;
  isDemo: boolean;
  rankKey: string;
  rankNr: number;
  routeStep: string;
  isCourseDone = false;
  loopCount = 0;
  isError = false;

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
    this.settings = this.userService.user.jazyk.learn;
    this.subscribe();
  }

  stepTo(i: number) {
    if (this.currentStep !== i) {
      this.errorService.clearError();
      this.currentStep = i;
      this.courseLevel = this.steps[i].level;
    } else if (this.courseLevel === Level.Course) {
      // Continue course level
      this.continueCourseLevel.next(true);
    }
  }

  getGender(): string {
    return this.userService.user.main.gender || 'm';
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
      this.log('User aborted exercises');
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
    this.routeStep = '';
    this.lessonSelected(lesson);
  }

  onRehearseLesson(lesson: Lesson) {
    this.lessonSelected(lesson);
  }

  onCourseCompleted(isCompleted: boolean) {
    if (isCompleted) {
      this.isCourseDone = true;
    }
  }

  onContinueCourse() {
    this.router.navigate(['/learn/course/' + this.courseId]);
  }

  capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  private validateCourseStep(step: string): string {
    if (step && step !== 'overview') {
      if (step === 'review' || step === 'difficult' || step === 'exam') {
        this.courseLevel = Level.Course;
        this.routeStep = step;
        return step;
      } else {
        this.router.navigate(['/learn/course/' + this.courseId]);
      }
    } else {
      this.courseLevel = Level.Lesson;
      if (step === 'overview') {
        this.routeStep = step;
        this.currentStep = 0;
      }
    }
  }

  private nextStep() {
    const lessonSteps = this.steps.filter(step => step.level === Level.Lesson);
    if (this.currentStep < lessonSteps.length - 1) {
      this.currentStep++;
    } else {
      this.getNextLesson(this.lesson._id);
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
            this.log(`Loaded course '${this.course.name}'`);
          } else {
            this.infoMsg = this.utilsService.getTranslation(translations, 'notpublished');
          }
        } else {
          this.isError = true;
          this.errorMsg = this.errorService.userError({code: 'learn01', src: courseId});
        }
      },
      error => {
        this.errorService.handleError(error);
        this.isError = true;
      }
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
        this.processStepResults(results);
      },
      error => this.errorService.handleError(error)
    );
  }

  private processStepResults(results: StepData) {
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
    if (this.lesson.rehearseStep === step.name) {
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
    let defaultStep: number = null;
    if (this.lesson.rehearseStep) {
      this.currentStep = this.getStepNr(this.lesson.rehearseStep);
    } else {
      if (this.routeStep === 'overview') {
        // defaultStep = 0;
      } else if (results > 0) {
        // When pressing button 'continue course' go to exercises;
        // if none, go to study; if none, go to next lesson
        if (this.hasStep('practise') && this.countPerStep['practise'].nrRemaining > 0) {
          defaultStep = this.getStepNr('practise');
          this.currentStep = defaultStep;
        } else if (this.hasStep('study')) {
          if (this.countPerStep['study'].nrRemaining > 0) {
            defaultStep = this.getStepNr('study');
          } else {
            // No exercises left in lesson -> go to next lesson
            this.getNextLesson(this.lesson._id);
          }
        }
      } else {
        // new course: show intro if it exists otherwise start dialogue otherwise start study;
        if (this.hasStep('intro')) {
          defaultStep = this.getStepNr('intro');
        } else if (this.hasStep('dialogue')) {
          defaultStep = this.getStepNr('dialogue');
        } else if (this.hasStep('study')) {
          defaultStep = this.getStepNr('study');
        } else if (this.hasStep('practise')) {
          defaultStep = this.getStepNr('practise');
        }
      }
      if (defaultStep !== null) {
        this.currentStep = defaultStep;
        this.isLessonReady = true;
        this.lessonChanged.next(this.lesson);
      } else {
        if (this.loopCount < 1) {
          // Course is at the end
          // Start again from the beginning in case not all exercises were done
          this.loopCount++; // to prevent infinite loop
          this.getFirstLesson();
        } else {
          // Course is done
          this.currentStep = 0;
          this.isLessonReady = true;
        }
      }
    }
  }

  private setCourseStep() {
    const step = this.courseStep;
    if (this.hasStep(step)) {
      this.currentStep = this.getStepNr(step);
      this.isLessonReady = true;
    }
  }

  hasStep(stepName: string): boolean {
    return this.steps.find(step => step.name === stepName) ? true : false;
  }

  private getStepNr(stepName: string): number {
    let stepNr = -1;
    if (this.steps) {
      this.steps.forEach( (step, i) => {
        if (step.name === stepName) {
          stepNr = i;
        }
      });
    }
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
          this.countPerStep[result.step] = {nrDone: result.nrDone || 0, nrRemaining: Math.max(0, total - result.nrDone || 0)};
        }
      });
    }
    // Fill in step count for the steps without a result
    this.steps.forEach(step => {
      total = step.name === 'study' ? studyTotal : lessonTotal;
      if (step.level === Level.Lesson && !this.countPerStep[step.name]) {
        this.countPerStep[step.name] = {nrDone: 0, nrRemaining: Math.max(0, total)};
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
    const lastResult: Map<ResultData> = {}, // Get most recent result per exercise (for isLearned && reviewTime)
          streak: Map<string> = {}, // Get streaks for exercise
          allCorrect: Map<boolean> = {}, // Exercise is only correct if all answers for an exercise are correct
          isRepeat = !!this.lesson.rehearseStep,
          result = {
            courseId: this.course._id,
            lessonId: this.courseLevel === Level.Lesson ? this.lesson._id : undefined,
            step,
            data: []
          };
    let pointsEarned = 0;
    if (data && data.length > 0) { // No data for study repeats
      // calculate bonus for % correct
      let correctCount = 0;
      data.forEach((item) => {
        correctCount = correctCount + (item.data.isCorrect ? 1 : 0);
      });
      const correctBonus = this.getCorrectBonus(correctCount, data.length, isRepeat, step);
      data.forEach( (item, i) => {
        item.data.points.correct = correctBonus;
        pointsEarned += item.data.points.total();
        streak[item.exercise._id] = this.buildStreak(streak[item.exercise._id], item.result, item.data);
        const newResult: ResultData = {
          exerciseId: item.exercise._id,
          tpe: item.exercise.tpe,
          timeDelta: item.data.timeDelta,
          done: item.data.isDone || false,
          points: item.data.points.total() || 0,
          learnLevel: isRepeat ? 0 : (Math.min(maxLearnLevel, item.data.learnLevel || 0)),
          streak: isRepeat ? '' : streak[item.exercise._id],
          sequence: i,
          isLast: false,
          isDifficult: false,
          isRepeat,
          isCorrect: item.data.isCorrect,
          lessonId: item.result ? item.result.lessonId : this.lesson._id
        };
        lastResult[item.exercise._id] = newResult;
        allCorrect[item.exercise._id] = allCorrect[item.exercise._id] !== false ? item.data.isCorrect  : false;
        result.data.push(newResult);
      });
      this.checkLastResult(step, lastResult, allCorrect, data);

      if (!this.lesson.rehearseStep) {
        this.updateStepCount(step, lastResult);
      }
      this.log(`Total points earned: ${pointsEarned}`);
      this.learnService
      .saveUserResults(JSON.stringify(result))
      .takeWhile(() => this.componentActive)
      .subscribe(
        totalScore => {
          this.log('Saved exercise answers');
          if (totalScore) {
            // add results to data object
            result.data.forEach((resultItem, i) => {
              data[i].result = resultItem;
            });
            this.checkStepCount();
            this.checkNewRank(totalScore, pointsEarned);
          }
        },
        error => this.errorService.handleError(error)
      );
    }
  }

  private checkNewRank(currentScore: number, newPoints: number) {
    const currentRank = this.utilsService.getRank(currentScore),
          oldRank = this.utilsService.getRank(currentScore - newPoints);
    if (currentRank > oldRank) {
      if (this.promotionComponent) {
        // Show promotion modal
        this.rankNr = currentRank || 0;
        this.rankKey = 'rank' + (this.rankNr).toString() + this.userService.user.main.gender || 'm';
        this.promotionComponent.doShowModal();
      }
    }
  }

  private buildStreak(streak: string, result: ExerciseResult, data: ExerciseExtraData): string {
    let newStreak = '';

    if (result) {
      newStreak = streak || result.streak || '';
    }
    if (data.questionType !== QuestionType.Preview) {
      newStreak += data.isCorrect ? '1' : data.isAlmostCorrect ? '2' : '0';
    }

    return newStreak.slice(-maxStreak);
  }

  private getCorrectBonus(correctCount: number, totalCount: number, isRepeat: boolean, step: string): number {
    if (totalCount > 1 && !isRepeat && step !== 'study') {
      return Math.max(0, Math.trunc(((correctCount / totalCount * 100) - 60) * 0.5));
    } else {
      return 0;
    }
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
        if (step === 'review' || (step === 'practise' && lastResult[key].learnLevel || 0) >= isLearnedLevel) {
          lastResult[key].isLearned = true;
          // Calculate review time
          const exercise: ExerciseData = data.find(ex => ex.exercise._id === key);
          this.calculateReviewTime(lastResult[key], allCorrect[key], exercise);
        } else if (this.courseLevel === Level.Course) {
          // copy review time over to new doc - for overview step
          const exercise: ExerciseData = data.find(ex => ex.exercise._id === key);
          lastResult[key].daysBetweenReviews = exercise.result.daysBetweenReviews || undefined;
        }
        lastResult[key].isLast = true;
      }
    }
  }

  private calculateReviewTime(result: ResultData, isCorrect: boolean, exercise: ExerciseData) {
    if (exercise) {
      const difficulty = exercise.exercise.difficulty || this.getInitialDifficulty(exercise.exercise) || 30,
            dateLastReviewed = exercise.result ? exercise.result.dt : new Date(),
            daysBetweenReviews = exercise.result ? exercise.result.daysBetweenReviews || 0.25 : 0.25,
            performanceRating = exercise.data.grade / 5 || 0.6;
      let difficultyPerc = difficulty / 100 || 0.3,
          percentOverdue = 1,
          newDaysBetweenReviews = 1;

      if (isCorrect) {
        const daysSinceLastReview = this.learnService.getDaysBetweenDates(new Date(dateLastReviewed), new Date());
        percentOverdue = Math.min(2, daysSinceLastReview / daysBetweenReviews);
      }
      const performanceDelta = this.learnService.clamp((8 - 9 * performanceRating) / 17, -1, 1);
      difficultyPerc += percentOverdue * performanceDelta;
      const difficultyWeight = 3 - 1.7 * difficultyPerc;
      if (isCorrect) {
        newDaysBetweenReviews = daysBetweenReviews * (1 + (difficultyWeight - 1) * percentOverdue);
      } else {
        newDaysBetweenReviews = daysBetweenReviews * Math.max(0.25, 1 / (Math.pow(difficultyWeight, 2)));
      }
      result.daysBetweenReviews = newDaysBetweenReviews;
    }
  }

  private checkIfDifficult(step: string, streak: string): boolean {
    // Checks if the word has to be put in the difficult step
    let isDifficult = false;
    if ((step !== 'study') && streak) {
      let tmpStreak = streak.slice(-5),
          correctCount = (tmpStreak.match(/1/g) || []).length,
          inCorrectCount = tmpStreak.length - correctCount;
      if (inCorrectCount > 1) {
      // Check how many incorrect in last 5 results
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
    return difficulty;
  }

  private updateStepCount(step: string, lastResult: Map<ResultData>) {
    let done: number,
        remaining: number;
    const nrOfResults = Object.keys(lastResult).length;

    // Update count before save
    switch (step) {
      case 'study':
        // Studied - Decrease study count
        done = this.countPerStep[step].nrDone + nrOfResults;
        remaining = Math.max(0, this.countPerStep[step].nrRemaining - nrOfResults);
        this.countPerStep[step] = {nrDone: done, nrRemaining: remaining};
        // Studied - Increase practise count
        remaining = this.countPerStep['practise'].nrRemaining + nrOfResults;
        this.countPerStep['practise'].nrRemaining = Math.max(0, remaining);
      break;
      case 'practise':
        // Check which results have isLearned flag
        for (const key in lastResult) {
          if (lastResult.hasOwnProperty(key)) {
            if (lastResult[key].isLearned === true) {
              // Learned - Decrease practise count
              remaining = this.countPerStep['practise'].nrRemaining - 1;
              this.countPerStep['practise'].nrRemaining = Math.max(0, remaining);
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
            }
          }
        };
      break;
      case 'review':
        remaining = this.countPerStep['review'].nrRemaining - nrOfResults;
        this.countPerStep['review'].nrRemaining = Math.max(0, remaining);
      break;
    }
  }

  private checkStepCount() {
    // Update stepcount with data from db
    this.learnService
    .fetchStepData(this.course._id, this.lesson._id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      stepData => {
        if (stepData) {
          let updated = false;
          // Difficult
          if (stepData.difficult !== this.countPerStep['difficult'].nrRemaining) {
            this.countPerStep['difficult'].nrRemaining = stepData.difficult;
            updated = true;
          }
          // Review
          if (stepData.review !== this.countPerStep['review'].nrRemaining) {
            this.countPerStep['review'].nrRemaining = stepData.review;
            updated = true;
          }
          if (stepData.lesson) {
            const totalWords = this.lesson.exercises.filter(exercise => exercise.tpe === ExerciseType.Word).length;
            // Study
            const study = stepData.lesson.find(count => count.step === 'study');
            if (study && study.nrDone !== this.countPerStep['study'].nrDone) {
              this.countPerStep['study'].nrDone = study.nrDone;
              this.countPerStep['study'].nrRemaining = Math.max(0, totalWords - study.nrDone);
              updated = true;
            }
            // Practise
            const practise = stepData.lesson.find(count => count.step === 'practise');
            if (practise && practise.nrDone !== this.countPerStep['practise'].nrDone) {
              this.countPerStep['practise'].nrDone = practise.nrDone;
              this.countPerStep['practise'].nrRemaining = Math.max(0, this.countPerStep['study'].nrRemaining - practise.nrDone);
              updated = true;
            }
          }
          if (updated) {
            this.stepcountUpdated.next(this.countPerStep);
          }
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  /* Lesson selector */
  private lessonSelected(lesson: Lesson) {
    if (lesson) {
      this.lesson = lesson;
      this.getStepData();
    }
  }

  private getCurrentLesson() {
    // Check where this course was left off
    if (!this.isDemo) {
      this.fetchMostRecentLesson();
    } else {
      this.getFirstLesson();
    }
  }

  private fetchMostRecentLesson() {
    this.learnService
    .fetchMostRecentLesson(this.course._id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      lessonId => {
        if (lessonId) {
          // set chapter & lesson to the latest result
          this.getLesson(lessonId);
        } else {
          // start from beginning of the course
          this.log('No results yet; start from beginning.');
          this.getFirstLesson();
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private getLesson(lessonId: string) {
    // Get data and start lesson
    this.log('Fetching lesson data');
    this.learnService
    .fetchLesson(lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      (lesson: Lesson) => {
        if (lesson) {
          this.log(`Fetched lesson data for lesson '${lesson.name}'`);
          this.lessonSelected(lesson);
        } else {
          // Lesson does not exist, start from beginning
          this.getFirstLesson();
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private getFirstLesson() {
    // Get first lesson from course data
    const chapterLessons = this.sortChapters().filter(lesson => lesson.lessonIds.length > 0),
          chapterLesson = chapterLessons[0];
    if (chapterLesson) {
      const lessonId = chapterLesson.lessonIds[0];
      this.getLesson(lessonId);
    }
  }

  private getNextLesson(currentLessonId: string) {
    // Go to next lesson
    let currentFound = false,
        newLessonId;
    this.sortChapters().forEach(chapter => {
      chapter.lessonIds.forEach(lessonId => {
        if (currentFound && !newLessonId) {
          newLessonId = lessonId;
        } else {
          currentFound = currentLessonId === lessonId;
        }
      });
    });
    if (newLessonId) {
      this.getLesson(newLessonId);
    } else {
      // There is no new lesson; course is done
      this.currentStep = 0;
      this.isLessonReady = true;
    }
  }

  private sortChapters(): LessonId[] {
    // Move empty chapter to the back
    const sortedChapters = this.course.lessons;
    if (sortedChapters && sortedChapters.length) {
      const firstChapter = sortedChapters[0];
      if (firstChapter.chapter === '') {
        // Chapter is empty; move to the back
        sortedChapters.shift();
        sortedChapters.push(firstChapter);
      }
    }
    return sortedChapters;
  }

  private subscribe() {
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
    this.sharedService.exerciseModeChanged
    .takeWhile(() => this.componentActive)
    .subscribe(
      (started: boolean) => {
        this.exercisesStarted = started;
        if (started) {
          this.log(`Starting lesson '${this.lesson.name}'`);
        }
      }
    );
  }

  private log(message: string) {
    this.sharedService.sendEventMessage({
      message,
      source: 'LearnCourseComponent'
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
