import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ErrorService } from '../../services/error.service';
import { SharedService } from '../../services/shared.service';
import { PublicProfile, CompactProfile, Message, Network } from '../../models/user.model';
import { Trophy } from '../../models/book.model';
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
  // publicNetwork: CompactProfile[] = [];
  isCurrentUser: boolean;
  isCurrentlyFollowing: boolean;
  isCurrentlyFollowed: boolean;
  messageShown: boolean;
  message: string;
  infoMsg: string;
  isAdmin: boolean;
  score: number;
  rank: number;
  gender: string;
  trophies: Trophy[] = [];

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
          // this.addFollowed({userId: id});
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
          this.network.following = this.network.following.filter(item => item !== id);
          // check if to remove from buddies !
          /*
          const previousLength = this.publicNetwork.length;
          this.publicNetwork = this.publicNetwork.filter(item => item._id !== id || item.isFollow);
          if (previousLength === this.publicNetwork.length) {
            // Was a two-way connection, remove one connection only
            const follow: CompactProfile = this.publicNetwork.find(item => item._id === id);
            if (follow) {
              follow.isFollower = false;
            }
          }
          */
        },
        error => this.errorService.handleError(error)
      );
    }
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
    this.gender = this.userService.user.main.gender || 'm';
    this.profile = undefined;
    this.isCurrentUser = false;
    this.isCurrentlyFollowing = false;
    this.isCurrentlyFollowed = false;
    this.score = null;
    this.rank = null;
    this.trophies = null;
    this.network = {
      followers: [],
      following: [],
      buddies: []
    };
    this.messageShown = false;
    this.infoMsg = '';
  }

  private getScoreCount(userId: string) {
    this.userService
    .fetchScoreTotal(userId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      score => {
        this.score = score || 0;
        this.rank = this.sharedService.getRank(this.score);
      },
      error => this.errorService.handleError(error)
    );
  }

  private getTrophies(userId: string) {
    this.userService
    .fetchTrophies(userId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (trophies) => {
        trophies.sort(
          (a, b) => (parseInt(a.trophy, 10) > parseInt(b.trophy, 10) ? 1 : ((parseInt(b.trophy, 10) > parseInt(a.trophy, 10)) ? -1 : 0))
        );
        this.trophies = trophies;
      }
    );
  }

  private fetchPublicProfile(user: string) {
    this.userService
    .getPublicProfile(user)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      profile => {
        this.isCurrentUser = this.userService.user._id === profile._id;
        this.profile = profile;
        this.getFollowers(profile._id);
        this.getScoreCount(profile._id);
        this.getTrophies(profile._id);
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

  private getFollowers(userId: string) {
    this.userService
    .fetchFollowers(userId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (network: Network) => {
        this.network = network;
        // const buddies = [...new Set(network.followers.concat(network.following)];
        this.network.buddies = this.getBuddies();
        console.log('Network:', network);
        this.isCurrentlyFollowing = this.checkIfCurrentlyFollowing(network.followers);
        this.isCurrentlyFollowed = this.checkIfCurrentlyFollowed(network.following);
      },
      error => this.errorService.handleError(error)
    );
  }

  private getBuddies(): string[] {
    const buddies = [];
    let isFollowing: string;
    this.network.followers.forEach(follower => {
      isFollowing = this.network.following.find(following => following.toString() === follower.toString());
      if (isFollowing) {
        buddies.push(follower);
      }
    });
    return buddies;
  }

  private checkIfCurrentlyFollowing(following: string[]): boolean {
    const currentId = this.userService.user._id;
    let isFollowing = false;
    if (following && following.find(userId => userId === currentId)) {
      isFollowing = true;
    }
    return isFollowing;
  }

  private checkIfCurrentlyFollowed(followers: string[]): boolean {
    const currentId = this.userService.user._id;
    let isFollowed = false;
    if (followers && followers.find(userId => userId === currentId)) {
      isFollowed = true;
    }
    return isFollowed;
  }

  /*
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
  */

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
