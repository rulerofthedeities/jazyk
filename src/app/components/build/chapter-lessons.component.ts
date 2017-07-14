import {Component, Input, Output, EventEmitter, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Lesson} from '../../models/course.model';
import {ModalConfirmComponent} from '../modals/modal-confirm.component';

interface Map<T> {
    [K: string]: T;
}

@Component({
  selector: 'km-chapter-lessons',
  templateUrl: 'chapter-lessons.component.html',
  styleUrls: ['chapter.component.css']
})
export class BuildChapterLessonsComponent implements OnInit {
  @Input() private lessons: Lesson[];
  @Input() text: Object;
  @Output() remove = new EventEmitter();
  @Output() sorted = new EventEmitter();
  private isRemoving = false;
  lessonIds = []; // For sorting
  lessonDict: Map<Lesson> = {}; // For sorting
  isReady = false;

  constructor(
    private router: Router
  ) {}

  ngOnInit() {
    this.lessonIds = this.lessons.map(lesson => lesson._id);
    this.lessons.forEach(lesson => {
      this.lessonDict[lesson._id] = lesson;
    });
    this.isReady = true;
  }

  onClick(e: any, action: string) {
    event.preventDefault();
    switch (action) {
      case 'editlesson':
        this.editLesson(e);
      break;
    }
  }

  onResorted() {
    console.log('resorted', this.lessonIds);
  }

  private editLesson(lessonId: string) {
    this.router.navigate(['/build/lesson/' + lessonId]);
  }
}
