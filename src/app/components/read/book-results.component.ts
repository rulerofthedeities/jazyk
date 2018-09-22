import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { SessionData, Trophy } from '../../models/book.model';
import { takeWhile } from 'rxjs/operators';
import { ReadService } from '../../services/read.service';
import { zip } from 'rxjs';

@Component({
  selector: 'km-sentences-results',
  templateUrl: 'book-results.component.html',
  styleUrls: ['book-results.component.css', 'book-bullets.component.css']
})

export class BookResultsComponent implements OnChanges, OnDestroy {
  @Input() data: SessionData;
  @Input() text: Object;
  private componentActive = true;
  percYes = 0;
  percMaybe = 0;
  percNo = 0;
  total = 0;
  showDetails = false;
  points = 0;
  isFinished = false;
  newTrophies: string[] = [];

  constructor(
    private readService: ReadService
  ) {}

  ngOnChanges() {
    this.calculateResults();
  }

  onShowDetails(show: boolean) {
    this.showDetails = show;
  }

  private calculateResults() {
    this.newTrophies = [];
    this.isFinished = this.data.resultData.isFinished;
    this.checkSessionTrophies(this.data);
    this.total = this.data.nrYes + this.data.nrMaybe + this.data.nrNo;
    if (this.total > 0) {
      this.percYes = Math.round(this.data.nrYes / this.total * 1000) / 10;
      this.percMaybe = Math.round(this.data.nrMaybe / this.total * 1000) / 10;
      this.percNo = Math.round(this.data.nrNo / this.total * 1000) / 10;
    }
    this.points = this.data.points.finished + this.data.points.translations + this.data.points.words;
  }

  private checkSessionTrophies(data: SessionData) {
    // First check if trophies were earned in this session
    const resultData = data.resultData,
          readInSession = data.answers.length,
          translations = data.translations,
          trophies: string[] = [];
    // # of sentences read in whole book
    if (resultData.isFinished) {
      trophies.push('01');
      if (resultData.totalBookSentences >= 100) {
        trophies.push('02');
      }
      if (resultData.totalBookSentences >= 1000) {
        trophies.push('03');
      }
    }
    // # of sentences read in this session
    if (readInSession >= 10) {
      trophies.push('11');
    }
    if (readInSession >= 50) {
      trophies.push('12');
    }
    if (readInSession >= 200) {
      trophies.push('13');
    }
    // # of translations in this session
    if (translations >= 5) {
      trophies.push('21');
    }
    if (translations >= 25) {
      trophies.push('22');
    }
    if (translations >= 50) {
      trophies.push('23');
    }
    if (trophies.length) {
      // If there are any, check which trophies were earned before
      this.getTrophies(trophies);
    }
  }

  private getTrophies(trophiesThisSession: string[]) {
    this.readService
    .fetchSessionTrophies()
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (existingTrophies: Trophy[]) => {
        this.getOverallTrophies(existingTrophies, trophiesThisSession);
      }
    );
  }

  private getOverallTrophies(existingTrophies: Trophy[], trophiesThisSession: string[]) {
    zip(
      this.readService.fetchOverallSessionTrophies(existingTrophies),
      this.readService.fetchOverallThumbTrophies(existingTrophies)
    )
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      (data) => {
        const newOverallSessionTrophies = data[0],
              newOverallThumbTrophies = data[1],
              newTrophies: string[] = newOverallSessionTrophies.concat(newOverallThumbTrophies);
        // The difference between existingTrophies and trophiesThisSession are new trophies
        let exists: Trophy;
        trophiesThisSession.forEach(trophy => {
          exists = existingTrophies.find(eTrophy => eTrophy.trophy === trophy);
          if (!exists) {
            newTrophies.push(trophy);
          }
        });
        // Save the new trophies and show them
        if (newTrophies.length) {
          this.saveTrophies(newTrophies);
        }
      }
    );
  }

  private saveTrophies(trophies: string[]) {
    this.readService
    .saveTrophies(trophies)
    .pipe(takeWhile(() => this.componentActive))
    .subscribe(
      result => {
        this.newTrophies = trophies;
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
