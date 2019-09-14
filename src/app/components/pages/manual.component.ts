import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { PageService } from '../../services/page.service';
import { SharedService } from '../../services/shared.service';
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
  nextPage: ManualIndex;
  index: ManualIndex[];
  isIndex = false;
  sectionClosed: boolean[] = [];
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private pageService: PageService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.route.params
    .pipe(
      takeWhile(() => this.componentActive),
      filter(params => params.page))
    .subscribe(
      params => {
        if (params['page']) {
          this.nextPage = null;
          const pageName: string = params['page'].toLowerCase();
          this.isLoading = true;
          if (pageName === 'index') {
            this.isIndex = true;
          } else {
            this.isIndex = false;
          }
          this.getDependables(pageName);
        }
      }
    );
  }

  onToIndex() {
    this.router.navigate(['/manual/index']);
  }

  onToManualPage(item: ManualIndex) {
    if (item.isHeader) {
      this.sectionClosed[item.sort] = !this.sectionClosed[item.sort];
    } else {
      this.router.navigate(['/manual/', item.name]);
    }
  }

  onToPreviousPage() {
    this.location.back();
  }

  onToNextPage(nextPage: Page) {
    if (nextPage) {
      this.router.navigate(['/manual/', nextPage.name]);
    }
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

  getRoute(event: any) {
    const tpe = event.target.getAttribute('data-tpe');
    if (event.target && event.target.getAttribute('href') && tpe !== 'ext') {
      event.preventDefault();
      this.router.navigate([event.target.getAttribute('href')]);
    }
  }

  private getManualIndex(pageName: string) {
    this.pageService
    .fetchManualIndex()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      index => {
        if (this.isIndex) {
          this.index = this.processIndex(index);
          this.isLoading = false;
        } else {
          const nextIndex = index.filter(page => page.isHeader !== true);
          this.getManualPage(pageName, nextIndex);
        }
      }
    );
  }

  private getManualPage(pageName: string, nextIndex: ManualIndex[]) {
    this.pageService
    .fetchManualPage(pageName)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      page => {
        this.page = page;
        if (page) {
          this.setPageTitle();
          this.setNextPage(nextIndex);
          this.isLoading = false;
        } else {
          this.router.navigate(['/manual/index']);
        }
      }
    );
  }

  private setNextPage(nextIndex: ManualIndex[]) {
    let nextPage: ManualIndex,
        index: number;
    if (this.page && nextIndex) {
      index = nextIndex.findIndex(page => page.name === this.page.name);
    }
    if (index !== undefined) {
      nextPage = nextIndex[index + 1];
    }
    this.nextPage = nextPage;
  }

  private processIndex(index: ManualIndex[]): ManualIndex[] {
    index.forEach(item => {
      item.level = item.sort.split('.').length;
    });
    return index;
  }

  private setPageTitle() {
    if (this.text) {
      if (!this.isIndex && this.page && this.page.title) {
        this.sharedService.setPageTitle(null, this.text['Manual'] + ' - ' + this.page.title);
      }  else {
        this.sharedService.setPageTitle(this.text, 'Manual');
      }
    }
  }

private getDependables(pageName: string) {
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
      this.setPageTitle();
      this.getManualIndex(pageName); // also required for navigation
    }
  );
}

  ngOnDestroy() {
    this.componentActive = false;
  }
}
