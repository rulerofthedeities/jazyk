import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Course} from '../../models/course.model';
import {UserService} from '../../services/user.service';

@Component({
  selector: 'km-learn-course-summary',
  templateUrl: 'course-summary.component.html',
  styleUrls: ['course-summary.component.css']
})

export class LearnCourseSummaryComponent implements OnInit {
  @Input() course: Course;
  @Input() text: {};
  leds: number[];

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.setDifficulty();
  }

  onEditCourse() {
    this.router.navigate(['/build/course/' + this.course._id]);
  }

  onStartCourse() {
    if (this.course.isPublished) {
      console.log('subscribing to course', this.course);
      this.userService.subscribeToCourse(this.course);
      this.router.navigate(['/learn/course/' + this.course._id]);
    }
  }

  setDifficulty() {
    let difficulty = 0;
    const allLeds = Array(10).fill(0);
    if (this.course.difficulty) {
      difficulty = Math.round((1000 - this.course.difficulty) / 100);
    }
    this.leds = allLeds.slice(0, difficulty);
  }
}
