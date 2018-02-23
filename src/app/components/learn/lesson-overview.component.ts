import {Component, Input, Output, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {isLearnedLevel, LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {Lesson} from '../../models/course.model';
import {Exercise, ExerciseResult, ExerciseData, ExerciseType} from '../../models/exercise.model';

interface ResultsData {
  last: ExerciseResult[];
  count: ExerciseResult[];
}

@Component({
  selector: 'km-lesson-overview',
  templateUrl: 'lesson-overview.component.html',
  styleUrls: ['lesson-overview.component.css']
})

export class LearnLessonOverviewComponent implements OnInit, OnDestroy {
  @Input() text: Object;
  @Input() private lessonId: string;
  @Input() isDemo = false;
  @Output() currentLesson = new EventEmitter<Lesson>();
  private componentActive = true;
  private exercises: Exercise[];
  lesson: Lesson;
  exerciseData: ExerciseData[] = [];
  exType = ExerciseType;
  isLearnedLevel: number;

  constructor(
    private learnService: LearnService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.isLearnedLevel = isLearnedLevel; // for view
    this.fetchLesson();
  }

  showWord(word: string): string {
    if (word) {
      word = word.replace(/\|/g, ', ');
      return word.replace(/\[|\]/g, '');
    }
  }

  getTypeText(exercise: ExerciseData): string {
    let txt = '';
    switch (exercise.exercise.tpe) {
      case ExerciseType.Article: txt = this.text['Article'];
      break;
      case ExerciseType.Comparison: txt = this.text['Comparison'];
      break;
      case ExerciseType.FillIn: txt = this.text['FillIn'];
      break;
      case ExerciseType.Genus: txt = this.text['Genus'];
      break;
      case ExerciseType.QA: txt = this.text['QA'];
      break;
      case ExerciseType.Select: txt = this.text['Select'];
      break;
      case ExerciseType.Word: txt = this.text['Word'];
      break;
      default: txt = this.text['iExerciseType'];
    }
    return txt;
  }

  isToReview(result: ExerciseResult): boolean {
    let toReview = false;
    if (result) {
      if (result.dtToReview && new Date(result.dtToReview) < new Date()) {
        toReview = true;
      }
    }
    return toReview;
  }

  private getLessonResults() {
    if (!this.isDemo) {
      this.fetchLessonResults();
    } else {
      this.buildExerciseData(null);
    }
  }

  private fetchLessonResults() {
    // fetch results for all exercises in this lesson
    this.learnService
    .getLessonResults(this.lessonId, 'overview')
    .takeWhile(() => this.componentActive)
    .subscribe(
      results => this.combineResults(results),
      error => this.errorService.handleError(error)
    );
  }

  private combineResults(resultsData: ResultsData) {
    // combine total count results with results for last entry
    const countResults: ExerciseResult[] = resultsData.count,
          lastResults: ExerciseResult[] = resultsData.last;
    let lastResult: ExerciseResult;
    countResults.forEach(countResult => {
      lastResult = lastResults.find(last => last.exerciseId === countResult.exerciseId);
      Object.assign(countResult, lastResult);
    });
    this.buildExerciseData(countResults);
  }

  private buildExerciseData(results: ExerciseResult[]) {
    let exerciseData: ExerciseData,
        result: ExerciseResult;
    this.lesson.exercises.forEach(exercise => {
      result = results && results.find(resultItem => resultItem.exerciseId === exercise._id);
      exerciseData = {
        exercise,
        data: {},
        result
      };
      this.exerciseData.push(exerciseData);
    });
  }

  private fetchLesson() {
    this.learnService
    .fetchLesson(this.lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      (lesson: Lesson) => {
        this.lesson = lesson;
        this.currentLesson.emit(lesson);
        this.getLessonResults();
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
