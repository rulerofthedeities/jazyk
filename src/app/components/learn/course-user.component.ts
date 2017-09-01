import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Course} from '../../models/course.model';
import {UserService} from '../../services/user.service';

@Component({
  selector: 'km-learn-course-user',
  templateUrl: 'course-user.component.html',
  styleUrls: ['course-summary.component.css']
})

export class LearnCourseUserComponent implements OnInit {
  @Input() course: Course;
  @Input() text: {};
  percDone = 0;
  leds: number[];

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit() {
    if (this.course.exercisesDone) {
      this.percDone = Math.floor(this.course.exercisesDone / this.course.exerciseCount);
    }
    this.setDifficulty();
  }

  onContinueCourse(step: string) {
    const steproute = step ? '/' + step : '';
    this.userService.continueCourse(this.course);
    this.router.navigate(['/learn/course/' + this.course._id + steproute]);
  }

  setDifficulty() {
    let difficulty = 0;
    const allLeds = Array<number>(10).fill(0);
    if (this.course.difficulty) {
      difficulty = Math.round((1000 - this.course.difficulty) / 100);
    }
    this.leds = allLeds.slice(0, difficulty);
  }
}
