import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {PublicProfile, CompactProfile} from '../../models/user.model';
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
  profile: PublicProfile;
  network: Network;
  publicNetwork: CompactProfile[] = [];
  isCurrentUser: boolean;
  isCurrentlyFollowing: boolean;
  courses: Courses;
  showCoursesLearning: boolean;
  showCoursesTeaching: boolean;
  networkShown: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.route.params
    .takeWhile(() => this.componentActive)
    .subscribe(
      params => {
        console.log('route params user profile');
        if (params['name']) {
          this.init();
          this.fetchPublicProfile(params['name'].toLowerCase());
          this.getTranslations();
        }
      }
    );
  }

  onEditProfile() {
    this.router.navigate(['/user/profile']);
  }

  onFollowUser(userId: string) {
    if (!this.isCurrentlyFollowing) {
      const id = this.userService.user._id;
      this.userService
      .followUser(userId)
      .takeWhile(() => this.componentActive)
      .subscribe(
        follow => {
          this.isCurrentlyFollowing = true;
          this.network.followed.push({userId: id});
          console.log('add new user to network', id);
          this.addFollowed({userId: id});
          if (this.networkShown) {
            this.showNetwork();
          }
        },
        error => this.errorService.handleError(error)
      );
    }
  }

  onUnfollowUser(userId: string) {
    console.log('removing', userId);
    if (this.isCurrentlyFollowing) {
      const id = this.userService.user._id;
      this.userService
      .unFollowUser(userId)
      .takeWhile(() => this.componentActive)
      .subscribe(
        unfollow => {
          this.isCurrentlyFollowing = false;
          console.log('removing id', id);
          this.network.followed = this.network.followed.filter(item => item.userId !== id);
          console.log('old network', this.publicNetwork);
          const previousLength = this.publicNetwork.length;
          this.publicNetwork = this.publicNetwork.filter(item => item._id !== id || item.isFollow);
          console.log('new network', this.publicNetwork, id);
          if (previousLength === this.publicNetwork.length) {
            // Was a two-way connection, remove one connection only
            const follow: CompactProfile = this.publicNetwork.find(item => item._id === id);
            console.log('length equal', follow);
            if (follow) {
              follow.isFollower = false;
            }
          }
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
    this.showNetwork();
    this.networkShown = true;
  }

  onCloseNetwork() {
    this.networkShown = false;
  }

  private init() {
    // In case user navigates to another public profile
    this.profile = undefined;
    this.isCurrentUser = false;
    this.isCurrentlyFollowing = false;
    this.publicNetwork = [];
    this.network = {
      follows: [],
      followed: []
    };
    this.courses = {
      learning: [],
      teaching: []
    };
    this.showCoursesLearning = false;
    this.showCoursesTeaching = false;
    this.networkShown = false;
  }

  private showNetwork() {
    const maxPerCall = 10,
          followers = this.publicNetwork.filter(follower => !follower.userName),
          users: string[] = followers.map(follower => follower._id);
    console.log('users in network', this.publicNetwork, users);
    if (users.length > 0) {
      users.slice(0, 10);
      this.fetchUserData(users);
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
        this.mergeNetwork();
        this.isCurrentlyFollowing = this.checkIfCurrentlyFollowing(this.network.followed);
      },
      error => this.errorService.handleError(error)
    );
  }

  private mergeNetwork() {
    this.network.followed.forEach(followed => {
      this.addFollowed(followed);
    });
    this.network.follows.forEach(follow => {
      this.addFollow(follow);
    });
  }

  private addFollowed(followed: Followed) {
    const follow: CompactProfile = this.publicNetwork.find(user => user._id === followed.userId);
    if (!follow) {
      this.publicNetwork.push({
        _id: followed.userId,
        isFollower: true,
        isFollow: false
      });
    } else {
      follow.isFollower = true;
    }
  }

  private addFollow(follow: Follower) {
    const followed: CompactProfile = this.publicNetwork.find(user => user._id === follow.followId);
    if (!followed) {
      this.publicNetwork.push({
        _id: follow.followId,
        isFollower: false,
        isFollow: true
      });
    } else {
      followed.isFollow = true;
    }
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
    if (users.length > 0 && users[0]) {
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
  }

  private mapProfileToUser(profile: CompactProfile) {
    const follower: CompactProfile = this.publicNetwork.find(user => user._id === profile._id);
    follower.emailHash = profile.emailHash;
    follower.userName = profile.userName;
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
