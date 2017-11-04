import {Component, Input, Output, OnDestroy, EventEmitter} from '@angular/core';
import {LanPair} from '../../models/course.model';
import {Exercise, ExerciseType} from '../../models/exercise.model';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {ModalConfirmComponent} from '../modals/modal-confirm.component';
import 'rxjs/add/operator/takeWhile';

@Component({
  selector: 'km-exercise-list',
  templateUrl: 'exercise-list.component.html',
  styleUrls: ['exercise-list.component.css']
})

export class BuildExerciseListComponent implements OnDestroy {
  @Input() exercises: Exercise[];
  @Input() languagePair: LanPair;
  @Input() lessonId: string;
  @Input() text: Object;
  @Input() isBidirectional: boolean;
  @Output() removedExercise = new EventEmitter<number>();
  private componentActive = true;
  private isRemoving = false;
  editingId: string = null;
  viewId: string = null;
  removingId: string = null;
  focusField: string = null;
  exType = ExerciseType;

  constructor(
    private buildService: BuildService,
    private errorService: ErrorService
  ) {}

  onEditExercise(id: string, focus = null) {
    console.log('editing id', id);
    this.viewId = null;
    if (!this.isRemoving) {
      this.editingId = id === this.editingId ? null : id;
      this.focusField = focus;
    }
  }

  onCancelEdit() {
    this.editingId = null;
  }

  onUpdatedExercise(updatedExercise: Exercise) {
    this.exercises.forEach((exercise, i) => {
      if (exercise._id === this.editingId) {
        this.exercises[i] = updatedExercise;
      }
    });
    this.editingId = null;
  }

  onRemoveExercise(confirm: ModalConfirmComponent, id: string) {
    if (!this.isRemoving) {
      this.removingId = id;
      confirm.showModal = true;
    }
  }

  onRemoveConfirmed(removeOk: boolean) {
    if (removeOk) {
      this.removeCurrentExercise();
    }
  }

  onResorted(event) {
    console.log('resorted', event);
    this.saveResortedExercises();
  }

  onViewExercise(id: string) {
    this.editingId = null;
    this.viewId = this.viewId === id ? null : id;
  }

  getRemoveMessage(): string {
    let msg = '';
    if (this.text['RemoveWord']) {
      msg = this.text['RemoveWord'];
      const exerciseToRemove = this.exercises.find(exercise => exercise._id === this.removingId);
      if (exerciseToRemove) {
        const wordToRemove = exerciseToRemove.foreign.word;
        msg = msg.replace('%s', wordToRemove);
      }
    }
    return msg;
  }

  getInfo(exercise: Exercise): string {
    let info = '';
    if (exercise.genus) {
      info = exercise.genus;
    } else {
      if (exercise.followingCase) {
        info = '+' + exercise.followingCase;
      } else {
        info = exercise.genus;
      }
    }
    info = info ? info.toLowerCase() : '';
    return this.text[info];
  }

  getInfoHint(exercise: Exercise, tpe: string): string {
    if (exercise[tpe]) {
      const annotations: string[] = exercise[tpe].annotations ? exercise[tpe].annotations.split('|') : [];
      let hint = '';
      annotations.forEach(annotation => {
        if (hint) {
          hint = hint + '<br>';
        }
        hint = hint + annotation;
      });
      if (exercise[tpe].hint) {
        if (hint) {
          hint = hint + '<br>';
        }
        hint = hint + '(' + exercise[tpe].hint + ')';
      }
      if (exercise[tpe].info) {
        if (hint) {
          hint = hint + '<br>';
        }
        hint = hint + exercise[tpe].info;
      }
      return hint;
    }
  }

  getInfoAlt(exercise: Exercise): string {
    let alt = '';
    if (exercise.foreign) {
      const alts: string[] = exercise.foreign.alt ? exercise.foreign.alt.split('|') : [];
      alts.forEach( (altItem, i) => {
        if (i > 0) {
          alt = alt + '<br>';
        }
        alt = alt + altItem;
      });
    }
    return alt;
  }

  getSelectOptions(exercise: Exercise): string {
    let options = '';
    if (exercise.options) {
      exercise.options.forEach( (option, i) => {
        if (i > 0) {
          options += '<br>';
        }
        options += option;
      });
    }
    return options;
  }

  getGenus(exercise: Exercise): string {
    if (exercise.genus) {
      return this.text[exercise.genus.toLowerCase()];
    }
  }

  getComparisons(exercise: Exercise): string {
    if (exercise.foreign) {
      const comparisons = exercise.foreign.word.split('|');
      if (comparisons.length === 3) {
        return comparisons.join(', ');
      }
    }
  }

  private removeCurrentExercise() {
    this.isRemoving = true;
    this.buildService
    .removeExercise(this.removingId, this.lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      () => {
        let toRemoveIndex = null;
        this.exercises.forEach((exercise, i) => {
          if (exercise._id === this.removingId) {
            toRemoveIndex = i;
          }
        });
        if (toRemoveIndex !== null) {
          this.removedExercise.emit(toRemoveIndex);
        }
        this.removingId = null;
        this.isRemoving = false;
      },
      error => this.errorService.handleError(error)
    );
  }

  private saveResortedExercises() {
    // Check if none is empty
    const empty = this.exercises.filter(exercise => exercise === null);
    if (empty.length === 0) {
      this.buildService
      .updateExercises(this.exercises, this.lessonId)
      .takeWhile(() => this.componentActive)
      .subscribe(
        () => {console.log('updated exercises'); },
        error => this.errorService.handleError(error)
      );
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
