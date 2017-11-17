import {Component, Input, Output, OnInit, EventEmitter} from '@angular/core';
import {Router} from '@angular/router';
import {Course, UserCourse, CourseListType} from '../../models/course.model';
import {UserService} from '../../services/user.service';

@Component({
  selector: 'km-course-summary',
  templateUrl: 'course-summary.component.html',
  styleUrls: ['course-summary.component.css']
})

export class LearnCourseSummaryComponent implements OnInit {
  @Input() course: Course;
  @Input() userData: UserCourse = null;
  @Input() text: {};
  @Input() tpe: CourseListType;
  @Output() unsubscribe = new EventEmitter<string>();
  listType = CourseListType;
  percDone = 0;

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.course.exercisesCount = this.course.totalCount - this.course.wordCount;
    if (this.tpe === CourseListType.Learn) {
      this.percDone = 0; // Todo : get count done
    }
  }

  onEditCourse() {
    this.router.navigate(['/build/course/' + this.course._id]);
  }

  onStartCourse() {
    if (this.course.isPublished) {
      this.userService.subscribeToCourse(this.course);
      this.router.navigate(['/learn/course/' + this.course._id]);
    }
  }

  onContinueCourse(step: string) {
    const steproute = step ? '/' + step : '';
    this.userService.continueCourse(this.course);
    console.log('go to course', '/learn/course/' + this.course._id + steproute);
    this.router.navigate(['/learn/course/' + this.course._id + steproute]);
  }

  onStopLearningCourse() {
    this.unsubscribe.emit(this.course._id);
  }

  isAuthor(authorIds: string[]): boolean {
    let isAuthor = false;
    if (authorIds && authorIds.length > 0) {
      const userId = this.userService.user._id;
      if (authorIds.find(authId => authId === userId)) {
        isAuthor = true;
      }
    }
    return isAuthor;
  }
}
