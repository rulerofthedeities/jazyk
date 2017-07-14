import {Component, Input, Output, EventEmitter, OnDestroy} from '@angular/core';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Lesson} from '../../models/course.model';

@Component({
  selector: 'km-build-lessons',
  templateUrl: 'lessons.component.html',
  styles: [`
  `]
})

export class BuildLessonsComponent implements OnDestroy {
  @Input() courseId: string;
  @Input() lessons: Lesson[];
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

  onResorted() {
    this.saveResortedChapters();
  }

  isCurrent(chapter: string) {
    return chapter === this.currentChapter;
  }

  private saveResortedChapters() {
    this.buildService
    .updateChapters(this.chapters, this.courseId)
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
