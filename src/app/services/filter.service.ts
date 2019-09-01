import { Injectable } from '@angular/core';
import { Map, Option } from '../models/main.model';
import { ViewFilter } from '../models/book.model';

@Injectable()
export class FilterService {
  sort: Map<string> = {};
  filter: Map<ViewFilter> = {};
  filterTxt: Map<string> = {};
  hasFilter: Map<boolean> = {};

  initFilter(bookType: string) {
    if (!this.filter[bookType]) {
      this.clearFilter(bookType);
    }
  }

  clearFilter(bookType: string) {
    this.filter[bookType] = {
      hideCompleted: false,
      hideNotTranslated: false,
      hideOld: false,
      hideEasy: false,
      hideMedium: false,
      hideAdvanced: false,
      bookId: null
    };
    this.filterTxt[bookType] = '';
    this.hasFilter[bookType] = false;
  }

  initSort(bookType: string) {
    if (!this.sort[bookType]) {
      this.sort[bookType] = 'difficulty1';
    }
  }

  setBookId(bookId: string, bookType: string) {
    // filter only a single story
    if (bookId.length === 24) {
      this.filter[bookType].bookId = bookId;
    }
  }

  getSortOptions(text: Object): Option[] {
    return [
    {
      label: text['difficulty1'],
      value: 'difficulty1'
    },
    {
      label: text['difficulty0'],
      value: 'difficulty0'
    },
    {
      label: text['sentences0'],
      value: 'sentences0'
    },
    {
      label: text['sentences1'],
      value: 'sentences1'
    },
    {
      label: text['newest0'],
      value: 'newest0'
    },
    {
      label: text['popular0'],
      value: 'popular0'
    }
  ];
}
}
