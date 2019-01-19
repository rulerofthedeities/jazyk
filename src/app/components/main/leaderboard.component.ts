import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { DashboardService } from '../../services/dashboard.service';
import { SharedService } from 'app/services/shared.service';
import { Leader, LeaderUser } from '../../models/score.model';
import { Map } from '../../models/main.model';
import { takeWhile } from 'rxjs/operators';

const maxLeaders = 20,
      maxUserBatch = 10;

@Component({
  templateUrl: 'leaderboard.component.html',
  styleUrls: ['leaderboard.component.css', '../user/user.css']
})

export class LeaderboardComponent implements OnInit, OnDestroy {
  private componentActive = true;
  loadingBoard = false;
  leaders: Map<Leader[]> = {};
  users: LeaderUser[] = [];
  isReady = false;
  text: Object;
  currentLeader: Map<Leader> = {};
  gender = 'm';
  tab = 'week';

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

  onSelectTab(newTab: string) {
    this.tab = newTab;
    this.getLeaders();
  }

  private getLeaders() {
    this.loadingBoard = true;
    this.currentLeader = {};
    this.dashboardService
    .fetchLeaders(maxLeaders, this.tab)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      leaders => {
        this.leaders[this.tab] = leaders;
        this.getUserData();
      }
    );
  }

  private getUserData() {
    // Check if userdata missing for members of this leaderboard
    const leaderIds = this.leaders[this.tab].map(l => l.userName ? null : l.userId).filter(l => l !== null);
    this.getUsers(leaderIds);

    this.loadingBoard = false;
    /*
    const nrLeaders = this.leaders[this.tab].length,
          nrUsers = this.users.length;
    if (nrUsers < nrLeaders) {
      const leaders = this.leaders[this.tab].slice(nrUsers, nrUsers + maxUserBatch),
            leaderIds = leaders.map(leader => leader.userId);
      this.getUsers(leaderIds);
    } else {
      this.checkCurrentUser();
    }
    */
  }

  private getUsers(ids: string[]) {
    if (ids.length) {
      ids = ids.slice(0, maxUserBatch);
      this.userService
      .fetchUsers(ids)
      .pipe(takeWhile(() => this.componentActive))
      .subscribe(
        users => {
          this.users = this.users.concat(users);
          this.updateLeaderData(users);
          this.getUserData();
        }
      );
    } else {
      this.checkCurrentUser();
    }
  }

  private updateLeaderData(users: LeaderUser[]) {
    // Add user data to leader array
    let leader: Leader;
    users.forEach(user => {
      leader = this.leaders[this.tab].find(l => l.userId === user._id);
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
    this.loadingBoard = false; // Show userboard once first batch of users is known
    const currentUserId = this.userService.user._id.toString(),
          leader = this.leaders[this.tab].find(l => l.userId === currentUserId);
    if (!leader) {
      this.getUserRank();
    }
  }

  private getUserRank() {
    const userId = this.userService.user._id;
    this.dashboardService
    .fetchUserRank(userId, this.tab)
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
          this.currentLeader[this.tab] = this.getLeaderData(leader, user);
          this.currentLeader[this.tab].position = userPosition.position;
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
