import {Component, Input} from '@angular/core';
import {Router} from '@angular/router';
import {Course} from '../../models/course.model';

@Component({
  selector: 'km-course-summary',
  template: `
    <div class="panel panel-default">
      <div class="panel-body">
        <h3>{{course.name}}</h3>
        <button class="btn btn-success" (click)="onStartCourse(course._id)">
          Start Cursus
        </button>
        <button class="btn btn-warning" (click)="onEditCourse(course._id)">
          Pas cursus aan
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
    this.router.navigate(['/build/course/' + courseId]);
  }

  onStartCourse(courseId: string) {
    this.subscribeToCourse(courseId);
    this.router.navigate(['/learn/course/' + courseId]);
  }

  private subscribeToCourse(courseId: string) {
    // TODO: Subscribe to course if not anonymous
  }
}
