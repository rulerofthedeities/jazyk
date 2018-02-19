import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {Step} from './step-base.component';
import {LearnService} from '../../services/learn.service';
import {PreviewService} from '../../services/preview.service';
import {ErrorService} from '../../services/error.service';
import {SharedService} from '../../services/shared.service';
import {Exercise, ExerciseData, ExerciseResult, Direction, QuestionType} from '../../models/exercise.model';
import {LessonOptions} from '../../models/course.model';
import 'rxjs/add/operator/takeWhile';

// piggyback lesson options with exercise for course reviews
interface ExercisePlusOptions {
  exercise: Exercise;
  options: LessonOptions;
}

@Component({
  selector: 'km-learn-review',
  templateUrl: 'step-review.component.html',
  styleUrls: ['step.component.css']
})

export class LearnReviewComponent extends Step implements OnInit, OnDestroy {
  isReady = false;

  constructor(
    learnService: LearnService,
    previewService: PreviewService,
    errorService: ErrorService,
    sharedService: SharedService
  ) {
    super(learnService, previewService, errorService, sharedService);
  }

  ngOnInit() {
    this.currentStep = 'review';
    this.getToReview();
  }

  private getToReview() {
    this.learnService
    .fetchToReview(this.course._id, this.settings.nrOfWordsReview)
    .takeWhile(() => this.componentActive)
    .subscribe(
      data => this.setExercises(data.toreview, data.results),
      error => this.errorService.handleError(error)
    );
  }

  private setExercises(newExercises: ExercisePlusOptions[], results: ExerciseResult[]) {
    const exercises = newExercises.map(exercise => exercise.exercise),
          options = newExercises.map(exercise => exercise.options);

    if (exercises.length > 0) {
      this.buildExerciseData(exercises, results, options[0]);
      this.noMoreExercises = false;
      this.isReady = true;
      super.init();
    } else {
      this.noMoreExercises = true;
      this.isCountDown = false;
      this.isReady = true;
    }
  }

  protected fetchResults() {
    this.getToReview();
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
