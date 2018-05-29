import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {Step} from './step-base.component';
import {LearnService} from '../../services/learn.service';
import {PreviewService} from '../../services/preview.service';
import {SharedService} from '../../services/shared.service';
import {ErrorService} from '../../services/error.service';
import {Exercise, ExerciseData, ExerciseResult, Direction, QuestionType} from '../../models/exercise.model';
import {LessonOptions} from '../../models/course.model';
import {Subject} from 'rxjs';
import {takeWhile} from 'rxjs/operators';

// piggyback lesson options with exercise for course reviews
interface ExercisePlusOptions {
  exercise: Exercise;
  lessonId?: string;
  options: LessonOptions;
}

@Component({
  selector: 'km-learn-review',
  templateUrl: 'step-review.component.html',
  styleUrls: ['step.component.css']
})

export class LearnReviewComponent extends Step implements OnInit, OnDestroy {
  @Input() private continueCourseLevel: Subject<boolean>;

  constructor(
    learnService: LearnService,
    previewService: PreviewService,
    sharedService: SharedService,
    errorService: ErrorService
  ) {
    super(learnService, previewService, errorService, sharedService);
  }

  ngOnInit() {
    this.currentStep = 'review';
    this.getToReview();
    this.checkToContinue();
  }

  onContinueReview() {
    this.continueReview();
  }

  private continueReview() {
    this.clearToContinue();
    this.getToReview();
  }

  private getToReview() {
    this.learnService
    .fetchToReview(this.course._id, this.settings.nrOfWordsReview)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      data => {
        console.log('To review exercises', data.toreview);
        console.log('To review results', data.results);
        this.setExercises(data.toreview, data.results);
      },
      error => this.errorService.handleError(error)
    );
  }

  private setExercises(newExercises: ExercisePlusOptions[], results: ExerciseResult[]) {
    // add lessonId to exercise to ensure uniqueness across course!
    let ex: Exercise;
    const exercises = newExercises.map(exercise => {
            ex = exercise.exercise;
            ex.lessonId = exercise.lessonId;
            return ex;
          }),
          options = newExercises.map(exercise => exercise.options);
    if (exercises.length > 0) {
      this.buildExerciseData(exercises, results, options[0]);
      this.noMoreExercises = false;
      this.isReady = true;
      super.init();
    } else {
      this.exerciseData = [];
      this.noMoreExercises = true;
      this.isExercisesDone = true;
      this.isCountDown = false;
      this.isReady = true;
    }
  }

  private checkToContinue() {
    // User continues review from course tabs
    this.continueCourseLevel
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(event => {
      this.continueReview();
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
