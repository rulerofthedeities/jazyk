import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Sentence, Chapter } from '../../models/book.model';
import { Subject } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-book-context',
  templateUrl: 'book-context.component.html',
  styleUrls: ['book-content.component.css']
})

export class BookContextComponent implements OnInit, OnDestroy {
  @Input() private chapter: Subject<Chapter>;
  @Input() private sentenceNr: Subject<number>;
  private componentActive = true;
  private sentences: Sentence[];
  currentSentences: Sentence[] = [];
  level = 1;
  nr = 1;
  title: string;
  minimized = false;

  ngOnInit() {
    this.sentenceNr
    .pipe(takeWhile( () => this.componentActive))
    .subscribe(nr => {
      this.nr = nr;
      this.updateCurrentSentences();
    });
    this.chapter
    .pipe(takeWhile( () => this.componentActive))
    .subscribe(chapter => {
      this.sentences = chapter.sentences;
      this.level = chapter.level;
      this.title = chapter.title.trim();
      this.updateCurrentSentences();
    });
  }

  onMinimize(minimize: boolean) {
    this.minimized = minimize;
  }

  private updateCurrentSentences() {
    const maxNrOfLines = 5,
          start = this.nr > maxNrOfLines ? this.nr - maxNrOfLines - 1 : 0,
          len = this.nr > maxNrOfLines ? maxNrOfLines : this.nr - 1;
    this.currentSentences = this.sentences ? this.sentences.slice(start, start + len) : [];
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
