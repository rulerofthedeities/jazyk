import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { PageService } from '../../services/page.service';
import { SharedService } from '../../services/shared.service';
import { AuthService } from '../../services/auth.service';
import { ErrorService } from '../../services/error.service';
import { Map } from '../../models/main.model';
import { Page, ManualIndex } from '../../models/page.model';
import { takeWhile, filter } from 'rxjs/operators';

@Component({
  templateUrl: 'manual.component.html',
  styleUrls: ['manual.component.css', 'page.component.css']
})

export class ManualComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object;
  page: Page;
  index: ManualIndex[];
  isIndex = false;
  sectionClosed: boolean[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private meta: Meta,
    private authService: AuthService,
    private pageService: PageService,
    private sharedService: SharedService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.route.params
    .pipe(
      takeWhile(() => this.componentActive),
      filter(params => params.page))
    .subscribe(
      params => {
        if (params['page']) {
          const pageName = params['page'].toLowerCase();
          if (pageName === 'index') {
            this.isIndex = true;
            this.getDependables();
            this.getManualIndex();
          } else {
            this.isIndex = false;
            this.getManualPage(pageName);
          }
        }
      }
    );
  }

  onGoToManualPage(item: ManualIndex) {
    if (item.isHeader) {
      this.sectionClosed[item.sort] = !this.sectionClosed[item.sort];
    } else {
      this.router.navigate(['/manual/', item.name]);
    }
  }

  onReturnToIndex() {
    this.router.navigate(['/manual/index']);
  }

  isSectionClosed(item: ManualIndex): boolean {
    const levels = item.sort.split('.');
    let parent: string,
        closed = false;
    // check if one of the parents is closed
    for (let i = 0; i < levels.length - 1; i++) {
      parent = item.sort.split('.', i + 1).join('.');
      if (this.sectionClosed[parent]) {
        closed = true;
      }
    }
    return closed;
  }

  getPath(item: ManualIndex): string {
    return encodeURIComponent(item.name);
  }

  private getManualIndex() {
    this.pageService
    .fetchManualIndex()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      index => {
        this.index = this.processIndex(index);
      }
    );
  }

  private getManualPage(pageName: string) {
    this.pageService
    .fetchManualPage(pageName)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      page => {
        this.page = page;
      }
    );
  }

  private processIndex(index: ManualIndex[]): ManualIndex[] {
    index.forEach(item => {
      item.level = item.sort.split('.').length;
    });
    return index;
  }
/*

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
*/

private getDependables() {
  const options = {
    lan: 'en',
    component: 'PageComponent',
    getTranslations: true
  };
  this.sharedService
  .fetchDependables(options)
  .pipe(takeWhile(() => this.componentActive))
  .subscribe(
    dependables => {
      this.text = this.sharedService.getTranslatedText(dependables.translations);
      this.sharedService.setPageTitle(this.text, 'Manual');
    }
  );
}

  ngOnDestroy() {
    this.componentActive = false;
  }
}
