import {Component, Input} from '@angular/core';
import {LearnService} from '../../services/learn.service';
import {ErrorService} from '../../services/error.service';
import {LearnSettings} from '../../models/user.model';
import {ExerciseData, Choice} from '../../models/exercise.model';


export abstract class Step {
  @Input() settings: LearnSettings;
  @Input() text: Object;
  protected componentActive = true;
  protected choices: Choice[];
  exerciseData: ExerciseData[];

  constructor(
    protected learnService: LearnService,
    protected errorService: ErrorService
  ) {}

  protected getChoices(tpe: string, id: string, isBidirectional: boolean = true) {
    this.learnService
    .fetchChoices(tpe, id, isBidirectional)
    .takeWhile(() => this.componentActive)
    .subscribe(
      choices => {
        console.log('CHOICES', choices);
        this.choices = choices;
        this.nextWord();
      },
      error => this.errorService.handleError(error)
    );
  }

  protected nextWord() {
    console.log('BASE next word');
  }
}
