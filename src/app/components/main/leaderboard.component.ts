import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { DashboardService } from '../../services/dashboard.service';
import { SharedService } from 'app/services/shared.service';
import { Leader, LeaderUser } from '../../models/score.model';
import { takeWhile } from 'rxjs/operators';

const maxLeaders = 10,
      maxUserBatch = 10;

@Component({
  templateUrl: 'leaderboard.component.html',
  styleUrls: ['leaderboard.component.css', '../user/user.css']
})

export class LeaderboardComponent implements OnInit, OnDestroy {
  private componentActive = true;
  loadingBoard = false;
  leaders: Leader[] = [];
  users: LeaderUser[] = [];
  isReady = false;
  text: Object;
  currentLeader: Leader;
  gender = 'm';

  constructor(
    private dashboardService: DashboardService,
    private sharedService: SharedService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.getLeaders();
    this.getTranslations();
    this.gender = this.userService.user.main.gender || 'm';
  }

  onGoToProfile(userName: string) {
    this.router.navigate(['/u/' + userName]);
  }

  private getLeaders() {
    this.loadingBoard = true;
    this.dashboardService
    .fetchLeaders(maxLeaders)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      leaders => {
        this.leaders = leaders;
        this.getUserData();
      }
    );
  }

  private getUserData() {
    const nrLeaders = this.leaders.length,
          nrUsers = this.users.length;
    if (nrUsers < nrLeaders) {
      const leaders = this.leaders.slice(nrUsers, nrUsers + maxUserBatch),
            leaderIds = leaders.map(leader => leader.userId);
      this.getUsers(leaderIds);
    } else {
      this.checkCurrentUser();
    }
  }

  private getUsers(ids: string[]) {
    this.userService
    .fetchUsers(ids)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      users => {
        this.users = this.users.concat(users);
        this.updateLeaderData(users);
        this.loadingBoard = false; // Show userboard once first batch of users is known
        this.getUserData();
      }
    );
  }

  private updateLeaderData(users: LeaderUser[]) {
    // Add user data to leader array
    let leader: Leader;
    users.forEach(user => {
      leader = this.leaders.find(l => l.userId === user._id);
      if (leader) {
        leader = this.getLeaderData(leader, user);
      }
    });
  }

  private getLeaderData(leader: Leader, user: LeaderUser) {
    leader.userName = user.userName;
    leader.emailHash = user.emailHash;
    leader.rank = this.sharedService.getRank(leader.points);
    leader.rankName = this.text['rank' + leader.rank.toString() + this.gender];
    leader.isCurrentUser = leader.userId === this.userService.user._id;
    return leader;
  }

  private checkCurrentUser() {
    // Check if current user is in leaderboard
    // If not, add to bottom
    const currentUserId = this.userService.user._id.toString(),
          leader = this.leaders.find(l => l.userId === currentUserId);
    if (!leader) {
      this.getUserRank();
    }
  }

  private getUserRank() {
    const userId = this.userService.user._id;
    this.dashboardService
    .fetchUserRank(userId)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      userPosition => {
        if (userPosition && userPosition.position) {
          const leader = {
                  points: userPosition.points,
                  userId
                },
                user = {
                  _id: userId,
                  userName: this.userService.user.userName,
                  emailHash: this.userService.user.emailHash
                };
          this.currentLeader = this.getLeaderData(leader, user);
          this.currentLeader.position = userPosition.position;
          console.log('current', this.currentLeader);
        }
      }
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
          this.sharedService.setPageTitle(this.text, 'Leaderboard');
          this.isReady = true;
        }
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
