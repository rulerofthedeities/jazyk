import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {ExerciseBase} from './exercise-base.component';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {LanConfig} from '../../models/course.model';
import {Exercise} from '../../models/exercise.model';
import {takeWhile} from 'rxjs/operators';

@Component({
  selector: 'km-build-genus',
  templateUrl: 'exercise-genus.component.html',
  styleUrls: ['exercise-wrapper.css']
})

export class BuildGenusComponent extends ExerciseBase implements OnInit, OnDestroy {
  config: LanConfig;
  options: string[];
  articles: string[];

  constructor(
    protected buildService: BuildService,
    protected errorService: ErrorService,
    protected formBuilder: FormBuilder
  ) {
    super(buildService, errorService, formBuilder);
  }

  ngOnInit() {
    super.init();
    this.getConfig(this.languagePair.to);
  }

  private getConfig(lanCode: string) {
    this.buildService
    .fetchLanConfig(lanCode)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      config => this.config = config,
      error => this.errorService.handleError(error)
    );
  }

  protected buildForm(exercise: Exercise) {
    this.options = this.exercise.options.split('|');
    this.exerciseForm = this.formBuilder.group({
      localWord: [exercise.local.word, [Validators.required]],
      foreignWord: [exercise.foreign.word, [Validators.required]],
      localRegion: [exercise.local.region],
      foreignRegion: [exercise.foreign.region],
      genus: [exercise.genus],
      article: [exercise.article]
    });
    this.isFormReady = true;
  }

  protected buildExistingExercise(formValues: any) {
    const exercise: Exercise = this.currentExercise;
    exercise.local.word = formValues['localWord'];
    exercise.foreign.word = formValues['foreignWord'];
    exercise.genus = this.checkIfValue(formValues['genus']);
    exercise.article = this.checkIfValue(formValues['article']);
    this.saveUpdatedExercise(exercise);
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
