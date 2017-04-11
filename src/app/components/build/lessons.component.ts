import {Component, Input, Output, EventEmitter} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Chapter, Lesson} from '../../models/course.model';

@Component({
  selector: 'km-build-lessons',
  template: `
    <ul class="chapters">
      <li *ngFor="let chapter of chapters">
        {{chapter.nr}}. {{chapter.name}}
        <ul class="lessons">
          <li *ngFor="let lesson of getLessons(chapter.name)">
            {{lesson.nr}}. {{lesson.name}}
          </li>
        </ul>
      </li>
    </ul>

    >>>> NO CHAPTER
    <ul class="nochapters">
      <li *ngFor="let lesson of getLessons('')">
        {{lesson.nr}}. {{lesson.name}}
      </li>
    </ul>

  `
})

export class BuildLessonsComponent {
  @Input() courseId: string;
  @Input() lessons: Lesson[];
  @Input() chapters: Chapter[];
  lessonswithnochapter: Lesson[] = [];
  private componentActive = true;

  constructor(
    private formBuilder: FormBuilder,
    private buildService: BuildService,
    private errorService: ErrorService
  ) {}

  getLessons(chapterName: string): Lesson[] {
    return this.lessons.filter(lesson => lesson.chapter === chapterName);
  }

/*
  getChapters() {
    this.lessons.map(lesson => {if (!lesson.chapter) {
        lesson.chapter = {nr: 0, name: ''};
        this.lessonswithnochapter.push(lesson);
      }
    });
    this.lessons = this.lessons.filter(lesson => lesson.chapter.nr > 0);
  }
*/
}
