import {Component, Input} from '@angular/core';
import {Router} from '@angular/router';
import {Course} from '../../models/course.model';

@Component({
  selector: 'km-course-summary',
  template: `
    <div class="panel panel-default">
      <div class="panel-body">
        <h3>{{course.name}}</h3>
        <button class="btn btn-warning" (click)="onEditCourse(course._id)">
          Pas Cursus aan
        </button>
      </div>
    </div>
  `
})

export class CourseSummaryComponent {
  @Input() course: Course;

  constructor(
    private router: Router
  ) {}

  onEditCourse(courseId: string) {
    console.log('editing course', courseId);
    this.router.navigate(['/build/course/' + courseId]);
  }
}
