import {Injectable, EventEmitter} from '@angular/core';
import {EventMessage} from '../models/error.model';
import {Level, ProcessedData, ResultData, Map, Lesson} from '../models/course.model';
import {ExerciseData, ExerciseExtraData, ExerciseResult, QuestionType} from '../models/exercise.model';
import {environment} from '../../environments/environment';

export const maxLearnLevel = 20; // maximum learn level
export const maxStreak = 20; // maximum length of the streak

@Injectable()
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
}
