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
  @Input() lessonIds: string[];
  @Input() text: Object;
  @Output() remove = new EventEmitter();
  @Output() sorted = new EventEmitter();
  private isRemoving = false;
  lessonDict: Map<Lesson> = {}; // For sorting
  isReady = false;

  constructor(
    private router: Router
  ) {}

  ngOnInit() {
    console.log('lessons for chapter', this.lessonIds);
    let lessonId: string;
    let lesson: Lesson;
    let saveSortedIds = false;
    this.lessons.forEach(lesson1 => {
      this.lessonDict[lesson1._id] = lesson1;
      // If a lesson is not in sorting array, add id
      lessonId = this.lessonIds.find(id => id === lesson1._id);
      if (!lessonId) {
        console.log('id not found for ', lesson1._id);
        this.lessonIds.push(lesson1._id);
        saveSortedIds = true;
      }
    });
    this.lessonIds.forEach((id, i) => {
      // if a lesson for an id is not found, remove id
      lesson = this.lessons.find(lesson2 => id === lesson2._id);
      if (!lesson) {
        console.log('lesson not found for', id);
        this.lessonIds.splice(i, 1);
        saveSortedIds = true;
      }
    });
    this.isReady = true;
    if (saveSortedIds) {
      this.sorted.emit();
    }
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
    this.sorted.emit();
  }

  private editLesson(lessonId: string) {
    this.router.navigate(['/build/lesson/' + lessonId]);
  }
}
