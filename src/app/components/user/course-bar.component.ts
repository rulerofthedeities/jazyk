import {Component, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {UserService} from '../../services/user.service';
import {UtilsService} from '../../services/utils.service';
import {Course} from '../../models/course.model';

@Component({
  selector: 'km-course-bar',
  templateUrl: 'course-bar.component.html',
  styleUrls: ['course-bar.component.css']
})

export class UserCourseBarComponent implements OnInit {
  @Input() course: Course;
  @Input() text: Object;
  defaultImage: string;
  regionTo: string;

  constructor(
    private router: Router,
    private userService: UserService,
    private utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.defaultImage = this.utilsService.getDefaultCourseImagePath(this.course);
    this.regionTo = this.utilsService.getRegionTo(this.course);
  }

  onGoToCourse(course: Course) {
    this.userService.subscribeToCourse(course);
    this.router.navigate(['/learn/course/' + course._id]);
  }
}
