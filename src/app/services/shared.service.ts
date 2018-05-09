import {Injectable, EventEmitter} from '@angular/core';
import {EventMessage} from '../models/error.model';
import {Level, ProcessedData, ResultData, Map, Lesson} from '../models/course.model';
import {Exercise, ExerciseData, ExerciseExtraData, ExerciseResult, QuestionType} from '../models/exercise.model';
import {environment} from '../../environments/environment';

export const maxLearnLevel = 20; // maximum learn level
export const maxStreak = 20; // maximum length of the streak
export const isLearnedLevel = 12; // minimum level before it is considered learned

export class SharedService {
  private eventMessages: EventMessage[] = [];
  private messageLimit = 10;
  exerciseModeChanged = new EventEmitter();
  justLoggedInOut = new EventEmitter<boolean>();
  eventMessage = new EventEmitter<EventMessage>();

  // Cross-lazy loaded module Events
  changeExerciseMode(isStarted: boolean) {
    this.exerciseModeChanged.emit(isStarted);
  }

  userJustLoggedIn() {
    this.justLoggedInOut.emit(true);
  }

  userJustLoggedOut() {
    this.justLoggedInOut.emit(false);
  }

  sendEventMessage(newMessage: EventMessage) {
    newMessage.dt = new Date();
    this.eventMessages.unshift(newMessage);
    this.eventMessages.slice(0, this.messageLimit);
    this.eventMessage.emit(newMessage);
  }

  get lastEventMessage(): string {
    return this.eventMessages[0] ? this.eventMessages[0].message : '';
  }

  get eventMessageList(): EventMessage[] {
    return this.eventMessages;
  }

  // Dev log
  log(label: string, msg: any, tpe = 'info') {
    if (!environment.production) {
      console.log(label + ':', JSON.stringify(msg, undefined, 2));
    }
  }

  /*** Process data to save exercises ***/

  processAnswers(step: string, data: ExerciseData[], courseId: string, lessonId: string, isRepeat: boolean, courseLevel: Level): ProcessedData {
    const lastResult: Map<ResultData> = {}, // Get most recent result per exercise (for isLearned && reviewTime)
          streak: Map<string> = {}, // Get streaks for exercise
          allCorrect: Map<boolean> = {}, // Exercise is only correct if all answers for an exercise are correct
          result = {
            courseId,
            lessonId: courseLevel === Level.Lesson ? lessonId : undefined,
            step,
            data: []
          };
    let pointsEarned = 0;
    if (step === 'intro' || step === 'dialogue') {
      // No save required
    } else {
      if (data && data.length > 0) { // No data for study repeats
        // calculate bonus for % correct
        let correctCount = 0;
        data.forEach((item) => {
          correctCount = correctCount + (item.data.isCorrect ? 1 : 0);
        });
        const correctBonus = this.getCorrectBonus(correctCount, data.length, isRepeat, step);
        data.forEach((item, i) => {
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
            lessonId: item.result ? item.result.lessonId : lessonId
          };
          lastResult[item.exercise._id] = newResult;
          allCorrect[item.exercise._id] = allCorrect[item.exercise._id] !== false ? item.data.isCorrect  : false;
          result.data.push(newResult);
        });
        this.checkLastResult(step, lastResult, allCorrect, data, courseLevel);
      }
    }
    return {
      result,
      lastResult,
      allCorrect,
      pointsEarned
    };
  }

  private getCorrectBonus(correctCount: number, totalCount: number, isRepeat: boolean, step: string): number {
    if (totalCount > 1 && !isRepeat && step !== 'study') {
      return Math.max(0, Math.trunc(((correctCount / totalCount * 100) - 60) * 0.5));
    } else {
      return 0;
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

  private checkLastResult(step: string, lastResult: Map<ResultData>, allCorrect: Map<boolean>, data: ExerciseData[], courseLevel: Level) {
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
        } else if (courseLevel === Level.Course) {
          // copy review time over to new doc
          const exercise: ExerciseData = data.find(ex => ex.exercise._id === key);
          lastResult[key].daysBetweenReviews = exercise.result.daysBetweenReviews || undefined;
          if (!lastResult[key].daysBetweenReviews) {
            this.calculateReviewTime(lastResult[key], allCorrect[key], exercise);
          }
        }
        lastResult[key].isLast = true;
      }
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
        const daysSinceLastReview = this.getDaysBetweenDates(new Date(dateLastReviewed), new Date());
        percentOverdue = Math.min(2, daysSinceLastReview / daysBetweenReviews);
      }
      const performanceDelta = this.clamp((8 - 9 * performanceRating) / 17, -1, 1);
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

  private getInitialDifficulty(exercise: Exercise): number {
    // Combination of character length & word length
    // Only if no difficulty has been set
    const word = exercise.foreign.word.trim(),
          lengthScore = Math.min(70, word.length * 3),
          wordScore =  Math.min(10, word.split(' ').length) * 5,
          difficulty = lengthScore + wordScore;
    return difficulty;
  }

  getDaysBetweenDates(firstDate: Date, secondDate: Date): number {
    const oneDay = 24 * 60 * 60 * 1000, // ms in a day
          diffDays = Math.abs((firstDate.getTime() - secondDate.getTime()) / (oneDay));

    return diffDays;
  }

  clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }
}
