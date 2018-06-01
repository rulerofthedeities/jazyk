import {Component, OnInit, OnDestroy, ViewChild} from '@angular/core';
import {Location} from '@angular/common';
import {ActivatedRoute, Router, NavigationEnd} from '@angular/router';
import {isLearnedLevel, maxLearnLevel, maxStreak} from '../../services/shared.service';
import {LearnService} from '../../services/learn.service';
import {UtilsService} from '../../services/utils.service';
import {SharedService} from '../../services/shared.service';
import {UserService} from '../../services/user.service';
import {AuthService} from '../../services/auth.service';
import {ErrorService} from '../../services/error.service';
import {ModalConfirmComponent} from '../modals/modal-confirm.component';
import {ModalPromotionComponent} from '../modals/modal-promotion.component';
import {Course, Lesson, Language, Translation, ResultData, Map,
        Step, Level, LessonId, StepCount, StepData, ProcessedData, AccessLevel} from '../../models/course.model';
import {Exercise, ExerciseData, ExerciseExtraData, ExerciseResult, Points,
        ExerciseType, QuestionType} from '../../models/exercise.model';
import {LearnSettings} from '../../models/user.model';
import {BehaviorSubject, Subject} from 'rxjs';
import {takeWhile, filter} from 'rxjs/operators';

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
    private location: Location,
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
    this.subscriptions();
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
    if (this.isDemo) {
      this.saveDemoAnswers(step, data);
    } else {
      this.saveAnswers(step, data);
    }
    if (this.settingsUpdated) {
      this.saveSettings();
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

  onGoToIntro(lesson: Lesson) {
    this.lessonSelected(lesson);
  }

  onCourseCompleted(isCompleted: boolean) {
    if (isCompleted) {
      this.isCourseDone = true;
    }
  }

  onContinueCourse() {
    this.router.navigate(['/learn/course/' + this.courseId + '/continue']);
  }

  capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  hasStep(stepName: string): boolean {
    return this.steps.find(step => step.name === stepName) ? true : false;
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
    .pipe(takeWhile(() => this.componentActive))
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
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      course => {
        if (course) {
          if (!course.isDemo && !this.authService.isLoggedIn()) {
            this.router.navigate(['/auth/signin'], {queryParams: {returnUrl: this.router.url}});
          }
          if (course.isPublished || this.isCourseAuthor(course)) {
            this.course = course;
            this.getCurrentLesson();
            this.log(`Loaded course '${this.course.name}'`);
            this.utilsService.setPageTitle(null, course.name);
          } else {
            this.isError = true;
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

  private isCourseAuthor(course: Course): boolean {
    return this.userService.hasAccessLevel(course.access, AccessLevel.Author);
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
    .pipe(takeWhile(() => this.componentActive))
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
    } else if (this.lesson.skipToStep) {
      this.currentStep = this.getStepNr(this.lesson.skipToStep);
    } else {
      if (this.routeStep === 'overview') {
        defaultStep = 0;
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
            defaultStep = -1;
            // No exercises left in lesson -> go to next lesson
            this.getNextLesson(this.lesson._id);
          }
        } else {
          defaultStep = -1;
          // No exercises left in lesson -> go to next lesson
          this.getNextLesson(this.lesson._id);
        }
      } else {
        // new course: show intro if it exists otherwise start dialogue otherwise start study;
        defaultStep = this.getNextStep(0);
      }
      // Only intro or dialogue done, go to next step
      if (defaultStep === null) {
        if (this.hasStep('dialogue') && this.countPerStep['dialogue'].nrDone > 0) {
          defaultStep = this.getNextStep(this.getStepNr('dialogue'));
        } else {
          if (this.hasStep('intro') && this.countPerStep['intro'].nrDone > 0) {
            defaultStep = this.getNextStep(this.getStepNr('intro'));
          } else {
            defaultStep = this.getStepNr('intro');
          }
        }
      }
      if (defaultStep !== -1) { // ignore steps, already loading the next lesson
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
  }

  private getNextStep(startStepNr: number): number {
    let nextStep: number = null;
    startStepNr++;
    if (this.hasStep('intro') && startStepNr <= this.getStepNr('intro')) {
      nextStep = this.getStepNr('intro');
    } else if (this.hasStep('dialogue') && startStepNr <= this.getStepNr('dialogue')) {
      nextStep = this.getStepNr('dialogue');
    } else if (this.hasStep('study') && startStepNr <= this.getStepNr('study')) {
      nextStep = this.getStepNr('study');
    } else if (this.hasStep('practise') && startStepNr <= this.getStepNr('practise')) {
      nextStep = this.getStepNr('practise');
    } else {
      // No exercises left in lesson -> go to next lesson
      this.getNextLesson(this.lesson._id);
    }
    return nextStep;
  }

  private setCourseStep() {
    const step = this.courseStep;
    if (this.hasStep(step)) {
      this.currentStep = this.getStepNr(step);
      this.isLessonReady = true;
    }
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
      results.forEach((result: StepCount) => {
        if (result.step === 'study' || result.step === 'practise' || result.step === 'intro' || result.step === 'dialogue') {
          total = result.step === 'study' ? studyTotal : lessonTotal;
          this.countPerStep[result.step] = {nrDone: result.nrDone || 0, nrRemaining: Math.max(0, total - result.nrDone || 0)};
        }
      });
    }
    // Fill in step count for the steps without a result
    this.steps.forEach(step => {
      if (step.level === Level.Lesson) {
        total = step.name === 'study' ? studyTotal : lessonTotal;
        if (step.level === Level.Lesson && !this.countPerStep[step.name]) {
          this.countPerStep[step.name] = {nrDone: 0, nrRemaining: Math.max(0, total)};
        }
      }
    });
    // Practise step must have study finished or tpe != word
    if (this.countPerStep['practise'] && this.countPerStep['study']) { // Study is optional!!
      const diff = this.countPerStep['study'].nrDone + (lessonTotal - studyTotal) - this.countPerStep['practise'].nrDone;
      this.countPerStep['practise'].nrRemaining = Math.max(0, diff);
    }
    this.stepcountUpdated.next(this.countPerStep);
  }

  private saveAnswers(step: string, data: ExerciseData[]) {
    const lessonId = this.lesson ? this.lesson._id : null,
          isRepeat = this.lesson ? !!this.lesson.rehearseStep : false,
          processedData: ProcessedData =
            this.sharedService.processAnswers(step, data, this.course._id, lessonId, isRepeat, this.courseLevel);

    if (processedData) {
      /*
      if (!this.lesson.rehearseStep) {
        this.updateStepCount(step, processedData.lastResult);
      }
      */
      this.log(`Total points earned: ${processedData.pointsEarned}`);
      this.learnService
      .saveUserResults(JSON.stringify(processedData.result))
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        totalScore => {
          if (step === 'intro' || step === 'dialogue') {
            this.nextStep();
          } else {
            this.log('Saved exercise answers');
            if (totalScore) {
              // add results to data object
              processedData.result.data.forEach((resultItem, i) => {
                data[i].result = resultItem;
              });
              this.checkStepCount();
              this.checkNewRank(totalScore, processedData.pointsEarned);
            }
          }
        },
        error => this.errorService.handleError(error)
      );
    }
  }

  private saveDemoAnswers(step: string, data: ExerciseData[]) {
    this.userService.storeDemoData(data, step, this.course._id, this.lesson._id);
    const demoData = this.userService.getDemoData(step, this.course._id),
          processedData = this.sharedService.processAnswers(step, demoData, this.course._id, this.lesson._id, false, Level.Lesson);
    if (step === 'intro' || step === 'dialogue') {
      this.nextStep();
    } else {
      this.updateStepCount(step, processedData.lastResult);
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

  private saveSettings() {
    this.userService
    .saveLearnSettings(this.settings)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      saved => {
        this.settingsUpdated = false;
      },
      error => this.errorService.handleError(error)
    );
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
        }
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
        }
      break;
      case 'review':
        remaining = this.countPerStep['review'].nrRemaining - nrOfResults;
        this.countPerStep['review'].nrRemaining = Math.max(0, remaining);
      break;
    }
    this.stepcountUpdated.next(this.countPerStep);
  }

  private checkStepCount() {
    // Update stepcount with data from db
    this.learnService
    .fetchStepData(this.course._id, this.lesson._id)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      stepData => {
        if (stepData) {
          this.getCourseStepCount(stepData);
          this.getLessonStepCount(stepData.lesson);
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
    .pipe(takeWhile(() => this.componentActive))
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
    .pipe(takeWhile(() => this.componentActive))
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
    const chapters = this.course.chapters,
          firstChapter = this.course.lessons.find(lesson => lesson.chapter === chapters[0]);
    let lessonId: string;

    if (firstChapter) {
      lessonId = firstChapter.lessonIds[0];
    } else {
      lessonId = this.course.lessons[0].lessonIds[0];
    }
    this.getLesson(lessonId);
  }

  private getNextLesson(currentLessonId: string) {
    // Go to next lesson
    let currentFound = false,
        newLessonId,
        chapter: LessonId;
    const chapters: string[] = this.course.chapters.length ? this.course.chapters : [''];
    chapters.forEach(chapterName => {
      // Get lessons for this chapter
      chapter = this.course.lessons.find(lesson => lesson.chapter === chapterName);
      if (chapter) {
        chapter.lessonIds.forEach(lessonId => {
          if (currentFound && !newLessonId) {
            newLessonId = lessonId;
          } else {
            currentFound = currentLessonId === lessonId;
          }
        });
      }
    });
    if (newLessonId) {
      this.getLesson(newLessonId);
    } else {
      // There is no new lesson; course is done
      this.currentStep = 0;
      this.isLessonReady = true;
    }
  }

  private subscriptions() {
    this.route.params
    .pipe(
      takeWhile(() => this.componentActive),
      filter(params => params.id))
    .subscribe(
      params => {
        this.courseId = params['id'];
        this.courseStep = this.validateCourseStep(params['step']);
        if (params['step']) {
          // remove step from url
          this.location.go('/learn/course/' + this.courseId);
        }
        this.getTranslations();
      }
    );
    this.sharedService.exerciseModeChanged
    .pipe(takeWhile(() => this.componentActive))
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
