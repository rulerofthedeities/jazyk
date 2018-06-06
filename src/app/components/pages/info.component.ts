import {Component, OnInit, OnDestroy, HostListener} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Meta} from '@angular/platform-browser';
import {PageService} from '../../services/page.service';
import {UserService} from '../../services/user.service';
import {UtilsService} from '../../services/utils.service';
import {AuthService} from '../../services/auth.service';
import {ErrorService} from '../../services/error.service';
import {Page} from '../../models/page.model';
import {takeWhile, filter} from 'rxjs/operators';

@Component({
  template: `
  <div class="panel panel-default transparant">
    <div class="panel-heading">
      <span class="fa fa-info-circle fa-spacing-title"></span>{{page?.title}}
    </div>
    <div class="panel-body">
      <div [innerHTML]="page?.html | sanitizeHtml">
    </div>
  </div>
  `,
  styleUrls: ['page.component.css']
})

export class InfoComponent implements OnInit, OnDestroy {
  private componentActive = true;
  page: Page;

  // Listen for route link events
  @HostListener('window:route-event', ['$event', '$event.detail.route'])
  updateNodes(event, route) {
    if (route) {
      route = route.substr(0, 1) === '/' ? route : '/' + route;
      this.router.navigate([route]);
    }
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private meta: Meta,
    private userService: UserService,
    private authService: AuthService,
    private pageService: PageService,
    private utilsService: UtilsService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.route.params
    .pipe(
      takeWhile(() => this.componentActive),
      filter(params => params.page))
    .subscribe(
      params => this.fetchInfoPage(params['page'].toLowerCase(), this.userService.user.main.lan)
    );
    this.pageService.loadRouteScript(); // For route links
  }

  private fetchInfoPage(pageId: string, lan: string) {
    this.pageService
    .fetchInfoPage(pageId, lan, this.authService.isLoggedIn())
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      fetchedPage => {
        if (fetchedPage) {
          this.setPage(fetchedPage);
        } else if (lan !== 'en') {
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

  private setPage(page: Page) {
    this.page = page;
    this.utilsService.setPageTitle(null, page.title);
    if (page.index === false) {
      this.meta.addTag({name: 'robots', content: 'noindex'});
    }
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
