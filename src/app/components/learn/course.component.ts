import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router, NavigationEnd} from '@angular/router';
import {LearnService} from '../../services/learn.service';
import {UtilsService} from '../../services/utils.service';
import {SharedService} from '../../services/shared.service';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {Course, Lesson, Language, Translation, Step, Level} from '../../models/course.model';
import {Exercise, ExerciseData, ExerciseResult, ExerciseType} from '../../models/exercise.model';
import {LearnSettings} from '../../models/user.model';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/takeWhile';

interface Map<T> {
  [K: string]: T;
}

interface StepCount {
  nrDone: number;
  nrRemaining: number;
}

interface ResultData {
  exerciseId: string;
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
  private defaultNrOfQuestions = 5;
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
  isReady = false;
  isStepsReady = false;
  exercisesStarted = false;
  maxStreak = 20;
  nextLesson: Subject<string> = new Subject();
  level = Level;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private learnService: LearnService,
    private sharedService: SharedService,
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.courseLevel = Level.Lesson;
    this.route.params
    .takeWhile(() => this.componentActive)
    .subscribe(
      params => {
        if (params['id']) {
          this.courseId = params['id'];
          // const routeStep = params['step'] || '';
          // this.setCourseType(routeStep);
          this.getTranslations();
        }
      }
    );
    this.sharedService.exerciseModeChanged.subscribe(
      (started) => this.exercisesStarted = started
    );
    this.settings = this.userService.user.jazyk.learn;
    this.settings.nrOfWords = this.settings.nrOfWords || this.defaultNrOfQuestions;
  }

  stepTo(i: number) {
    this.currentStep = i;
    this.courseLevel = this.steps[i].level;
    console.log('new level', this.courseLevel);
  }

  onSkipStep() {
    this.nextStep();
  }

  onStepBack() {
    this.previousStep();
  }

  onStepCompleted(step: string, data: ExerciseData[]) {
    if (step === 'intro') {
      this.nextStep();
    } else {
      this.saveAnswers(step, data);
      if (this.settingsUpdated) {
        this.saveSettings();
      }
    }
  }

  onCloseExercises() {
    this.exercisesStarted = false;
    this.sharedService.changeExerciseMode(false);
  }

  onLessonCompleted() {
    this.nextLesson.next(this.lesson._id);
  }

  onSettingsUpdated(settings: LearnSettings) {
    this.settingsUpdated = true;
    this.settings = settings;
  }

  onLessonSelected(lesson: Lesson) {
    if (lesson) {
      this.lesson = lesson;
      this.getLessonStepData();
    }
    this.isReady = true;
  }

  capitalize(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
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

  private getLessonStepData() {
    this.learnService
    .fetchLessonStepData(this.lesson._id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      results => {
        this.countPerStep = {};
        const lessonTotal = this.lesson.exercises.length;
        // get study completed count
        if (results) {
          results.map(result => result.nrRemaining = Math.max(0, lessonTotal - result.nrDone));
          results.forEach(result => {
            this.countPerStep[result.step] = {nrDone: result.nrDone, nrRemaining: result.nrRemaining};
          });
        }

        console.log('RESULTS', results);
        console.log('EXERCISES', this.lesson.exercises);
        this.setSteps();

        // Fill in step count for the steps without a result
        this.steps.forEach(step => {
          if (step.level === Level.Lesson && !this.countPerStep[step.name]) {
            this.countPerStep[step.name] = {nrDone: 0, nrRemaining: lessonTotal};
          }
        });
        // Remove lessoncount for studies if tpe === sentence
        const sentences = this.lesson.exercises.filter(exercise => exercise.tpe > 0);
        sentences.forEach(sentence => {
          // If no result for this sentence, remove from study
          if (!results.find(result => result.exerciseId === sentence._id)) {
            this.countPerStep['study'].nrRemaining--;
          }
        });
        // Practise step must have study finished or tpe != word
        const diff = this.countPerStep['practise'].nrRemaining - this.countPerStep['study'].nrRemaining;
        this.countPerStep['practise'].nrRemaining = Math.max(0, diff);
        if (this.countPerStep['practise'].nrRemaining + this.countPerStep['study'].nrRemaining > 0) {
          // this.setSteps();
        } else {
          // This lesson is finished, go to next lesson
          this.nextLesson.next(this.lesson._id);
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private setSteps() {
    const steps = this.utilsService.getSteps();
    this.steps = [];
    steps.forEach((step, i) => {
      if (this.lesson.exerciseSteps) {
        if (step.alwaysShown || (this.lesson.exerciseSteps[step.name] && this.lesson.exerciseSteps[step.name].active)) {
          this.steps.push(step);
        }
      }
    });
    this.currentStep = 0;
    this.isStepsReady = true;
  }
/*
  private setCourseSteps() {
    const steps = ['review', 'difficult', 'exam'];
    this.steps = steps;
    this.currentStep = steps.findIndex(step => step === this.courseStep);
    this.isStepsReady = true;
  }
*/
  private saveAnswers(step: string, data: ExerciseData[]) {
    console.log('saving answers', step, data);
    const lastResult: Map<ResultData> = {}; // Get most recent result per exercise (for isLearned && reviewTime)
    const streak: Map<string> = {}; // Get streaks for exercise
    const allCorrect: Map<boolean> = {}; // Exercise is only correct if all answers for an exercise are correct
    const result = {
      courseId: this.course._id,
      lessonId: this.lesson ? this.lesson._id : undefined,
      step,
      data: []
    };
    if (data && data.length > 0) { // No data for study repeats
      data.forEach( (item, i) => {
        console.log('result', item);
        streak[item.exercise._id] = this.buildStreak(item.exercise.tpe, streak[item.exercise._id], item.result, item.data.isCorrect);
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
          isCorrect: item.data.isCorrect
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

  private buildStreak(tpe: number, streak: string, result: ExerciseResult, isCorrect: boolean): string {
    let newStreak = '';

    if (result) {
      newStreak = streak || result.streak || '';
    }
    if (isCorrect) {
      newStreak = newStreak + '1';
    } else {
      newStreak = newStreak + '0';
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
        console.log(key, lastResult[key]);
        lastResult[key].isDifficult = this.checkIfDifficult(step, lastResult[key]);
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
            dateLastReviewed = exercise.result.dt,
            daysBetweenReviews = exercise.result.daysBetweenReviews || 0.25,
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

  private checkIfDifficult(step: string, result: ResultData): boolean {
    // Checks if the word has to be put in the difficult step
    let isDifficult = false;
    if ((step === 'difficult' || step === 'review') && result.streak) {
      // Check how many incorrect in last 5 results
      let streak = result.streak.slice(-5);
      let inCorrectCount = (streak.match(/0/g) || []).length;
      if (inCorrectCount >= 2) {
        isDifficult = true;
      } else {
        // Check how many incorrect in last 10 results
        streak = result.streak.slice(-10);
        inCorrectCount = (streak.match(/0/g) || []).length;
        if (inCorrectCount >= 3) {
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
              // Leanned - Decrease practise count
              remaining = this.countPerStep['practise'].nrRemaining - 1;
              this.countPerStep['practise'].nrRemaining = Math.max(0, remaining);
            }
          }
        }
      break;
    }
  }

/*
  private setCourseType(courseStep: string) {
    if (courseStep === 'review' || courseStep === 'exam' || courseStep === 'difficult') {
      this.courseStep = courseStep;
      this.courseLevel = 'course';
      this.setCourseSteps();
    } else {
      this.courseStep = '';
      this.courseLevel = 'lesson';
    }
    console.log('course Step:', this.courseStep);
    console.log('course Level:', this.courseLevel);
  }
*/

  ngOnDestroy() {
    this.componentActive = false;
  }
}
