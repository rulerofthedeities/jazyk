import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { CompactProfile } from '../../models/user.model';

@Component({
  selector: 'km-compact-profile',
  templateUrl: 'compact-profile.component.html',
  styleUrls: ['compact-profile.component.css']
})

export class UserCompactProfileComponent {
  @Input() profile: CompactProfile;
  @Input() text: Object;
  isButton = false;

  constructor(
    private router: Router,
  ) {}

  onOpenProfile() {
    this.openProfile();
  }

  private openProfile() {
    if (this.profile && this.profile.userName) {
      this.router.navigate(['/u/' + this.profile.userName]);
    }
  }
}
