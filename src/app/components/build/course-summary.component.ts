import {Component, Input} from '@angular/core';
import {Router} from '@angular/router';
import {UserService} from '../../services/user.service';
import {Course} from '../../models/course.model';

@Component({
  selector: 'km-build-course-summary',
  templateUrl: 'course-summary.component.html',
  styleUrls: ['course-summary.component.css']
})

export class BuildCourseSummaryComponent {
  @Input() course: Course;
  @Input() text: Object;

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  onEditCourse() {
    this.router.navigate(['/build/course/' + this.course._id]);
  }

  onStartCourse() {
    if (this.course.isPublished) {
      this.userService.subscribeToCourse(this.course);
      this.router.navigate(['/learn/course/' + this.course._id]);
    }
  }
}
