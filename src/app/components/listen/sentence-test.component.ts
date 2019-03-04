import { Component, Input, OnInit, OnChanges, Output, EventEmitter } from '@angular/core';
import { Sentence, Word, TestAnswer } from '../../models/book.model';
import { ReadnListenService, minWordScore, maxWordScore } from '../../services/readnlisten.service';
import { SharedService } from '../../services/shared.service';

@Component({
  selector: 'km-sentence-test',
  templateUrl: 'sentence-test.component.html',
  styleUrls: ['../readnlisten/sentence.component.css', 'sentence-test.component.css']
})

export class SentenceTestComponent implements OnInit, OnChanges {
  @Input() text: Object;
  @Input() sentence: Sentence;
  @Input() difficulty: number;
  @Output() answered = new EventEmitter<TestAnswer>();
  @Output() nextSentence = new EventEmitter<boolean>();
  sentenceSections: string[];
  word: Word;
  showSentence = false;
  isAnswered = false;
  skip = false;
  answerletter: string;
  answer: string;

  constructor(
    private readnListenService: ReadnListenService,
    private sharedService: SharedService
  ) {}

  ngOnInit() {
    this.observe();
  }

  ngOnChanges() {
    this.showSentence = false;
    this.isAnswered = false;
    this.answer = '';
    const words = this.sentence.words.filter(w => !w.unselectable);
    if (words && words.length) {
      this.skip = false;
      this.selectWord(words);
      this.splitSentence();
    } else {
      this.skip = true;
    }
  }

  onKeyPressed(key: string) {
    switch (key) {
      case 'Enter':
        if (this.showSentence) {
          if (this.skip) {
            this.nextSentence.next(true);
          } else {
            if (!this.isAnswered) {
              this.checkWord();
            }
          }
        }
      break;
      case ' ':
        this.sharedService.pauseAudio();
      break;
    }
  }

  onCheckWord() {
    this.checkWord();
  }

  private selectWord(allWords: Word[]) {
    let words: Word[];
    this.word = null;
    let nr;
    // select the word the user has to enter
    // skip rarest and most common words
    let minScore = minWordScore;
    let maxScore = maxWordScore;
    const minIncrease = this.difficulty < 400 ? 150 : (this.difficulty < 500 ? 100 : 0);
    minScore += minIncrease;
    words = allWords.filter(w => w.score > minScore && w.score < maxScore);
    if (words) {
      // if words are found, select a random word
      if (words.length > 0) {
        nr = Math.floor((Math.random() * words.length));
        this.word = words[nr];
      } else {
        // if no words are found, include rarer and more common words
        minScore -= minIncrease;
        maxScore += 50;
        words = words.filter(w => w.score > minScore && w.score < maxScore);
        if (words.length > 0) {
          nr = Math.floor((Math.random() * words.length));
          this.word = words[nr];
        }
      }
      // Nothing found, select a random word without any filter
      if (!this.word && words.length) {
        nr = Math.floor((Math.random() * words.length));
        this.word = words[nr];
      }
    }
    // Nothing found, select a random word without any filter from all the words
    if (!this.word) {
      nr = Math.floor((Math.random() * allWords.length));
      this.word = allWords[nr];
    }
  }

  private checkWord() {
    const answer = this.answer.trim().toLowerCase(),
          word = this.word.word.replace('’', '\'').trim().toLowerCase();
    this.answerletter = answer === word ? 'y' : 'n';
    if (this.answerletter === 'n' && this.isAlmostCorrect(answer, word)) {
      this.answerletter = 'm';
    }
    this.isAnswered = true;
    this.answered.emit({
      word,
      score: this.word.score,
      answerLetter: this.answerletter
    });
  }

  private toNextSentence() {
    this.isAnswered = true;
    this.answered.emit({
      word: '',
      score: 0,
      answerLetter: 'x' // No test words available for this sentence
    });
  }

  private isAlmostCorrect(answer: string, solution: string): boolean {
    let isCorrect = false;
    if (solution) {
      const DL = this.readnListenService.getDamerauLevenshteinDistance(answer, solution);
      const errPerc = DL / solution.length * 100;
      isCorrect = errPerc > 20 ? false : true;
    }
    return isCorrect;
  }

  private splitSentence() {
    this.sentenceSections = [null, null];
    const word = this.word.word,
          pos = this.word.pos,
          txt = this.sentence.text;
    this.sentenceSections[0] = txt.substr(0, pos).trim();
    if (pos + word.length < txt.length) {
      this.sentenceSections[1] = txt.substring(pos + word.length, txt.length).trim();
    }
  }

  private observe() {
    this.readnListenService
    .audioEnded
    .subscribe(
      hasEnded => {
        if (hasEnded) {
          this.showSentence = true;
          if (this.skip) {
            this.toNextSentence();
          }
        }
      }
    );
  }
}
