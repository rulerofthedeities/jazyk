import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {Exercise, ExerciseResult, ExerciseData, ExerciseType} from '../../models/exercise.model';

@Component({
  selector: 'km-learn-overview',
  templateUrl: 'step-overview.component.html',
  styleUrls: ['step-overview.component.css']
})

export class LearnOverviewComponent implements OnInit, OnDestroy {
  @Input() private lessonId: string;
  @Input() private exercises: Exercise[];
  @Input() text: Object;
  @Input() isLearnedLevel: number;
  private componentActive = true;
  exerciseData: ExerciseData[] = [];
  exType = ExerciseType;

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
    .getLessonResults(this.lessonId, 'overview')
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
