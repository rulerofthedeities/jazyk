import {Component, Input, OnInit, OnDestroy, ViewChild, AfterViewInit, ElementRef, HostListener} from '@angular/core';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {PreviewService} from '../../services/preview.service';
import {UtilsService} from '../../services/utils.service';
import {Intro} from '../../models/course.model';
import 'rxjs/add/operator/takeWhile';

interface Map<T> {
    [K: string]: T;
}

enum Alignment {Left, Center, Right}

interface ColumnOptions {
  align: Alignment;
  inverse: boolean;
}

interface TableOptions {
  cells: string[];
  first?: boolean;
  last?: boolean;
  alignment?: string[];
  columns?: ColumnOptions[];
}

interface SnippetOptions {
  title?: string;
  format?: string;
  url?: string;
  content?: string;
  value?: number;
  table?: TableOptions;
}

interface ReplaceOptions {
  tag: string;
  html: string;
  oldText: string;
  newText: string;
  hasClosingTag?: boolean;
  hasBracket?: boolean;
}

interface TagOptions {
  text: string;
  tag: string;
  hasClosingTag?: boolean;
  hasBracket?: boolean;
}

@Component({
  selector: 'km-build-lesson-intro',
  templateUrl: 'lesson-intro.component.html',
  styleUrls: ['lesson-intro.component.css']
})

export class BuildLessonIntroComponent implements OnInit, OnDestroy {
  @Input() lessonId: string;
  @Input() text: Object;
  private componentActive = true;
  private templates: Map<string> = {};
  dropdowns: Map<boolean> = {};
  modified = false;
  saved = false;
  intro: Intro;
  introDefault: Intro;
  @ViewChild('introField') introField;
  @ViewChild('introField2') introField2;
  @ViewChild('dropdown') el: ElementRef;
  @HostListener('document:click', ['$event'])
  clickout(event) {
    if (this.el && !this.el.nativeElement.contains(event.target)) {
      // Outside dropdown, close dropdown
      this.closeDropdowns(null);
    }
  }

  constructor(
    private buildService: BuildService,
    private errorService: ErrorService,
    private previewService: PreviewService,
    private utilsService: UtilsService
  ) {}

  ngOnInit() {
    this.introDefault = {
      text: '',
      html: ''
    }
    this.intro = this.introDefault;
    this.loadIntro();
    this.createTemplates();
    this.parseText();
  }

  ngAfterViewInit() {
    this.introField.valueChanges
    .debounceTime(400)
    .subscribe(data => {
      this.parseText();
    });
  }

  onSaveIntro() {
    if (this.modified) {
      this.saveIntro();
    }
  }

  onChangedIntro() {
    console.log('changed');
    this.modified = true;
    this.saved = false;
  }

  onToggleButton(tpe: string) {
    this.closeDropdowns(tpe);
    this.dropdowns[tpe] = !this.dropdowns[tpe];
  }

  onInsertTemplate(introField: any, tpe: string, dropdown: string = 'none') {
    const toInsert = this.templates[tpe];
    this.utilsService.insertKey(this.introField2.nativeElement, toInsert);
    this.intro.text = this.introField2.nativeElement.value;
    this.closeDropdowns(null);
    this.modified = true;
  }

  private loadIntro() {
    this.buildService
    .fetchIntro(this.lessonId)
    .takeWhile(() => this.componentActive)
    .subscribe(
      intro => this.intro = intro ? intro : this.introDefault,
      error => this.errorService.handleError(error)
    );
  }

  private saveIntro() {
    this.parseText();
    this.buildService
    .updateIntro(this.lessonId, this.intro)
    .takeWhile(() => this.componentActive)
    .subscribe(
      intro => {
        this.modified = false,
        this.saved = true},
      error => this.errorService.handleError(error)
    );
  }

  private parseText() {
    const tags = ['span', 'div', 'audio', 'h1', 'h2', 'ul', 'li'];
    let html = this.previewService.removeTags(this.intro.text, tags);
    html = html.replace(/(?:\r\n|\r|\n)/g, '<br>'); // replace line breaks with <br>
    html = this.parseFontStyles(html, '**');
    html = this.parseFontStyles(html, '*');
    html = this.parseSize(html, 'size');
    html = this.parseHeaders(html, 'header');
    html = this.parseHeaders(html, 'subheader');
    html = this.parseLists(html);
    html = this.parseAudio(html);
    html = this.parseTables(html);
    this.intro.html = html;
  }

  private parseFontStyles(text: string, tag: string): string {
    // format *text* (italic) or **text** (bold)
    const fontTags = this.getTags({
      text,
      tag: tag === '*' ? '\\*' : '\\*\\*',
      hasClosingTag: true
    });
    let fontText: string,
        fontHtml: string,
        html = text;
    fontTags.forEach(fontTag => {
      fontText = fontTag.trim() || '';
      fontHtml = this.getHtmlSnippet(tag, {content: fontText});
      html = this.replaceText({
        tag,
        html,
        oldText: fontTag,
        newText: fontHtml});
    });
    return html;
  }

