import {Component, Input, Output, EventEmitter, OnDestroy} from '@angular/core';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Lesson, LessonId} from '../../models/course.model';

@Component({
  selector: 'km-build-lessons',
  templateUrl: 'lessons.component.html',
  styles: [`
  `]
})

export class BuildLessonsComponent implements OnDestroy {
  @Input() courseId: string;
  @Input() lessons: Lesson[];
  @Input() lessonIds: LessonId[];
  @Input() chapters: string[];
  @Input() text: Object;
  @Output() sorted = new EventEmitter<LessonId>();
  private componentActive = true;
  private currentChapter = '';
  lessonswithnochapter: Lesson[] = [];

  constructor(
    private buildService: BuildService,
    private errorService: ErrorService
  ) {}

  getLessons(chapterName: string): Lesson[] {
    return this.lessons.filter(lesson => lesson.chapterName === chapterName);
  }

  getLessonIds(chapterName: string): string[] {
    let chapterLessons: string[] = [];
    const lessonId: LessonId = this.lessonIds.filter(lesson => lesson.chapter === chapterName)[0];
    if (lessonId && lessonId.lessonIds) {
      chapterLessons = lessonId.lessonIds;
    }
    return chapterLessons;
  }

  onToggleChapter(chapter: string) {
    this.currentChapter = chapter === this.currentChapter ? '' : chapter;
  }

  onRemoveChapter(chapterName: string) {
    this.removeChapter(chapterName);
  }

  onRemoveLesson(lessonId: string) {
    this.removeLesson(lessonId);
  }

  onResortedChapters() {
    this.saveResortedChapters();
  }

  onResortedLessons(chapter: string, lessonIdItems: string[]) {
    this.sorted.emit({chapter, lessonIds: lessonIdItems});
  }

  isCurrent(chapter: string) {
    return chapter === this.currentChapter;
  }

  private saveResortedChapters() {
    this.buildService
    .updateChapters(this.courseId, this.chapters)
    .takeWhile(() => this.componentActive)
    .subscribe(
      () => {console.log('updated sorted chapters'); },
      error => this.errorService.handleError(error)
    );
  }

  private removeChapter(chapterName: string) {
    console.log('removing chapter ', this.courseId, chapterName);
    this.buildService
    .removeChapter(this.courseId, chapterName)
    .takeWhile(() => this.componentActive)
    .subscribe(
      (removed) => {
        if (removed) {
          this.chapters = this.chapters.filter(chapter => chapter !== chapterName);
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private removeLesson(lessonId: string) {
    if (lessonId) {
      this.buildService
      .removeLesson(lessonId)
      .takeWhile(() => this.componentActive)
      .subscribe(
        (removed) => {
          if (removed) {
            console.log('lesson removed', lessonId);
            console.log(this.lessons, this.lessonIds);
            this.lessons = this.lessons.filter(lesson => lesson._id !== lessonId);
            this.lessonIds.forEach(lesson => {
              lesson.lessonIds = lesson.lessonIds.filter(id => id !== lessonId);
            });
            console.log(this.lessons, this.lessonIds);
          }
        },
        error => this.errorService.handleError(error)
      );
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
