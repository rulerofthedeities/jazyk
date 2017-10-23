import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {PublicProfile} from '../../models/user.model';
import {Course} from '../../models/course.model';
import 'rxjs/add/operator/takeWhile';

interface CompactProfile {
  _id: string;
  userName?: string;
  emailHash?: string;
  isFollower?: boolean;
  isFollow?: boolean;
}

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
  private network: Network;
  public publicNetwork: CompactProfile[] = [];
  isCurrentUser: boolean;
  isCurrentlyFollowing: boolean;
  courses: Courses;
  showCoursesLearning = false;
  showCoursesTeaching = false;
  showNetwork = false;

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

  onEditProfile() {
    this.router.navigate(['/user/profile']);
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

  onShowNetwork() {
    this.showNetwork = true;
    console.log(this.network);
    const maxPerCall = 10;
    /*
    const followers = this.network.followed.filter(follower => !follower.profile);
    followers.forEach(follower => this.addId(users, follower.userId));
    if (users.length < maxPerCall) {
      const follows = this.network.follows.filter(follow => !follow.profile);
      follows.forEach(follow => this.addId(users, follow.followId));
    }
    */
    const followers = this.publicNetwork.filter(follower => !follower.userName),
          users: string[] = followers.map(follower => follower._id);
    console.log('users in network', users);
    if (users.length > 0) {
      users.slice(0, 10);
      this.fetchUserData(users);
    }
  }

  onCloseNetwork() {
    this.showNetwork = false;
  }
/*
  private addId(users: string[], userId: string) {
    if (!users.find(user => user === userId)) {
      users.push(userId);
    }
  }
*/
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
        this.mergeNetwork();
        this.isCurrentlyFollowing = this.checkIfCurrentlyFollowing(this.network.followed);
      },
      error => this.errorService.handleError(error)
    );
  }

  private mergeNetwork() {
    this.network.followed.forEach(followed => {
      if (!this.publicNetwork.find(user => user._id === followed.userId)) {
        this.publicNetwork.push({
          _id: followed.userId,
          isFollower: true,
          isFollow: false
        });
      }
    });
    this.network.follows.forEach(follow => {
      const followed = this.publicNetwork.find(user => user._id === follow.followId);
      if (!followed) {
        this.publicNetwork.push({
          _id: follow.followId,
          isFollower: false,
          isFollow: true
        });
      } else {
        followed.isFollow = true;
      }
    });
  }

  private checkIfCurrentlyFollowing(followed: Followed[]): boolean {
    const currentId = this.userService.user._id;
    let isFollowing = false;
    if (followed.find(follower => follower.userId === currentId)) {
      isFollowing = true;
    };
    return isFollowing;
  }

  private fetchUserData(users: string[]) {
    this.userService
    .getCompactProfiles(users)
    .takeWhile(() => this.componentActive)
    .subscribe(
      profiles => {
        if (profiles) {
          console.log('profiles', profiles);
          profiles.forEach(profile => {
            this.mapProfileToUser(profile);
          });
          console.log('new network', this.network);
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private mapProfileToUser(profile: CompactProfile) {
    const follower = this.publicNetwork.find(user => user._id === profile._id);
    follower.emailHash = profile.emailHash;
    follower.userName = profile.userName;
    /*
    const follower = this.network.followed.find(user => user.userId === profile._id);
    if (follower) {
      follower.profile = profile;
    }
    const follow = this.network.followed.find(user => user.userId === profile._id);
    if (follow) {
      follow.profile = profile;
    }
    */
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
