import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ErrorService } from '../../services/error.service';
import { SharedService } from '../../services/shared.service';
import { PublicProfile, CompactProfile, Message, Followed, Follower, Network } from '../../models/user.model';
import { takeWhile, filter } from 'rxjs/operators';

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
  isCurrentlyFollowed: boolean;
  networkShown: boolean;
  messageShown: boolean;
  message: string;
  infoMsg: string;
  isAdmin: boolean;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private errorService: ErrorService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.isAdmin = !!this.userService.user.isAdmin;
    this.route.params
    .pipe(
      takeWhile(() => this.componentActive),
      filter(params => params.name))
    .subscribe(
      params => {
        this.init();
        this.fetchPublicProfile(params['name'].toLowerCase());
        this.getTranslations();
      }
    );
  }

  onEditProfile() {
    this.router.navigate(['/user/profile']);
  }

  onFollowUser(userId: string) {
    this.infoMsg = '';
    if (!this.isCurrentlyFollowing) {
      const id = this.userService.user._id;
      this.userService
      .followUser(userId)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        follow => {
          this.isCurrentlyFollowing = true;
          this.network.followed.push({userId: id});
          this.addFollowed({userId: id});
          /*
          if (this.networkShown) {
            this.showNetwork();
          }
          */
        },
        error => this.errorService.handleError(error)
      );
    }
  }

  onUnfollowUser(userId: string) {
    this.infoMsg = '';
    this.messageShown = false;
    if (this.isCurrentlyFollowing) {
      const id = this.userService.user._id;
      this.userService
      .unFollowUser(userId)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        unfollow => {
          this.isCurrentlyFollowing = false;
          this.network.followed = this.network.followed.filter(item => item.userId !== id);
          const previousLength = this.publicNetwork.length;
          this.publicNetwork = this.publicNetwork.filter(item => item._id !== id || item.isFollow);
          if (previousLength === this.publicNetwork.length) {
            // Was a two-way connection, remove one connection only
            const follow: CompactProfile = this.publicNetwork.find(item => item._id === id);
            if (follow) {
              follow.isFollower = false;
            }
          }
        },
        error => this.errorService.handleError(error)
      );
    }
  }

  /*
  onShowNetwork() {
    this.infoMsg = '';
    this.showNetwork();
    this.networkShown = true;
  }
  */

  onCloseNetwork() {
    this.networkShown = false;
    this.infoMsg = '';
  }

  onCreateMessage(msgField: any) {
    this.infoMsg = '';
    this.messageShown = true;
  }

  onSendMessage(msg: string) {
    this.sendMessage(this.profile, msg);
  }

  private init() {
    // In case user navigates to another public profile
    this.profile = undefined;
    this.isCurrentUser = false;
    this.isCurrentlyFollowing = false;
    this.isCurrentlyFollowed = false;
    this.publicNetwork = [];
    this.network = {
      follows: [],
      followed: []
    };
    this.networkShown = false;
    this.messageShown = false;
    this.infoMsg = '';
  }

  /*
  private showNetwork() {
    const maxPerCall = 10,
          followers = this.publicNetwork.filter(follower => !follower.userName),
          users: string[] = followers.map(follower => follower._id);
    if (users.length > 0) {
      users.slice(0, maxPerCall);
      this.fetchUserData(users);
    }
  }
*/

  private fetchPublicProfile(user: string) {
    this.userService
    .getPublicProfile(user)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      profile => {
        this.isCurrentUser = this.userService.user._id === profile._id;
        this.profile = profile;
        this.fetchFollowers(profile._id);
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
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      network => {
        this.network = network;
        this.mergeNetwork();
        this.isCurrentlyFollowing = this.checkIfCurrentlyFollowing(this.network.followed);
        this.isCurrentlyFollowed = this.checkIfCurrentlyFollowed(this.network.follows);
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
    if (followed.find(user => user.userId === currentId)) {
      isFollowing = true;
    }
    return isFollowing;
  }

  private checkIfCurrentlyFollowed(follow: Follower[]): boolean {
    const currentId = this.userService.user._id;
    let isFollowed = false;
    if (follow.find(user => user.followId === currentId)) {
      isFollowed = true;
    }
    return isFollowed;
  }

  private fetchUserData(users: string[]) {
    if (users.length > 0 && users[0]) {
      this.userService
      .getCompactProfiles(users)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        profiles => {
          if (profiles) {
            profiles.forEach(profile => {
              this.mapProfileToUser(profile);
            });
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

  private sendMessage(profile: PublicProfile, msg: string) {
    this.messageShown = false;
    this.saveMessage(profile, msg);
    this.log(`Sending message to ${profile.userName}`);
  }

  private saveMessage(profile: PublicProfile, msg: string) {
      const message: Message = {
        recipient: {
          id: profile._id,
          userName: profile.userName,
          emailHash: profile.emailHash
        },
        sender: {
          id: this.userService.user._id,
          userName: this.userService.user.userName,
          emailHash: this.userService.user.emailHash
        },
        message: msg
      };
    this.userService
    .saveMessage(message)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      saved => {
        const info = this.text['MessageSent'];
        this.infoMsg = info.replace('%s', profile.userName);
      },
      error => this.errorService.handleError(error)
    );
  }

  private getTranslations() {
    this.sharedService
    .fetchTranslations(this.userService.user.main.lan, 'UserComponent')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => {
        if (translations) {
          this.text = this.sharedService.getTranslatedText(translations);
          this.sharedService.setPageTitle(this.text, 'PublicProfile');
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  private log(message: string) {
    this.sharedService.sendEventMessage({
      message,
      source: 'UserComponent'
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
