import {Component, OnInit, OnDestroy} from '@angular/core';
import {FormBuilder} from '@angular/forms';
import {ExerciseBase} from './exercise-base.component';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {ValidationService} from '../../services/validation.service';
import {Exercise, ExerciseType} from '../../models/exercise.model';

@Component({
  selector: 'km-build-fillin',
  templateUrl: 'exercise-fillin.component.html',
  styleUrls: ['exercise-wrapper.css']
})

export class BuildFillInComponent extends ExerciseBase implements OnInit, OnDestroy {
  localRegions: string[] = [];
  constructor(
    protected buildService: BuildService,
    protected errorService: ErrorService,
    protected formBuilder: FormBuilder
  ) {
    super(buildService, errorService, formBuilder);
  }

  ngOnInit() {
    super.init();
  }

  protected buildForm(exercise: Exercise) {
    this.localRegions = this.getAllRegions();
    if (!exercise) {
      // New FillIn
      this.exerciseForm = this.formBuilder.group({
        foreignRegion: [this.formData.foreignRegions[0] || this.languagePair.to],
        localRegion: [this.localRegions[0] || this.languagePair.from],
        hint: [''],
        sentence: ['', ValidationService.checkFillInSentence]
      });
    } else {
      // Edit FillIn
      this.exerciseForm = this.formBuilder.group({
        foreignRegion: [this.formData.foreignRegions[0] || this.languagePair.to],
        localRegion: [this.localRegions[0] || this.languagePair.from],
        hint: [exercise.local.word],
        sentence: [exercise.foreign.word, ValidationService.checkFillInSentence]
      });
    }
    this.isFormReady = true;
  }

  private getAllRegions(): string[] {
    let regions = [];
    // Add foreign regions
    if (this.formData.foreignRegions.length) {
      regions = regions.concat(this.formData.foreignRegions);
    } else {
      regions.push(this.languagePair.to);
    }
    // Add local regions
    if (this.formData.localRegions.length) {
      regions = regions.concat(this.formData.localRegions);
    } else {
      regions.push(this.languagePair.from);
    }
    return regions;
  }

  protected buildNewExercise(formValues: any) {
    const exercise: Exercise = {
      foreign: {
        word: formValues.sentence,
        region: formValues.foreignRegion
      },
      local: {
        word: formValues.hint,
        region: formValues.localRegion
      },
      tpe: ExerciseType.FillIn,
      difficulty: 0
    };
    this.saveNewExercise(exercise);
  }

  protected buildExistingExercise(formValues: any) {
    const exercise: Exercise = this.currentExercise;
    exercise.local.word = this.exerciseForm.value['hint'];
    exercise.foreign.word = this.exerciseForm.value['sentence'];
    this.saveUpdatedExercise(exercise);
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
