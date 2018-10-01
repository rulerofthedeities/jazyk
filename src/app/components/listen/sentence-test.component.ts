import { Component, Input, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Sentence, Word } from '../../models/book.model';
import { ReadnListenService } from '../../services/readnlisten.service';

@Component({
  selector: 'km-sentence-test',
  templateUrl: 'sentence-test.component.html',
  styleUrls: ['../readnlisten/sentence.component.css', 'sentence-test.component.css']
})

export class SentenceTestComponent implements OnInit {
  @Input() text: Object;
  @Input() sentence: Sentence;
  @ViewChild('answer') answer: ElementRef;
  sentenceSections: string[];
  word: Word;
  showSentence = false;
  isAnswered = false;
  isCorrect = false;

  constructor(
    private readnListenService: ReadnListenService
  ) {}

  ngOnInit() {
    this.observe();
    this.selectWord();
    this.splitSentence();
  }
  onKeyPressed(key: string) {
    switch (key) {
      case 'Enter':
        if (!this.isAnswered) {
          this.checkWord();
        }
      break;
    }
  }

  onCheckWord() {
    this.checkWord();
  }

  private selectWord() {
    this.word = null;
    // select the word the user has to enter
    let words = this.sentence.words;
    if (words.length > 1) {
      // skip rarest and most common words
      words = words.filter(w => w.score > 150 && w.score < 900);
      if (words.length > 0) {
        const nr = Math.floor((Math.random() * words.length));
        this.word = words[nr];
      }
    }
    if (!this.word && words.length) {
      this.word = words[0];
    }
  }

  private checkWord() {
    const answer = this.answer.nativeElement.value.trim().toLowerCase();
    const word = this.word.word.toLowerCase();
    console.log('answer', answer, word);
    this.isCorrect = answer === word;
    this.isAnswered = true;
  }

  private splitSentence() {
    this.sentenceSections = [null, null];
    const pos = this.sentence.text.indexOf(this.word.word);
    if (pos > -1) {
      this.sentenceSections[0] = this.sentence.text.substr(0, pos).trim();
      if (pos + this.word.word.length < this.sentence.text.length) {
        this.sentenceSections[1] = this.sentence.text.substring(pos + this.word.word.length, this.sentence.text.length).trim();
      }
    }
    console.log('pos', pos, this.sentenceSections);
  }

  private observe() {
    this.readnListenService
    .audioEnded
    .subscribe(
      hasEnded => {
        if (hasEnded) {
          this.showSentence = true;
        }
      }
    );
  }
}
