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

  onResortedChapters() {
    this.saveResortedChapters();
  }

  onResortedLessons() {
    this.saveResortedLessons();
  }

  isCurrent(chapter: string) {
    return chapter === this.currentChapter;
  }

  private saveResortedChapters() {
    this.buildService
    .updateChapters(this.courseId, this.chapters)
    .takeWhile(() => this.componentActive)
    .subscribe(
      () => {console.log('updated chapters'); },
      error => this.errorService.handleError(error)
    );
  }

  private saveResortedLessons() {
    console.log('saving lesson Ids', this.lessonIds);

    this.buildService
    .updateLessonIds(this.courseId, this.lessonIds)
    .takeWhile(() => this.componentActive)
    .subscribe(
      () => {console.log('updated chapters'); },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
