import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Course} from '../../models/course.model';

@Component({
  selector: 'km-course-summary',
  template: `
    <pre>{{course|json}}</pre>
    <div class="panel panel-default">
      <div class="panel-body">
        <div class="image">
          <img src="/assets/img/courses/{{course.image}}">
        </div>
        <div class="course">
          <h3>{{course.name}}
            <span class="icons">
              <span class="fa" [ngClass]="{'fa-lock': !course.isPublic, 'fa-user':course.isPublic}"></span>
              <span class="fa" [ngClass]="{'fa-power-off': !course.isPublished, 'fa-check':course.isPublished}"></span>
            </span>
          </h3>
          <button class="btn btn-success" (click)="onStartCourse(course._id)">
            {{text.startcourse}}
          </button>
          <button class="btn btn-warning" (click)="onEditCourse(course._id)">
            {{text.updatecourse}}
          </button>
          <div class="info">
          
          </div>
          <div class="progress">
            <div 
              class="progress-bar progress-bar-striped" 
              role="progressbar" 
              [attr.aria-valuenow]="course.exercisesDone"
              aria-valuemin="0" 
              [attr.aria-valuemax]="course.exerciseCount" 
              [style.width.%]="percDone">
              <span>
                {{course.exercisesDone}}/{{course.exerciseCount}} ({{percDone}}%)
              </span>
            </div>
          </div> 
        </div>
      </div>
    </div>
  `,
  styles: [`
    .image {
      width: 162px;
      height: 202px;
      border: 1px solid #333;
      float: left;
    }
    .course {
      margin-left: 180px;
    }
    .info {
      height: 107px;
    }
    h3 {
      margin-top:0;
    }
    .icons {
      font-size: 16px;
      color: #999;
      display: inline-block;
      margin-left: 10px;
    }
    .icons .fa-user, .icons .fa-check {
      color: green;
    }
    .progress {
      height: 26px;
    }
    .progress-bar {
      font-size: inherit;
      line-height: 26px;
    }
  `]
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
    this.percDone = 27;
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
