import {Component, Input, Output, OnInit, EventEmitter} from '@angular/core';

@Component({
  selector: 'km-keyboard',
  template: `
    <div *ngFor="let row of rows; let i=index">
      <span 
        class="unselectable"
        [ngClass]="{key:i===0, skip:i!==0, selected: isUpperCase && i===0}"
        (click)="i===0 ? onToggleCase() : ''">
        <span 
          *ngIf="i===0"
          class="fa fa-long-arrow-up">
        </span>
      </span>
      <span 
        *ngFor="let key of row"
        class="key unselectable"
        (click)="onClick(key)">
        {{key}}
      </span>
    </div>
  `,
  styles: [`
    :host {
      margin: 6px 0 0 40px; 
      display: block;
    }
    .key {
      font-size: 20px;
      border: 1px solid #666;
      border-radius: 4px;
      padding-bottom: 4px;
      margin: 1px 3px;
      text-align: center;
      display: inline-block;
      width: 36px;
      height: 28px;
      cursor: pointer;
      background-color: white;
      box-shadow: 3px 2px #ccc;
    }
    .key:hover {
      background-color: #eee;
    }
    .selected {
      background-color: #666;
      color: white;
    }
    .skip {
      display: inline-block;
      width: 42px;
      height: 28px;
    }
  `]
})

export class LearnKeyboardComponent implements OnInit {
  @Input() keys: string[];
  @Output() selectedKey = new EventEmitter<string>();
  rows: string[][] = [];
  isUpperCase = false;

  ngOnInit() {
    this.setKeys();
  }

  onClick(key: string) {
    this.selectedKey.emit(key);
  }

  onToggleCase() {
    this.isUpperCase = !this.isUpperCase;
    this.setKeys();
  }

  private setKeys() {
    this.keys.forEach((keyList, i) => {
      if (this.isUpperCase) {
        keyList = keyList.toUpperCase();
      }
      this.rows[i] = keyList.split('');
    });
  }
}
