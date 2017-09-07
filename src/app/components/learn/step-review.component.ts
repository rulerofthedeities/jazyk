import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {Step} from './step-base.component';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {Exercise, ExerciseResult, Direction, QuestionType} from '../../models/exercise.model';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-learn-review',
  templateUrl: 'step-review.component.html',
  styleUrls: ['step.component.css']
})

export class LearnReviewComponent extends Step implements OnInit, OnDestroy {
  @Input() courseId: string;

  constructor(
    learnService: LearnService,
    errorService: ErrorService
  ) {
    super(learnService, errorService);
  }

  ngOnInit() {
    console.log('courseid', this.courseId);
    this.getToReview();
    super.init();
  }

  protected determineQuestionType(result: ExerciseResult, learnLevel: number): QuestionType {
    console.log('Determine q type', result, learnLevel);
    // Determine if multiple choice or word
    let qTpe = QuestionType.Choices;
    if (result) {
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
    .fetchToReview(this.courseId, this.settings.nrOfWords)
    .takeWhile(() => this.componentActive)
    .subscribe(
      results => {
        console.log('results for exercises to review', results);
        this.loadExercises(results);
      },
      error => this.errorService.handleError(error)
    );
  }

  private loadExercises(results: ExerciseResult[]) {
    if (results.length > 0) {
      const ids = results.map(result => result.exerciseId);
      this.learnService
      .fetchExercises(this.courseId, ids)
      .takeWhile(() => this.componentActive)
      .subscribe(
        exercisesResult => {
          const exercises = exercisesResult.map(ex => ex.exercise);
          console.log('exercises to review', exercises);
          this.buildExerciseData(exercises, results);
        },
        error => this.errorService.handleError(error)
      );
    }
  }

  private buildExerciseData(newExercises: Exercise[], results: ExerciseResult[]) {
    this.exerciseData = this.learnService.buildExerciseData(newExercises, results, this.text, {
      isBidirectional: true,
      direction: Direction.LocalToForeign
    });
    this.exerciseData = this.learnService.shuffle(this.exerciseData);
    this.getChoices('course', this.courseId);
    this.setExerciseDataById();
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
