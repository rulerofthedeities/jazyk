import {Component, Input, Output, OnDestroy} from '@angular/core';
import {LanPair} from '../../models/course.model';
import {Exercise} from '../../models/exercise.model';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {ModalConfirmComponent} from '../modals/modal-confirm.component';

@Component({
  selector: 'km-exercise-list',
  templateUrl: 'exercise-list.component.html',
  styles: [`
    .move {
      margin-left: 10px;
    }
    .item {
      color: gainsboro ;
      font-size: 20px;
      width: 32px;
    }
    .item.active {
      color: black;
    }
    .word {
      margin-left: 8px;
      font-size: 16px;
    }
  `]
})

export class BuildExerciseListComponent implements OnDestroy {
  @Input() exercises: Exercise[];
  @Input() languagePair: LanPair;
  @Input() lessonId: string;
  @Input() text: Object;
  private componentActive = true;
  editingId: string = null;
  removingId: string = null;
  isRemoving = false;

  constructor(
    private buildService: BuildService,
    private errorService: ErrorService
  ) {}

  onEditExercise(id: string) {
    if (!this.isRemoving) {
      this.editingId = id === this.editingId ? null : id;
    }
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
        const wordToRemove = exerciseToRemove.foreignWord;
        msg = msg.replace('%s', wordToRemove);
      }
    }
    return msg;
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
