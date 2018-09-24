import { OnInit, OnDestroy } from '@angular/core';

// TMP: remove later?
import { ReadService } from '../../services/read.service';

import { ReadnListenService } from '../../services/readnlisten.service';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { Language, LicenseUrl } from '../../models/main.model';
import { takeWhile } from 'rxjs/operators';

export abstract class ReadnListenComponent implements OnInit, OnDestroy {
  protected componentActive = true;
  protected userLanguages: Language[];
  myLanguages: Language[]; // filter out selected book language
  myLanguage: Language;
  text: Object = {};
  licenses: LicenseUrl[];
  isReady = false;
  isLoading = false;

  constructor(
    protected readService: ReadService,
    protected readnListenService: ReadnListenService,
    protected userService: UserService,
    protected sharedService: SharedService
  ) {}

  ngOnInit() {
    this.getDependables();
  }

  private getDependables() {
    const options = {
      lan: this.userService.user.main.lan,
      component: 'ReadComponent',
      getTranslations: true,
      getLanguages: true,
      getLicenses: true
    };
    this.isLoading = true;
    this.sharedService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.licenses = dependables.licenseUrls;
        this.text = this.sharedService.getTranslatedText(dependables.translations);
        this.setActiveLanguages(dependables.bookLanguages);
        this.userLanguages = dependables.userLanguages;
        this.myLanguage = this.userService.getUserLanguage(this.userLanguages);
        this.sharedService.setPageTitle(this.text, 'Read');
        this.getBooks();
        this.filterUserLanguages();
        this.isReady = true;
      }
    );
  }

  protected setActiveLanguages(bookLanguages: Language[]) {

  }

  protected getBooks() {

  }

  protected filterUserLanguages() {

  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
