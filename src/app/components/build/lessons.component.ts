import {Component, Input, Output, EventEmitter} from '@angular/core';
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

export class BuildLessonsComponent {
  @Input() courseId: string;
  @Input() lessons: Lesson[];
  @Input() chapters: Chapter[];
  lessonswithnochapter: Lesson[] = [];
  private currentChapter = -1;

  constructor(
    private formBuilder: FormBuilder,
    private buildService: BuildService,
    private errorService: ErrorService
  ) {}

  getLessons(chapterName: string): Lesson[] {
    return this.lessons.filter(lesson => lesson.chapter === chapterName);
  }

  onToggleChapter(chapterNr: number) {
    this.currentChapter = chapterNr === this.currentChapter ? -1 : chapterNr;
  }

  isCurrent(chapter: Chapter) {
    return chapter.nr === this.currentChapter;
  }
}
