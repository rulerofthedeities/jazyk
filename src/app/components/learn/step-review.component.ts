import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {Step} from './step-base.component';
import {LearnService} from '../../services/learn.service';
import {PreviewService} from '../../services/preview.service';
import {ErrorService} from '../../services/error.service';
import {SharedService} from '../../services/shared.service';
import {Exercise, ExerciseData, ExerciseResult, Direction, QuestionType} from '../../models/exercise.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-learn-review',
  templateUrl: 'step-review.component.html',
  styleUrls: ['step.component.css']
})

export class LearnReviewComponent extends Step implements OnInit, OnDestroy {

  constructor(
    learnService: LearnService,
    previewService: PreviewService,
    errorService: ErrorService,
    sharedService: SharedService
  ) {
    super(learnService, previewService, errorService, sharedService);
  }

  ngOnInit() {
    console.log('courseid', this.courseId);
    this.getToReview();
    super.init();
  }

  protected determineQuestionType(exercise: ExerciseData, learnLevel: number): QuestionType {
    console.log('Determine q type', exercise.result, learnLevel);
    // Determine if multiple choice or word
    let qTpe = QuestionType.Choices;
    if (exercise.result) {
      // 3 -> 5: random
      if (learnLevel > 2 && learnLevel < 6) {
        qTpe =  Math.random() >= 0.5 ? QuestionType.Choices : QuestionType.Word;
      }
      // 6+ : always word
      if (learnLevel > 5) {
        qTpe = QuestionType.Word;
      }
    }
    return qTpe;
  }

  private getToReview() {
    this.learnService
    .fetchToReview(this.courseId, this.settings.nrOfWordsReview)
    .takeWhile(() => this.componentActive)
    .subscribe(
      data => {
        this.buildExerciseData(data.toreview, data.results);
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
