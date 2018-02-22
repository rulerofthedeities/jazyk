import {Component, Input, Output, OnInit, EventEmitter, OnDestroy} from '@angular/core';
import {Step} from './step-base.component';
import {LearnService} from '../../services/learn.service';
import {PreviewService} from '../../services/preview.service';
import {SharedService} from '../../services/shared.service';
import {ErrorService} from '../../services/error.service';
import {LearnSettings} from '../../models/user.model';
import {Exercise, ExerciseData, ExerciseResult, Direction} from '../../models/exercise.model';
import {LessonOptions} from '../../models/course.model';
import 'rxjs/add/operator/takeWhile';

interface Map<T> {
  [K: string]: T;
}

// piggyback lesson options with exercise for course reviews
interface ExercisePlusOptions {
  exercise: Exercise;
  options: LessonOptions;
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
    console.log('init difficult');
    this.currentStep = 'difficult';
    this.getDifficult();
  }

  onContinueDifficult() {
    this.clearToContinue();
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

  ngOnDestroy() {
    this.componentActive = false;
  }
}
