import {Component, Input, Output, OnInit, EventEmitter, OnDestroy} from '@angular/core';
import {Step} from './step-base.component';
import {LearnService} from '../../services/learn.service';
import {PreviewService} from '../../services/preview.service';
import {SharedService} from '../../services/shared.service';
import {ErrorService} from '../../services/error.service';
import {LearnSettings} from '../../models/user.model';
import {Exercise, ExerciseData, ExerciseResult, Direction} from '../../models/exercise.model';
import 'rxjs/add/operator/takeWhile';

interface Map<T> {
  [K: string]: T;
}

@Component({
  selector: 'km-learn-difficult',
  templateUrl: 'step-difficult.component.html',
  styleUrls: ['step.component.css']
})

export class LearnDifficultComponent extends Step implements OnInit, OnDestroy {
  isReady = false;

  constructor(
    learnService: LearnService,
    previewService: PreviewService,
    sharedService: SharedService,
    errorService: ErrorService
  ) {
    super(learnService, previewService, errorService, sharedService);
  }

  ngOnInit() {
    this.currentStep = 'difficult';
    this.getDifficult();
  }

  private getDifficult() {
    this.learnService
    .fetchDifficult(this.course._id, this.settings.nrOfWordsReview)
    .takeWhile(() => this.componentActive)
    .subscribe(
      data => this.setExercises(data.difficult, data.results),
      error => this.errorService.handleError(error)
    );
  }

  private setExercises(newExercises: Exercise[], results: ExerciseResult[]) {
    if (newExercises.length > 0) {
      this.buildExerciseData(newExercises, results);
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
    this.getDifficult();
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
