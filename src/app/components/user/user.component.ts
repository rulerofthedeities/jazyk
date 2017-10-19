import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {PublicProfile} from '../../models/user.model';
import {Course} from '../../models/course.model';
import 'rxjs/add/operator/takeWhile';

interface Follower {
  followId: string;
}
interface Followed {
  userId: string;
}

interface Network {
  follows: Follower[];
  followed: Followed[];
}

interface Courses {
  learning: Course[];
  teaching: Course[];
}

@Component({
  templateUrl: 'user.component.html',
  styleUrls: ['user.css', 'user.component.css']
})

export class UserComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object;
  profileFound: boolean;
  profile: PublicProfile;
  network: Network;
  isCurrentUser: boolean;
  isCurrentlyFollowing: boolean;
  courses: Courses;
  showCoursesLearning = false;
  showCoursesTeaching = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.courses = {
      learning: [],
      teaching: []
    };
    this.route.params
    .takeWhile(() => this.componentActive)
    .subscribe(
      params => {
        if (params['name']) {
          this.fetchPublicProfile(params['name'].toLowerCase());
          this.getTranslations();
        }
      }
    );
  }

  onFollowUser(id: string) {
    if (id && !this.isCurrentlyFollowing) {
      this.userService
      .followUser(id)
      .takeWhile(() => this.componentActive)
      .subscribe(
        follow => {
          this.isCurrentlyFollowing = true;
          this.network.followed.push({userId: id});
        },
        error => this.errorService.handleError(error)
      );
    }
  }

  onUnfollowUser(id: string) {
    if (id && this.isCurrentlyFollowing) {
      this.userService
      .unFollowUser(id)
      .takeWhile(() => this.componentActive)
      .subscribe(
        unfollow => {
          this.isCurrentlyFollowing = false;
          this.network.followed = this.network.followed.filter(item => item.userId !== id);
        },
        error => this.errorService.handleError(error)
      );
    }
  }

  onShowCourses(tpe: string) {
    if (!this.courses[tpe]) {
      this.fetchCourses(tpe, true);
    } else {
      this.showCourses(tpe);
    }
  }

  onCloseCourses(tpe: string) {
    if (tpe === 'teaching') {
      this.showCoursesTeaching = false;
    } else {
      this.showCoursesLearning = false;
    }

  }

  private showCourses(tpe: string) {
    console.log('showing courses', tpe, this.courses[tpe]);
    if (tpe === 'teaching') {
      this.showCoursesTeaching = true;
    } else {
      this.showCoursesLearning = true;
    }
  }

  private fetchCourses(tpe: string, show = false) {
    if (tpe === 'teaching') {
      this.fetchCoursesTeaching(show);
    }
  }

  private fetchCoursesTeaching(show: boolean) {
    this.userService
    .getCoursesTeaching(this.profile._id)
    .takeWhile(() => this.componentActive)
    .subscribe(
      courses => {
        this.courses.teaching = courses;
        console.log('courses teaching', courses);
      },
      error => this.errorService.handleError(error)
    );
  }

  private fetchPublicProfile(user: string) {
    this.userService
    .getPublicProfile(user)
    .takeWhile(() => this.componentActive)
    .subscribe(
      profile => {
        this.isCurrentUser = this.userService.user._id === profile._id;
        this.profile = profile;
        this.fetchFollowers(profile._id);
        this.fetchCourses('teaching');
        console.log('profile', profile);
      },
      error => {
        if (error.status === 404) {
          this.router.navigate(['/404']);
        } else {
          this.errorService.handleError(error);
        }
      }
    );
  }

  private fetchFollowers(userId: string) {
    this.userService
    .getFollowers(userId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      network => {
        this.network = network;
        this.isCurrentlyFollowing = this.checkIfCurrentlyFollowing(this.network.followed);
      },
      error => this.errorService.handleError(error)
    );
  }

  private checkIfCurrentlyFollowing(followed: Followed[]): boolean {
    const currentId = this.userService.user._id;
    let isFollowing = false;
    if (followed.find(follower => follower.userId === currentId)) {
      isFollowing = true;
    };
    return isFollowing;
  }

  private getTranslations() {
    this.utilsService
    .fetchTranslations(this.userService.user.main.lan, 'UserComponent')
    .takeWhile(() => this.componentActive)
    .subscribe(
      translations => {
        if (translations) {
          this.text = this.utilsService.getTranslatedText(translations);
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
