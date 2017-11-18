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

  constructor(
    learnService: LearnService,
    previewService: PreviewService,
    sharedService: SharedService,
    errorService: ErrorService
  ) {
    super(learnService, previewService, errorService, sharedService);
  }

  ngOnInit() {
    this.getDifficult();
    super.init();
  }

  private getDifficult() {
    this.learnService
    .fetchDifficult(this.courseId, this.settings.nrOfWordsReview)
    .takeWhile(() => this.componentActive)
    .subscribe(
      data => this.buildExerciseData(data.difficult, data.results),
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
