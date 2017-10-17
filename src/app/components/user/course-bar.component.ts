import {Component, Input} from '@angular/core';
import {Router} from '@angular/router';
import {UserService} from '../../services/user.service';
import {Course} from '../../models/course.model';

@Component({
  selector: 'km-course-bar',
  templateUrl: 'course-bar.component.html',
  styleUrls: ['course-bar.component.css']
})

export class UserCourseBarComponent {
  @Input() course: Course;
  @Input() text: Object;

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  onGoToCourse(course: Course) {
    this.userService.subscribeToCourse(course);
    this.router.navigate(['/learn/course/' + course._id]);
  }
}
