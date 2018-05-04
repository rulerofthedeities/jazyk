import {Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, ChangeDetectorRef, AfterViewChecked} from '@angular/core';
import {Router} from '@angular/router';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Lesson, Map} from '../../models/course.model';
import {ExerciseType} from '../../models/exercise.model';
import {ModalConfirmComponent} from '../modals/modal-confirm.component';

@Component({
  selector: 'km-chapter-lessons',
  templateUrl: 'chapter-lessons.component.html',
  styleUrls: ['chapter.component.css']
})
export class BuildChapterLessonsComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {
  @Input() private lessons: Lesson[];
  @Input() lessonIds: string[];
  @Input() text: Object;
  @Input() chapterNr: number = null;
  @Output() remove = new EventEmitter<string>();
  @Output() sorted = new EventEmitter<string[]>();
  private componentActive = true;
  private lessonToRemove: string;
  private sortingId: string; // Workaround for sorting bug
  private draggingId: string; // Workaround for sorting bug
  lessonDict: Map<Lesson> = {}; // For sorting
  isReady = false;

  constructor(
    private router: Router,
    private buildService: BuildService,
    private errorService: ErrorService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.filterLessonIds();
  }

  ngOnChanges() {
    if (this.lessonIds) {
      if (this.lessonIds.length !== this.lessons.length) {
        this.filterLessonIds();
      }
    }
  }

  ngAfterViewChecked() {
    this.cdRef.detectChanges();
  }

  onEditLesson(event: MouseEvent, lessonId: string) {
    event.preventDefault();
    this.editLesson(lessonId);
  }

  onRemoveLesson(event: MouseEvent, lessonId: string, confirm: ModalConfirmComponent) {
    event.preventDefault();
    this.askRemoveLesson(lessonId, confirm);
  }

  onRemoveConfirmed(removeOk: boolean) {
    if (removeOk && this.lessonToRemove) {
      this.remove.emit(this.lessonToRemove);
      this.lessonToRemove = null;
    }
  }

  onResorted(id: string) {
    this.sortingId = id;
    this.sorted.emit(this.lessonIds);
  }

  onDraggedStart(id: string) {
    this.draggingId = id;
  }

  onDraggedEnd(id: string) {
    if (this.sortingId !== this.draggingId) {
      this.sorted.emit(this.lessonIds);
    }
    this.sortingId = null;
    this.draggingId = null;
  }

  getRemoveMessage(): string {
    let msg = '';
    if (this.lessonToRemove) {
      const name = this.lessonDict[this.lessonToRemove].name;
      if (this.text['RemoveLesson']) {
        msg = this.text['RemoveLesson'];
        msg = msg.replace('%s', name);
      }
    }
    return msg;
  }

  getExercisesLabels(lessonId: string): string {
    const lesson = this.lessonDict[lessonId],
          nrWords = lesson.exercises.filter(exercise => exercise.tpe === ExerciseType.Word).length,
          nrExercises = lesson.exercises.length - nrWords,
          hasIntro = !!(lesson.intro && lesson.intro.length > 10),
          hasDialogue = !!(lesson.dialogue && lesson.dialogue.text.length > 10);
    let label = nrWords.toString();
    if (nrWords === 1) {
      label += ' ' + this.text['word'];
    } else {
      label += ' ' + this.text['words'];
    }
    if (nrExercises > 0) {
      label += ', ' + nrExercises.toString();
      if (nrExercises === 1) {
        label += ' ' + this.text['exercise'];
      } else {
        label += ' ' + this.text['exercises'];
      }
    }

    return label;
  }

  private editLesson(lessonId: string) {
    this.router.navigate(['/build/lesson/' + lessonId]);
  }

  private askRemoveLesson(lessonId: string, confirm: ModalConfirmComponent) {
    if (!this.lessonToRemove) {
      this.lessonToRemove = lessonId;
      confirm.showModal = true;
    }
  }

  private filterLessonIds() {
    let lessonId: string;
    let lesson: Lesson;
    let saveSortedIds = false;
    this.lessons.forEach(lesson1 => {
      this.lessonDict[lesson1._id] = lesson1;
      // If a lesson is not in sorting array, add id
      lessonId = this.lessonIds.find(id => id === lesson1._id);
      if (!lessonId) {
        this.lessonIds.push(lesson1._id);
        this.cdRef.detectChanges();
        saveSortedIds = true;
      }
    });
    this.lessonIds.forEach((id, i) => {
      // if a lesson for an id is not found, remove id
      lesson = this.lessons.find(lesson2 => id === lesson2._id);
      if (!lesson) {
        this.lessonIds.splice(i, 1);
        this.cdRef.detectChanges();
        saveSortedIds = true;
      }
    });
    this.isReady = true;
    if (saveSortedIds) {
      this.sorted.emit(this.lessonIds);
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
