import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {Step} from './step-base.component';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import 'rxjs/add/operator/takeWhile';

interface ToReviewResult {
  exerciseId: string;
  dtToReview: Date;
  dt: Date;
  daysBetweenReviews: number;
}

@Component({
  selector: 'km-learn-review',
  template: `REVIEW`
})

export class LearnReviewComponent extends Step implements OnInit, OnDestroy {
  @Input() courseId: string;
  private componentActive = true;
  private maxToReview = 5;

  constructor(
    private learnService: LearnService,
    private errorService: ErrorService
  ) {
    super();
  }

  ngOnInit() {
    console.log('courseid', this.courseId);
    this.getToReview();
  }

  private getToReview() {
    this.learnService
    .fetchToReview(this.courseId, this.maxToReview)
    .takeWhile(() => this.componentActive)
    .subscribe(
      results => {
        console.log('results for exercises to review', results);
        this.loadExercises(results);
      },
      error => this.errorService.handleError(error)
    );
  }

  private loadExercises(results: ToReviewResult[]) {
    if (results.length > 0) {
      const ids = results.map(result => result.exerciseId);
      this.learnService
      .fetchExercises(this.courseId, ids)
      .takeWhile(() => this.componentActive)
      .subscribe(
        exercises => {
          console.log('exercises to review', exercises);
        },
        error => this.errorService.handleError(error)
      );

    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
