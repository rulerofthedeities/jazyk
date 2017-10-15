import {Component, OnInit, OnDestroy} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import {PublicProfile} from '../../models/user.model';
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
        if (params['id']) {
          this.fetchPublicProfile(params['id'].toLowerCase());
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

  private fetchPublicProfile(user: string) {
    this.userService
    .getPublicProfile(user)
    .takeWhile(() => this.componentActive)
    .subscribe(
      profile => {
        this.isCurrentUser = this.userService.user._id === profile._id;
        this.profile = profile;
        this.fetchFollowers(profile._id);
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
    .fetchTranslations(this.userService.user.lan, 'UserComponent')
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
