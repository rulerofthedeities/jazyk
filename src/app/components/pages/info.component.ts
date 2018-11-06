import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { PageService } from '../../services/page.service';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';
import { AuthService } from '../../services/auth.service';
import { ErrorService } from '../../services/error.service';
import { Page } from '../../models/page.model';
import { takeWhile, filter } from 'rxjs/operators';

@Component({
  templateUrl: 'info.component.html',
  styleUrls: ['info.component.css']
})

export class InfoComponent implements OnInit, OnDestroy {
  private componentActive = true;
  private lanCode: string;
  page: Page;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private meta: Meta,
    private userService: UserService,
    private authService: AuthService,
    private pageService: PageService,
    private sharedService: SharedService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.lanCode = this.userService.user.main.lan;
    this.route.params
    .pipe(
      takeWhile(() => this.componentActive),
      filter(params => params.page))
    .subscribe(
      params => this.fetchInfoPage(params['page'].toLowerCase(), this.lanCode)
    );
  }

  private fetchInfoPage(pageId: string, lanCode: string) {
    this.pageService
    .fetchInfoPage(pageId, lanCode, this.authService.isLoggedIn())
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      fetchedPage => {
        if (fetchedPage) {
          this.setMetaTags(fetchedPage);
        } else if (lanCode !== 'en') {
          // No info page available in the user's interface language
          this.fetchInfoPage(pageId.toLowerCase(), 'en');
        }
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

  private setMetaTags(page: Page) {
    this.page = page;
    this.sharedService.setPageTitle(null, page.title);
    // Add meta tags
    if (page.index === false) {
      this.meta.addTag({name: 'robots', content: 'noindex'});
    }
    const isoCode = this.sharedService.getContentLanguageCode(this.lanCode);
    this.meta.addTag({'http-equiv': 'Content-Language', content: isoCode});
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
