import {Component, OnInit, OnDestroy} from '@angular/core';
import {UserService} from '../../services/user.service';
import {ErrorService} from '../../services/error.service';
import {UtilsService} from '../../services/utils.service';
import 'rxjs/add/operator/takeWhile';

interface Score {
  course: string,
  lan: string,
  points: number
}

@Component({
  templateUrl: 'score.component.html',
  styleUrls: ['score.component.css', 'user.css']
})

export class UserScoreComponent implements OnInit, OnDestroy {
  private componentActive = true;
  text: Object = {};
  scores: Score[] = [];
  total: number;
  rank: number;
  gender: string;

  constructor(
    private utilsService: UtilsService,
    private userService: UserService,
    private errorService: ErrorService
  ) {}

  ngOnInit() {
    this.getTranslations();
    this.fetchScores();
  }

  private fetchScores() {
    this.userService
    .fetchScoreCourses()
    .takeWhile(() => this.componentActive)
    .subscribe(
      data => {
        this.scores = data.scores;
        this.total = data.total || 0;
        this.gender = this.userService.user.main.gender || 'm';
        this.rank = this.utilsService.getRank(this.total);
        console.log(this.userService.user);
      },
      error => this.errorService.handleError(error)
    );
  }

  private getTranslations() {
    this.utilsService
    .fetchTranslations(this.userService.user.main.lan, 'UserComponent')
    .takeWhile(() => this.componentActive)
    .subscribe(
      translations => {
        if (translations) {
          this.text = this.utilsService.getTranslatedText(translations);
        }
      },
      error => this.errorService.handleError(error)
    );
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