  private parseHeaders(text: string, tag: string): string {
    // format [tag: title] 
    const headerTags = this.getTags({
      text,
      tag,
      hasBracket: true
    });
    let headerTitle: string,
        headerHtml: string,
        html = text;
    headerTags.forEach(headerTag => {
      headerTitle = headerTag.trim() || '';
      headerHtml = this.getHtmlSnippet(tag, {title: headerTitle});
      html = this.replaceText({
        tag,
        html,
        oldText: headerTag,
        newText: headerHtml,
        hasBracket: true});
    });
    return html;
  }

  private parseSize(text: string, tag: string): string {
    // format [size:2 text] (1, 2, 3 with 3 being the largest)
    const sizeTags = this.getTags({
      text,
      tag,
      hasBracket: true
    });
    let sizeText: string,
        sizeHtml: string,
        html = text,
        size: number;
    sizeTags.forEach(sizeTag => {
      if (sizeTag && sizeTag.length > 2 && sizeTag[1] === ':') {
        size = parseInt(sizeTag[0], 10);
        size = size > 0 && size < 4 ? size : 1;
        sizeText = sizeTag.substr(2, sizeTag.length - 2).trim() || '';
        sizeHtml = this.getHtmlSnippet(tag, {content: sizeText, value: size});
        html = this.replaceText({
          tag,
          html,
          oldText: sizeTag,
          newText: sizeHtml,
          hasBracket: true});
      }
    });
    return html;
  }

  private parseLists(text: string): string {
    // format [list: item1\nitem2 list] 
    const tag = 'list',
          listTags = this.getTags({
      text,
      tag,
      hasClosingTag: true,
      hasBracket: true
    });
    let listItems: string[],
        listHtml = '',
        html = text;
    listTags.forEach(listTag => {
      listItems = listTag.split('<br>');
      listItems = listItems.map(data => data.trim());
      listItems.forEach(item => {
        listHtml+= this.getHtmlSnippet(tag, {content: item});
      })
      listHtml = this.getHtmlSnippet('ul', {content: listHtml});
      html = this.replaceText({
        tag,
        html,
        oldText: listTag,
        newText: listHtml,
        hasClosingTag: true,
        hasBracket: true});
    });
    return html;
  }

  private parseTables(text: string): string {
    /* format [table: 
    | Col1     |      Col2     |  Col3 |
    |<         |               |>      |
    | col 1 is | left-aligned  | €1000 |
    | col 2 is |   centered    |   €90 |
    | col 3 is | right-aligned |    €5 | table] */
    const tag = 'table',
          tableTags = this.getTags({
            text,
            tag,
            hasClosingTag: true,
            hasBracket: true
          });
    let tableRows: string[],
        tableCells: string[],
        headerCells: string[],
        tableHtml: string,
        html = text,
        colOptions: ColumnOptions[];
    tableTags.forEach(tableTag => {
      colOptions = [];
      tableRows = tableTag.split('<br>');
      if (tableRows.length && tableRows[0].trim() === '') {
        tableRows.shift(); // First row is empty, remove
      }
      tableRows.forEach((tableRow, rowNr) => {
        tableRow = tableRow.trim();
        tableCells = tableRow.split('|');
        if (tableCells.length > 2) {
          tableCells.pop();
          tableCells.shift();
        }
        if (rowNr===0) {
          headerCells = tableCells;
        } else if (rowNr===1) {
          // column options
          tableCells.forEach((cell, colNr) => {
            colOptions[colNr] = {
              align: cell.indexOf('<') > -1 ? Alignment.Left : (cell.indexOf('>') > -1 ? Alignment.Right : Alignment.Center),
              inverse: cell.indexOf('i') > -1 ? true : false
            }
          })
        } else {
          if (headerCells) {
            tableHtml = this.getHtmlSnippet('t-header', {table: {cells: headerCells, columns: colOptions}});
            headerCells = null;
          }
          tableHtml+= this.getHtmlSnippet('t-row', {table: {
            cells: tableCells,
            first: rowNr===1,
            last: rowNr===tableRows.length - 1,
            columns: colOptions}});
        }
      })
      tableHtml = this.getHtmlSnippet(tag, {content: tableHtml});
      html = this.replaceText({
        tag,
        html, oldText: tableTag,
        newText: tableHtml,
        hasClosingTag: true,
        hasBracket: true});
    });
    return html;
  }

