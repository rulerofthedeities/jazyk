import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {ExerciseBase} from './exercise-base.component';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {ValidationService} from '../../services/validation.service';
import {LanConfig} from '../../models/course.model';
import {Exercise, ExerciseType} from '../../models/exercise.model';

@Component({
  selector: 'km-build-genus',
  templateUrl: 'exercise-genus.component.html',
  styleUrls: ['exercise-wrapper.css']
})

export class BuildGenusComponent extends ExerciseBase implements OnInit, OnDestroy {
  config: LanConfig;

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
    .takeWhile(() => this.componentActive)
    .subscribe(
      config => this.config = config,
      error => this.errorService.handleError(error)
    );
  }

  protected buildForm(exercise: Exercise) {
    if (!exercise) {
      // New Genus
      console.log('new genus exercise');
    } else {
      // Edit Genus
      this.exerciseForm = this.formBuilder.group({
        localWord: [exercise.local.word, [Validators.required]],
        foreignWord: [exercise.foreign.word, [Validators.required]],
        genus: [exercise.genus],
        article: [exercise.article]
      });
    }
    this.isFormReady = true;
  }

  protected buildExistingExercise(formValues: any) {
    const exercise: Exercise = this.currentExercise;
    exercise.local.word = this.exerciseForm.value['localWord'];
    exercise.foreign.word = this.exerciseForm.value['foreignWord'];
    exercise.genus = this.checkIfValue(this.exerciseForm.value['genus']);
    exercise.article = this.checkIfValue(this.exerciseForm.value['article']);
    console.log('updating', exercise);
    this.saveUpdatedExercise(exercise);
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
