import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Course} from '../../models/course.model';

@Component({
  selector: 'km-course-summary',
  templateUrl: 'course-summary.component.html',
  styleUrls: ['course-summary.component.css']
})

export class CourseSummaryComponent implements OnInit {
  @Input() course: Course;
  @Input() text: {};
  percDone = 0;

  constructor(
    private router: Router
  ) {}

  ngOnInit() {
    if (this.course.exercisesDone) {
      this.percDone = Math.trunc(this.course.exercisesDone / this.course.exerciseCount);
    }
  }

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