  private parseAudio(text: string): string {
    // format [audio: url, (format, default='ogg')]
    const tag = 'audio',
          audioTags = this.getTags({
            text,
            tag,
            hasBracket: true
          }),
          validFormats = ['ogg', 'mp3', 'mp4'];
    let audioData: Array<string>,
        audioFormat: string,
        audioUrl: string,
        audioHtml: string,
        regex: RegExp,
        html = text;
    audioTags.forEach(audioTag => {
      audioData = audioTag.split(',');
      audioData = audioData.map(data => data.trim());
      audioUrl = audioData[0];
      audioFormat = audioData[1] && validFormats.find(format => format === audioData[1]) ? audioData[1] : 'ogg';
      audioHtml = this.getHtmlSnippet('audio', {url: audioUrl, format: audioFormat});
      html = this.replaceText({tag, html, oldText: audioTag, newText: audioHtml, hasBracket: true});
    });
    return html;
  }

  private getTags(options: TagOptions) {
    const regexBrackets = new RegExp(options.hasClosingTag ? `(?<=\\[${options.tag}:).*?(?=${options.tag}\\])` : `(?<=\\[${options.tag}:).*?(?=\\])`, 'igs'),
          regexNoBrackets = new RegExp(`(?<=${options.tag}).*?(?=${options.tag})`, 'gs'),
          regex = options.hasBracket ? regexBrackets : regexNoBrackets;
    let result: RegExpExecArray,
        data: Array<string> = [],
        cnt = 0;
    result = regex.exec(options.text);
    while (result && cnt < 100) {
      data.push(result[0]);
      result = regex.exec(options.text);
      cnt++;
    }
    return data;
  }

  private getHtmlSnippet(tpe: string, options: SnippetOptions) {
    let html = '',
        classes = '';
    switch (tpe) {
      case 'header': 
        return `<h1 class="i">${options.title}</h1>`;
      case 'subheader': 
        return `<h2 class="i">${options.title}</h2>`;
      case '*': // Italic 
        return `<em>${options.content}</em>`;
      case '**': // Italic 
        return `<strong>${options.content}</strong>`;
      case 'size': 
        return `<span class="i-size-${options.value}">${options.content}</span>`;
      case 'list': 
        return `<li class="list-group-item">${options.content}</li>`;
      case 'ul':
        return `<ul class="list-group i-list">${options.content}</ul>`
      case 'audio':
        return `<audio controls>
                  <source src="${options.url}" type="audio/${options.format}">
                </audio>`;
      case 't-header':
        options.table.cells.forEach((cell, i) => {
          classes = this.getColumnClasses(options.table.columns[i]);
          html += `<th${classes}>${cell.trim()}</th>`;
        })
        return `<thead><tr>${html}</tr></thead>`;
      case 't-row':
        options.table.cells.forEach((cell, i) => {
          classes = this.getColumnClasses(options.table.columns[i]);
          html += `<td${classes}>${cell.trim()}</td>`;
        })
        let row = `<tr>${html}</tr>`;
        return options.table.first ? `<tbody>${row}` :(options.table.last ? `${row}</tbody>`: row);
      case 'table':
        return `<table class="i-table">${options.content}</table>`;
    }
  }

  private getColumnClasses(options: ColumnOptions): string {
    const alignClass = options.align === Alignment.Left ? "left" : (options.align === Alignment.Right ? "right" : "center"),
          inverseClass = options.inverse ? "inverse" : null,
          classes = alignClass + ' ' + (inverseClass || '');
    return ` class="${classes.trim()}"`;
  }

  private replaceText(options: ReplaceOptions): string {
    const firstTag = options.tag + ':',
          closedTag = `[${firstTag + options.oldText + options.tag}]`,
          noBracketTag = `${options.tag + options.oldText + options.tag}`,
          openTag = options.hasBracket ? `[${firstTag + options.oldText}]` : noBracketTag;
          if (!options.hasBracket) {
    console.log('replace>', options.hasClosingTag ? closedTag : openTag);
          }
    return options.html.replace(options.hasClosingTag ? closedTag : openTag, options.newText);
  }

  private closeDropdowns(keepOpen: string) {
    const dropdowns: Array<string> = ['header', 'size', 'other'];
    dropdowns.forEach(dropdown => {
      if (dropdown !== keepOpen) {
        this.dropdowns[dropdown] = false;
      }
    });
  }

  private createTemplates() {
    this.templates['table'] = `
    [table:
    | Col1     |      Col2     |  Col3 |
    |<i        |               |      >|
    | col 1 is |  left-aligned | €1000 |
    | col 2 is |    centered   |   €90 |
    | col 3 is | right-aligned |    €5 |table]`;
    this.templates['header'] = `[header: My header]`;
    this.templates['subheader'] = `[subheader: My subheader]`;
    this.templates['size1'] = `[size:1: large text]`;
    this.templates['size2'] = `[size:2: larger text]`;
    this.templates['size3'] = `[size:3: largest text]`;
    this.templates['italic'] = `*this text is italic*`;
    this.templates['bold'] = `**this text is bold**`;
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
