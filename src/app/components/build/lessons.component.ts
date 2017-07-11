import {Component, Input, Output, EventEmitter, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Chapter, Lesson} from '../../models/course.model';

@Component({
  selector: 'km-build-lessons',
  templateUrl: 'lessons.component.html',
  styles: [`
  `]
})

export class BuildLessonsComponent implements OnDestroy {
  @Input() courseId: string;
  @Input() lessons: Lesson[];
  @Input() chapters: Chapter[];
  @Input() text: Object;
  private componentActive = true;
  private currentChapter = '';

  lessonswithnochapter: Lesson[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private buildService: BuildService,
    private errorService: ErrorService
  ) {}

  getLessons(chapterName: string): Lesson[] {
    return this.lessons.filter(lesson => lesson.chapter === chapterName);
  }

  onToggleChapter(chapterId: string) {
    this.currentChapter = chapterId === this.currentChapter ? '' : chapterId;
  }

  onRemoveChapter(chapterId: string) {
    console.log('removing chapter with id', chapterId);
    this.buildService
    .removeChapter(chapterId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      (removed) => {
        if (removed) {
          this.chapters = this.chapters.filter(chapter => chapter._id !== chapterId);
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  isCurrent(chapter: Chapter) {
    return chapter._id === this.currentChapter;
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
