import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReadService } from '../../services/read.service';
import { UserService } from '../../services/user.service';
import { UtilsService } from '../../services/utils.service';
import { Language } from '../../models/course.model';
import { takeWhile } from 'rxjs/operators';

@Component({
  template: `
    <router-outlet></router-outlet>
    READ COMPONENT
  `
})

export class ReadComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};
  selectedLanguage: Language;
  languages: Language[];
  isLoading = false;
  isError = false;
  isReady = false;

  constructor(
    private readService: ReadService,
    private userService: UserService,
    private utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.getDependables();
  }

  private getDependables() {
    const options = {
      lan: this.userService.user.main.lan,
      component: 'ReadComponent',
      getTranslations: true,
      getLanguages: true
    };
    this.utilsService
    .fetchDependables(options)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      dependables => {
        this.text = this.utilsService.getTranslatedText(dependables.translations);
        this.setActiveLanguages(dependables.languages);
        this.utilsService.setPageTitle(this.text, 'Read');
        // this.getCourses();
        this.isReady = true;
      }
    );
  }

  private setActiveLanguages(languages: Language[]) {
    this.languages = languages.filter(language => language.active);
    const allLanguage = this.utilsService.getAllLanguage();
    this.languages.unshift(allLanguage);
    this.selectedLanguage = this.userService.getUserLearnLanguage(this.languages);
  }
  ngOnDestroy() {
    this.componentActive = false;
  }
}
