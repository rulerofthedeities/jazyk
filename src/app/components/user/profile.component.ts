import { Component, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ErrorService } from '../../services/error.service';
import { SharedService } from '../../services/shared.service';
import { Profile } from '../../models/user.model';
import { takeWhile } from 'rxjs/operators';

@Component({
  templateUrl: 'profile.component.html',
  styleUrls: ['user.css']
})

export class UserProfileComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};
  profileForm: FormGroup;
  isFormReady = false;
  infoMsg: string;

  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
    private sharedService: SharedService,
    private userService: UserService,
    private errorService: ErrorService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    this.getTranslations();
    this.fetchProfile();
  }

  onUpdateProfile(form: any) {
    if (form.valid) {
      const profile = this.buildProfile(form.value);
      this.updateProfile(profile);
    }
  }

  onEditGravatar() {
    // Redirect to gravatar page
    if (isPlatformBrowser(this.platformId)) {
      // Client only code.
      window.open('https://gravatar.com/emails/', '_blank');
    }
    if (isPlatformServer(this.platformId)) {
      // Server only code.
    }
  }

  onGoToPublicProfile() {
    this.userService.goToPublicProfile();
  }

  getHash() {
    return this.userService.user ? this.userService.user.emailHash : '';
  }

  private fetchProfile() {
    this.userService
    .getProfile()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      profile => {
        this.buildForm(profile);
      },
      error => this.errorService.handleError(error)
    );
  }

  private updateProfile(newProfile: Profile) {
    this.userService
    .saveProfile(newProfile)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      result => {
        this.infoMsg = this.text['ProfileUpdated'];
        this.profileForm.markAsPristine();
      },
      error => this.errorService.handleError(error)
    );
  }

  private buildProfile(formValues: any): Profile {
    return {
      bio: formValues['bio'],
      realName: formValues['realName'],
      location: formValues['location'],
      nativeLan: formValues['nativeLan'],
      timeZone: formValues['timeZone']
    };
  }

  private buildForm(profile: Profile) {
    this.profileForm = this.formBuilder.group({
      bio: [profile.bio],
      realName: [profile.realName],
      location: [profile.location],
      nativeLan: [profile.nativeLan],
      timeZone: [profile.timeZone]
    });
    this.isFormReady = true;
  }

  private getTranslations() {
    this.sharedService
    .fetchTranslations(this.userService.user.main.lan, 'UserComponent')
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      translations => {
        if (translations) {
          this.text = this.sharedService.getTranslatedText(translations);
          this.sharedService.setPageTitle(this.text, 'Profile');
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
