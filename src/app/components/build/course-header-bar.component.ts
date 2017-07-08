import {Component, Input, Output, EventEmitter} from '@angular/core';
import {Course} from '../../models/course.model';

@Component({
  selector: 'km-build-course-header-bar',
  templateUrl: 'course-header-bar.component.html',
  styleUrls: ['headers.css']
})

export class BuildCourseHeaderBarComponent {
  @Input() course: Course;
  @Input() text: Object;
  @Input() canEditCourse = false;
  @Output() edit = new EventEmitter<boolean>();

  onEditCourse() {
    console.log('edit course', this.canEditCourse);
    if (this.canEditCourse) {
      this.edit.emit(true);
    }
  }
}
