import {Component, Input, Output, EventEmitter, OnInit, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {BuildService} from '../../services/build.service';
import {SharedService} from '../../services/shared.service';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {Course, AccessLevel} from '../../models/course.model';

interface SavingData {
  isPublic: boolean;
  isPublished: boolean;
}

@Component({
  selector: 'km-build-course-header-bar',
  templateUrl: 'course-header-bar.component.html',
  styleUrls: ['headers.css']
})

export class BuildCourseHeaderBarComponent implements OnInit, OnDestroy {
  @Input() course: Course;
  @Input() text: Object;
  @Input() canEditCourse = false;
  @Input() showLink = false;
  @Output() edit = new EventEmitter<boolean>();
  private componentActive = true;
  savingData: SavingData = {
    isPublic: false,
    isPublished: false
  };

  constructor(
    private router: Router,
    private buildService: BuildService,
    private sharedService: SharedService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    if (this.userService.getAccessLevel(this.course.access) < 4) {
      this.canEditCourse = false;
    }
  }

  onEditCourse() {
    if (this.canEditCourse) {
      this.edit.emit(true);
    }
  }

  onStartCourse() {
    if (this.course.isPublished) {
      this.userService.subscribeToCourse(this.course);
      this.log(`Start course '${this.course.name}'`);
      this.router.navigate(['/learn/course/' + this.course._id]);
    }
  }

  onTestCourse() {
    this.router.navigate(['/learn/course/' + this.course._id]);
  }

  onToggle(property: string) {
    if (this.canEditCourse && !this.savingData[property]) {
      if (property !== 'isPublished' || this.course.isPublished === false) { // you cannot unpublish
        this.course[property] = !this.course[property];
        this.updateCourseProperty(property);
      }
    }
  }

  getAccess(): string {
    const level = this.userService.getAccessLevel(this.course.access);
    return this.text[AccessLevel[level]] || '?';
  }

  getToolTip(property: string): string {
    let toolTip: string;
    const isProperty = this.course[property];
    switch (property) {
      case 'isPublic':
        toolTip = isProperty ? 'iCoursePublic' : 'iCourseNotPublic';
      break;
      case 'isPublished':
        toolTip = isProperty ? 'iCoursePublished': 'iCourseNotPublished';
      break;
      case 'isInProgress':
        toolTip = isProperty ? 'iCourseInProgress': 'iCourseComplete';
      break;
    }
    return toolTip ? this.text[toolTip] : '';
  }

  private updateCourseProperty(property: string) {
    this.savingData[property] = true;
    this.buildService
    .updateCourseProperty(this.course._id, property, this.course[property])
    .takeWhile(() => this.componentActive)
    .subscribe(
      data => this.savingData[property] = false,
      error => this.errorService.handleError(error)
    );
  }

  private log(message: string) {
    this.sharedService.sendEventMessage({
      message,
      source: 'CourseSummaryComponent'
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
