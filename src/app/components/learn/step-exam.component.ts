import {Component, Input, Output, OnInit, EventEmitter, OnDestroy} from '@angular/core';
import {Step} from './step-base.component';
import {LearnService} from '../../services/learn.service';
import {PreviewService} from '../../services/preview.service';
import {SharedService} from '../../services/shared.service';
import {ErrorService} from '../../services/error.service';
import {Exercise, ExerciseData, ExerciseResult, Direction} from '../../models/exercise.model';
import {LessonOptions} from '../../models/course.model';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-learn-exam',
  templateUrl: 'step-exam.component.html',
  styleUrls: ['step.component.css']
})

export class LearnExamComponent extends Step implements OnInit, OnDestroy {
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
    this.currentStep = 'exam';
    this.isCountDown = false;
    this.noMoreExercises = true;
    this.isExercisesDone = true;
    this.isReady = true;
  }

  onContinueExam() {
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
