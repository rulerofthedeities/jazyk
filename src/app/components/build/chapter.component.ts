import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {Lesson} from '../../models/course.model';

@Component({
  selector: 'km-chapter',
  templateUrl: 'chapter.component.html',
  styleUrls: ['chapter.component.css']
})
export class BuildChapterComponent {
  @Input() lessons: Lesson[];
  @Input() title: string;
  @Input() total: number;
  @Input() isOpen: boolean;
  @Output() toggleOpen = new EventEmitter();

  constructor(
    private router: Router
  ) {}

  onClick(e: any, action: string) {
    e.preventDefault();
    switch (action) {
      case 'open' : this.openChapter();
      break;
    }
  }

  openChapter() {
    this.toggleOpen.emit();
  }

  onEditLesson(lessonId: string) {
    this.router.navigate(['/build/lesson/' + lessonId]);
  }
}
