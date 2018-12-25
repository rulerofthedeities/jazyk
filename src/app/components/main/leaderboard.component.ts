import { Component, OnInit, OnDestroy } from '@angular/core';
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

  constructor(
    private dashboardService: DashboardService,
    private sharedService: SharedService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.getLeaders();
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
        this.isReady = true;
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
    }
  }

  private getUsers(ids: string[]) {
    console.log('getting data for users', ids);
    this.userService
    .fetchUsers(ids)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      users => {
        this.users = this.users.concat(users);
        this.updateLeaderData(users);
        this.loadingBoard = false; // Show userboard once first batch of users is known
        console.log('users', users);
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
        leader.userName = user.userName;
        leader.emailHash = user.emailHash;
        leader.rank = this.sharedService.getRank(leader.points);
      }
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
