import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Course} from '../../models/course.model';

@Component({
  selector: 'km-learn-course-summary',
  templateUrl: 'learn-course-summary.component.html',
  styleUrls: ['learn-course-summary.component.css']
})

export class LearnCourseSummaryComponent implements OnInit {
  @Input() course: Course;
  @Input() text: {};
  percDone = 0;
  private allLeds = Array(10).fill(0);
  leds: number[];

  constructor(
    private router: Router
  ) {}

  ngOnInit() {
    if (this.course.exercisesDone) {
      this.percDone = Math.trunc(this.course.exercisesDone / this.course.exerciseCount);
    }
    this.setDifficulty();
  }

  onEditCourse(courseId: string) {
    this.router.navigate(['/build/course/' + courseId]);
  }

  onStartCourse(courseId: string) {
    this.subscribeToCourse(courseId);
    this.router.navigate(['/learn/course/' + courseId]);
  }

  setDifficulty() {
    let difficulty = 0;
    if (this.course.difficulty) {
      difficulty = Math.round((1000 - this.course.difficulty) / 100);
    }
    this.leds = this.allLeds.slice(0, difficulty);
    return difficulty;
  }

  private subscribeToCourse(courseId: string) {
    // TODO: Subscribe to course if not anonymous
  }
}
