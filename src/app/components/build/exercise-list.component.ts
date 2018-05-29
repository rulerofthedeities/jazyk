import {Component, Input, Output, OnDestroy, EventEmitter,
        ViewChild, ElementRef, HostListener} from '@angular/core';
import {LanPair, LessonOptions, LanConfigs, UserAccess, AccessLevel} from '../../models/course.model';
import {Exercise, ExerciseType} from '../../models/exercise.model';
import {BuildService} from '../../services/build.service';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {ModalConfirmComponent} from '../modals/modal-confirm.component';
import {takeWhile} from 'rxjs/operators';

@Component({
  selector: 'km-exercise-list',
  templateUrl: 'exercise-list.component.html',
  styleUrls: ['exercise-list.component.css']
})

export class BuildExerciseListComponent implements OnDestroy {
  @Input() exercises: Exercise[];
  @Input() languagePair: LanPair;
  @Input() configs: LanConfigs;
  @Input() access: UserAccess[];
  @Input() lessonId: string;
  @Input() courseId: string;
  @Input() lessonOptions: LessonOptions;
  @Input() text: Object;
  @Input() isBidirectional: boolean;
  @Output() removedExercise = new EventEmitter<number>();
  private componentActive = true;
  private isRemoving = false;
  private sortingId: string; // Workaround for sorting bug
  private draggingId: string; // Workaround for sorting bug
  editingId: string = null;
  viewId: string = null;
  removingId: string = null;
  exType = ExerciseType;
  showArrowDropDown = false;
  arrowDropDownId: string = null;
  @ViewChild('dropdown') el: ElementRef;
  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (this.el && !this.el.nativeElement.contains(event.target)) {
      // Outside list, close dropdown
      this.showArrowDropDown = false;
    }
  }

  constructor(
    private buildService: BuildService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  trackByFn(index: number, item: Exercise) {
    return item._id;
  }

  onEditExercise(id: string) {
    this.viewId = null;
    this.showArrowDropDown = false;
    if (!this.isRemoving) {
      this.editingId = id === this.editingId ? null : id;
    }
  }

  onToggleArrows(id: string) {
    if (this.arrowDropDownId === id && this.showArrowDropDown) {
      this.showArrowDropDown = false;
    } else {
      this.arrowDropDownId = id;
      this.showArrowDropDown = true;
    }
  }

  onCancelEdit() {
    this.editingId = null;
    this.showArrowDropDown = false;
  }

  onMoveExercise(exercise: Exercise, i: number, direction: string) {
    this.exercises.splice(i, 1);
    if (direction === 'down') {
      this.exercises.push(exercise);
    } else {
      this.exercises.unshift(exercise);
    }
    this.saveResortedExercises();
  }

  onUpdatedExercise(updatedExercise: Exercise) {
    this.showArrowDropDown = false;
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

  onResorted(id: string) {
    this.sortingId = id;
    this.saveResortedExercises();
  }

  onDraggedStart(id: string) {
    this.showArrowDropDown = false;
    this.draggingId = id;
  }

  onDraggedEnd(id: string) {
    if (this.sortingId !== this.draggingId) {
      this.saveResortedExercises();
    }
    this.sortingId = null;
    this.draggingId = null;
  }

  onViewExercise(id: string) {
    this.showArrowDropDown = false;
    this.editingId = null;
    this.viewId = this.viewId === id ? null : id;
  }

  getInfinitive(words: string): string {
    const wordsArr = words.split('|');
    return wordsArr[0];
  }

  getRemoveMessage(): string {
    let msg = '';
    const exerciseToRemove = this.exercises.find(exercise => exercise._id === this.removingId);
    if (exerciseToRemove) {
      msg = exerciseToRemove.tpe === this.exType.Word ? this.text['RemoveWord'] : this.text['RemoveExercise'];
      const wordToRemove = exerciseToRemove.foreign.word.replace(';', '|');
      const wordsArr = wordToRemove.split('|');
      msg = msg.replace('%s', wordsArr[0]);
    }
    return msg;
  }

  getWordInfo(exercise: Exercise): string {
    const infoArr: string[] = [],
          annotations = this.getInfoAnnotations(exercise, 'local'),
          genus = this.getInfoGenus(exercise),
          hint = this.getInfoHint(exercise, 'local');
    infoArr.push(annotations);
    infoArr.push(genus);
    infoArr.push(hint);
    return infoArr.filter(info => !!info).join('<br>');
  }

  private getInfoAnnotations(exercise: Exercise, tpe: string): string {
    let annotationList: string[] = [];
    if (exercise[tpe]) {
      annotationList = exercise[tpe].annotations ? exercise[tpe].annotations.split('|') : [];
    }
    return annotationList.join('<br>');
  }

  private getInfoGenus(exercise: Exercise): string {
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

  private getInfoHint(exercise: Exercise, tpe: string): string {
    let hint = '';
    if (exercise[tpe] && exercise[tpe].hint) {
      hint = '(' + exercise[tpe].hint + ')';
    }
    return hint;
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
      const optionArray = exercise.options.split('|');
      optionArray.forEach( (option, i) => {
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
        // remove alts
        return comparisons.map(comparison => comparison.split(';')[0]).join(', ');
      }
    }
  }

  isEditor(): boolean {
    return this.userService.hasAccessLevel(this.access, AccessLevel.Editor);
  }

  private removeCurrentExercise() {
    this.isRemoving = true;
    this.buildService
    .removeExercise(this.removingId, this.lessonId)
    .pipe(takeWhile(() => this.componentActive))
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
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        () => {
          this.showArrowDropDown = false;
          this.arrowDropDownId = null;
        },
        error => this.errorService.handleError(error)
      );
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
