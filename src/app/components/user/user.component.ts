import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ErrorService } from '../../services/error.service';
import { SharedService } from '../../services/shared.service';
import { PublicProfile, CompactProfile, Message, Network } from '../../models/user.model';
import { Trophy } from '../../models/book.model';
import { takeWhile, filter } from 'rxjs/operators';

const maxProfiles = 20; // Max nr of compact profiles fetched at one time

@Component({
  templateUrl: 'user.component.html',
  styleUrls: ['user.css', 'user.component.css']
})

export class UserComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object;
  profile: PublicProfile;
  network: Network;
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
  loadingNetwork: boolean;
  loadingTrophies: boolean;
  loadingPoints: boolean;

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
          this.network.followers.push(id);
          this.network.buddies = this.getBuddies();
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
          this.network.followers = this.network.followers.filter(item => item.toString() !== id.toString());
          this.network.followersDetail = this.network.followersDetail.filter(item => item.toString() !== id.toString());
          this.network.buddies = this.network.buddies.filter(item => item.toString() !== id.toString());
          this.network.buddiesDetail = this.network.buddiesDetail.filter(item => item.toString() !== id.toString());
        },
        error => this.errorService.handleError(error)
      );
    }
  }

  onToggleNetwork(tpe: string) {
    if (this.isCurrentUser) {
      const key = 'show' + tpe.charAt(0).toUpperCase() + tpe.slice(1);
      this.network[key] = !this.network[key];
      if (this.network[key]) {
        this.getNetworkDetails(tpe);
      }
    }
  }

  onShowMore(tpe: string) {
    this.getNetworkDetails(tpe);
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
      buddies: [],
      followersDetail: [],
      followingDetail: [],
      buddiesDetail: [],
      showFollowers: false,
      showFollowing: false,
      showBuddies: false,
      loadingFollowers: false,
      loadingFollowing: false,
      loadingBuddies: false
    };
    this.loadingNetwork = false;
    this.loadingTrophies = false;
    this.loadingPoints = false;
    this.messageShown = false;
    this.infoMsg = '';
  }

  private getScoreCount(userId: string) {
    this.loadingPoints = true;
    this.userService
    .fetchScoreTotal(userId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      score => {
        this.score = score || 0;
        this.rank = this.sharedService.getRank(this.score);
        this.loadingPoints = false;
      },
      error => this.errorService.handleError(error)
    );
  }

  private getNetwork(userId: string) {
    this.loadingNetwork = true;
    this.userService
    .fetchFollowers(userId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (network: Network) => {
        this.network = network;
        this.network.followingDetail = [];
        this.network.followersDetail = [];
        this.network.buddiesDetail = [];
        // const buddies = [...new Set(network.followers.concat(network.following)];
        this.network.buddies = this.getBuddies();
        this.isCurrentlyFollowing = this.checkIfCurrentlyFollowing(network.followers);
        this.isCurrentlyFollowed = this.checkIfCurrentlyFollowed(network.following);
        this.loadingNetwork = false;
      },
      error => this.errorService.handleError(error)
    );
  }

  private getTrophies(userId: string) {
    this.loadingTrophies = true;
    this.userService
    .fetchTrophies(userId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (trophies) => {
        trophies.sort(
          (a, b) => (parseInt(a.trophy, 10) > parseInt(b.trophy, 10) ? 1 : ((parseInt(b.trophy, 10) > parseInt(a.trophy, 10)) ? -1 : 0))
        );
        this.trophies = trophies;
        this.loadingTrophies = false;
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
        this.getNetwork(profile._id);
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

  private getNetworkDetails(tpe: string) {
    const toFetch: string[] = [];
    let toAdd: boolean,
        userId: string;
    // Get list of ids that have no profiles yet
    if (this.network[tpe].length > this.network[tpe + 'Detail'].length) {
      if (tpe === 'buddies' && this.network.buddies.length > this.network.buddiesDetail.length) {
        let toCheck: boolean,
            profile: CompactProfile;
        // First get already fetched profiles from followers & following
        this.network.buddies.forEach(buddy => {
          toCheck = !this.network.buddiesDetail.find(detail => detail._id.toString() === buddy.toString());
          if (toCheck) {
            profile = this.network.followingDetail.find(detail => detail._id.toString() === buddy.toString());
            if (profile) {
              this.network.buddiesDetail.push(profile);
            }
          }
        });
      }
      for (let i = 0; i < this.network[tpe].length && toFetch.length < maxProfiles; i++) {
        userId = this.network[tpe][i].toString();
        toAdd = !this.network[tpe + 'Detail'].find(user => user._id.toString() === userId);
        if (toAdd) {
          toFetch.push(userId);
        }
      }
      this.getUserData(toFetch, tpe);
    }
  }

  private getUserData(userIds: string[], tpe: string) {
    if (userIds.length > 0 && userIds[0]) {
      const key = 'loading' + tpe.charAt(0).toUpperCase() + tpe.slice(1);
      this.network[key] = true;
      this.userService
      .getCompactProfiles(userIds)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        profiles => {
          if (profiles) {
            this.network[tpe + 'Detail'] = this.network[tpe + 'Detail'].concat(profiles);
          }
          this.network[key] = false;
        },
        error => this.errorService.handleError(error)
      );
    }
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
