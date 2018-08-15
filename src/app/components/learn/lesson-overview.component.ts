import {Component, Input, Output, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {LearnService} from '../../services/learn.service';
import {isLearnedLevel} from '../../services/shared.service';
import {ErrorService} from '../../services/error.service';
import {Lesson} from '../../models/course.model';
import {ExerciseResult, ExerciseData, ExerciseType, ResultsData} from '../../models/exercise.model';
import {takeWhile} from 'rxjs/operators';

@Component({
  selector: 'km-lesson-overview',
  templateUrl: 'lesson-overview.component.html',
  styleUrls: ['lesson-overview.component.css']
})

export class LearnLessonOverviewComponent implements OnInit, OnDestroy {
  @Input() private lessonId: string;
  @Input() text: Object;
  @Input() courseId: string;
  @Input() isDemo = false;
  @Output() currentLesson = new EventEmitter<Lesson>();
  private componentActive = true;
  lesson: Lesson;
  exerciseData: ExerciseData[] = [];
  exType = ExerciseType;
  isLoading = false;
  isError = false;
  isLearnedLevel: number;

  constructor(
    private learnService: LearnService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.isLearnedLevel = isLearnedLevel; // for view
    this.fetchLesson();
  }

  showWord(word: string, tpe: number): string {
    return this.learnService.showFilteredWord(word, tpe);
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
    .fetchLessonStepResults(this.lessonId, 'overview')
    .pipe(takeWhile(() => this.componentActive))
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
    this.isLoading = true;
    this.learnService
    .fetchLesson(this.lessonId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (lesson: Lesson) => {
        this.isLoading = false;
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
