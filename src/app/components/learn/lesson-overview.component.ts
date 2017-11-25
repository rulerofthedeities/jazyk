import {Component, Input, Output, OnInit, OnDestroy, EventEmitter} from '@angular/core';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {Lesson} from '../../models/course.model';
import {Exercise, ExerciseResult, ExerciseData, ExerciseType} from '../../models/exercise.model';

@Component({
  selector: 'km-lesson-overview',
  templateUrl: 'lesson-overview.component.html',
  styleUrls: ['lesson-overview.component.css']
})

export class LearnLessonOverviewComponent implements OnInit, OnDestroy {
  @Input() text: Object;
  @Input() isLearnedLevel: number;
  @Input() private lessonId: string;
  @Output() currentLesson = new EventEmitter<Lesson>();
  private componentActive = true;
  private exercises: Exercise[];
  lesson: Lesson;
  exerciseData: ExerciseData[] = [];
  exType = ExerciseType;

  constructor(
    private learnService: LearnService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.fetchLesson();
  }

  showWord(word: string): string {
    if (word) {
      word = word.replace(/\|/g, ', ');
      return word.replace(/\[|\]/g, '');
    }
  }

  private fetchLessonResults() {
    // fetch results for all exercises in this lesson
    this.learnService
    .getLessonResults(this.lessonId, 'overview')
    .takeWhile(() => this.componentActive)
    .subscribe(
      results => {
        console.log('overview results', results);
        this.buildExerciseData(results);
      },
      error => this.errorService.handleError(error)
    );
  }

  private buildExerciseData(results: ExerciseResult[]) {
    let exerciseData: ExerciseData,
        result: ExerciseResult;
    this.lesson.exercises.forEach(exercise => {
      result = results.find(resultItem => resultItem.exerciseId === exercise._id);
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
        this.fetchLessonResults();
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
