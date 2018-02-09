import {Component, Input, OnInit, OnDestroy} from '@angular/core';
import {Router} from '@angular/router';
import {CompactProfile} from '../../models/user.model';
import {UserService} from '../../services/user.service';

@Component({
  selector: 'km-compact-profile',
  templateUrl: 'compact-profile.component.html',
  styleUrls: ['compact-profile.component.css']
})

export class UserCompactProfileComponent implements OnInit, OnDestroy {
  @Input() profile: CompactProfile;
  @Input() text: Object;
  private componentActive = true;
  isButton = false;

  constructor(
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit() {
  }

  ngOnChanges() {
    if (this.profile.loadData) {
      this.getUserData(this.profile._id);
    }
  }

  onClickProfile() {
    if (this.profile.userOnly) {
      this.openProfile();
    }
  }

  onOpenProfile() {
    this.openProfile();
  }

  private openProfile() {
    if (this.profile && this.profile.userName) {
      this.router.navigate(['/u/' + this.profile.userName]);
    }
  }

  private getUserData(userId: string) {
    this.userService.getPublicProfileById(userId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      data => {
        if (data) {
          this.profile.userName = data.userName;
          this.profile.emailHash = data.emailHash;
        }
      }
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
