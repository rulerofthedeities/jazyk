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
  percDone = 0;
  private allLeds = Array(10).fill(0);
  leds: number[];

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit() {
    if (this.course.exercisesDone) {
      this.percDone = Math.trunc(this.course.exercisesDone / this.course.exerciseCount);
    }
    this.setDifficulty();
  }

  onEditCourse() {
    this.router.navigate(['/build/course/' + this.course._id]);
  }

  onStartCourse() {
    console.log('starting course', this.course);
    this.userService.subscribeToCourse(this.course);
    this.router.navigate(['/learn/course/' + this.course._id]);
  }

  setDifficulty() {
    let difficulty = 0;
    if (this.course.difficulty) {
      difficulty = Math.round((1000 - this.course.difficulty) / 100);
    }
    this.leds = this.allLeds.slice(0, difficulty);
    return difficulty;
  }
}
