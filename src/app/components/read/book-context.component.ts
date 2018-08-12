import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Sentence } from '../../models/book.model';
import { Subject } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

@Component({
  selector: 'km-book-context',
  templateUrl: 'book-context.component.html'
})

export class BookContextComponent implements OnInit, OnDestroy {
  @Input() sentences: Sentence[];
  @Input() private sentenceNr: Subject<number>;
  private componentActive = true;
  nr = 1;

  ngOnInit() {
    this.sentenceNr
    .pipe(takeWhile( () => this.componentActive))
    .subscribe(nr => {
      this.nr = nr;
    });
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
