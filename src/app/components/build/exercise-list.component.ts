import {Component, Input, Output, OnDestroy} from '@angular/core';
import {LanPair} from '../../models/course.model';
import {Exercise} from '../../models/exercise.model';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {ModalConfirmComponent} from '../modals/modal-confirm.component';

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
  private componentActive = true;
  private isRemoving = false;
  editingId: string = null;
  removingId: string = null;
  focusField: string = null;

  constructor(
    private buildService: BuildService,
    private errorService: ErrorService
  ) {}

  onEditExercise(id: string, focus = null) {
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

  onMoveExercise(i: number) {
    if (!this.isRemoving) {
      console.log('move exercise');
    }
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

  getInfoHint(exercise: Exercise): string {
    let hint = '';
    if (exercise.foreign.hint) {
      if (hint) {
        hint = hint + '<br>';
      }
      hint = hint + exercise.foreign.hint;
    }
    if (exercise.foreign.info) {
      if (hint) {
        hint = hint + '<br>';
      }
      hint = hint + exercise.foreign.info;
    }
    return hint;
  }

  getInfoAlt(exercise: Exercise): string {
    let alt = '';
    const alts = exercise.foreign.alt.split('|');
    alts.forEach( (altItem, i) => {
      if (i > 0) {
        alt = alt + '<br>';
      }
      alt = alt + altItem;
    });
    return alt;
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
        if (toRemoveIndex) {
          this.exercises.splice(toRemoveIndex, 1);
        }
        this.removingId = null;
        this.isRemoving = false;
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
