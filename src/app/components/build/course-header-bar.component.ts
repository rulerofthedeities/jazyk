import {Component, Input, Output, EventEmitter, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {Course} from '../../models/course.model';

interface SavingData {
  isPublic: boolean;
  isPublished: boolean;
}

@Component({
  selector: 'km-build-course-header-bar',
  templateUrl: 'course-header-bar.component.html',
  styleUrls: ['headers.css']
})

export class BuildCourseHeaderBarComponent implements OnDestroy {
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
    private errorService: ErrorService
  ) {}

  onEditCourse() {
    if (this.canEditCourse) {
      this.edit.emit(true);
    }
  }

  onStartCourse() {
    this.router.navigate(['/learn/course/' + this.course._id]);
  }

  onToggle(property: string) {
    if (!this.savingData[property]) {
      this.course[property] = !this.course[property];
      this.updateCourseProperty(property);
    }
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

  ngOnDestroy() {
    this.componentActive = false;
  }
}
