import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {Exercise, ExerciseResult, ExerciseData} from '../../models/exercise.model';

@Component({
  selector: 'km-learn-overview',
  template: `OVERVIEW

  exercises
  <div *ngFor="let exercise of exerciseData">
    {{exercise.exercise.foreign.word}} / 
    {{exercise.result|json}}
  </div>
  `
})

export class LearnOverviewComponent implements OnInit, OnDestroy {
  @Input() private lessonId: string;
  @Input() private exercises: Exercise[];
  private componentActive = true;
  exerciseData: ExerciseData[] = [];

  constructor(
    private learnService: LearnService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.fetchLessonResults();
  }

  private fetchLessonResults() {
    // fetch results for all exercises in this lesson
    this.learnService
    .getLessonResults(this.lessonId, 'all')
    .takeWhile(() => this.componentActive)
    .subscribe(
      results => {
        console.log('previous results', results);
        this.buildExerciseData(results);
      },
      error => this.errorService.handleError(error)
    );
  }

  private buildExerciseData(results: ExerciseResult[]) {
    let exerciseData: ExerciseData,
        result: ExerciseResult;
    this.exercises.forEach(exercise => {
      result = results.find(resultItem => resultItem.exerciseId === exercise._id);
      exerciseData = {
        exercise,
        data: {},
        result
      };
      this.exerciseData.push(exerciseData);
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
