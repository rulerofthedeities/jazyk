import {Component, Input, OnInit, OnDestroy, ViewChild, AfterViewInit} from '@angular/core';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {PreviewService} from '../../services/preview.service';
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
  hasClosingTag: boolean;
}

@Component({
  selector: 'km-build-lesson-intro',
  templateUrl: 'lesson-intro.component.html',
  styleUrls: ['lesson-intro.component.css']
})

export class BuildLessonIntroComponent implements OnInit, OnDestroy {
  @Input() lessonId: string;
  @Input() text: Object;
  @ViewChild('introField') input;
  private componentActive = true;
  private templates: Map<string> = {};
  dropdowns: Map<boolean> = {};
  modified = false;
  saved = false;
  intro: Intro;
  introDefault: Intro;

  constructor(
    private buildService: BuildService,
    private errorService: ErrorService,
    private previewService: PreviewService
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
    this.input.valueChanges
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
    this.modified = true;
    this.saved = false;
  }

  onToggleButton(tpe: string) {
    this.closeDropdowns(tpe);
    this.dropdowns[tpe] = !this.dropdowns[tpe];
  }

  onInsertTemplate(introField: any, tpe: string, dropdown: string = 'none') {
    const toInsert = '\n' + this.templates[tpe] + '\n';
    const pos: number = introField.selectionStart;
    let right = '';
    if (pos !== undefined) {
       const left = this.intro.text.slice(0, pos);
       if (pos < this.intro.text.length) {
         right = this.intro.text.slice(pos - this.intro.text.length);
       }
       this.intro.text = left + toInsert + right;
    } else {
      this.intro.text += toInsert;
    }
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
    html = this.parseSize(html, 'size');
    html = this.parseHeaders(html, 'header');
    html = this.parseHeaders(html, 'subheader');
    html = this.parseLists(html);
    html = this.parseAudio(html);
    html = this.parseTables(html);
    this.intro.html = html;
  }

  private parseHeaders(text: string, tag: string): string {
    // format [tag: title] 
    const headerTags = this.getTags(text, tag, false);
    let headerTitle: string,
        headerHtml: string,
        html = text;
    headerTags.forEach(headerTag => {
      headerTitle = headerTag.trim() || '';
      headerHtml = this.getHtmlSnippet(tag, {title: headerTitle});
      html = this.replaceText({tag, html, oldText: headerTag, newText: headerHtml, hasClosingTag: false});
    });
    return html;
  }

  private parseSize(text: string, tag: string): string {
    // format [size:2 text] (1, 2, 3 with 3 being the largest)
    const sizeTags = this.getTags(text, tag, false);
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
        html = this.replaceText({tag, html, oldText: sizeTag, newText: sizeHtml, hasClosingTag: false});
      }
    });
    return html;
  }

  private parseLists(text: string): string {
    // format [list: item1\nitem2 list] 
    const tag = 'list',
          listTags = this.getTags(text, tag, true);
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
      html = this.replaceText({tag, html, oldText: listTag, newText: listHtml, hasClosingTag: true});
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
          tableTags = this.getTags(text, tag, true);
    let tableRows: string[],
        tableCells: string[],
        headerCells: string[],
        tableHtml: string,
        html = text,
        colOptions: ColumnOptions[];
    tableTags.forEach(tableTag => {
      colOptions = [];
      tableRows = tableTag.split('<br>');
      console.log('tableRows', tableRows);
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
        console.log('tablecells', tableCells, rowNr);
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
          console.log('row', tableHtml);
      })
      tableHtml = this.getHtmlSnippet(tag, {content: tableHtml});
      html = this.replaceText({tag, html, oldText: tableTag, newText: tableHtml, hasClosingTag: true});
    });
    return html;
  }

  private parseAudio(text: string): string {
    // format [audio: url, (format, default='ogg')]
    const tag = 'audio',
          audioTags = this.getTags(text, tag, false),
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
      html = this.replaceText({tag, html, oldText: audioTag, newText: audioHtml, hasClosingTag: false});
    });
    return html;
  }

  private getTags(text: string, tag: string, hasClosingTag: boolean) {
    const regex = new RegExp(hasClosingTag ? `(?<=\\[${tag}:).*?(?=${tag}\\])` : `(?<=\\[${tag}:).*?(?=\\])`, 'igs');
    let result: RegExpExecArray,
        data: Array<string> = [],
        cnt = 0;
    result = regex.exec(text);
    while (result && cnt < 100) {
      data.push(result[0]);
      result = regex.exec(text);
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
          console.log('options', i, options.table.columns[i]);
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
          openTag = `[${firstTag + options.oldText}]`;
    return options.html.replace(options.hasClosingTag ? closedTag : openTag, options.newText);
  }

  private closeDropdowns(keepOpen: string) {
    const dropdowns: Array<string> = ['list', 'header', 'other'];
    dropdowns.forEach(dropdown => {
      if (dropdown !== keepOpen) {
        this.dropdowns[dropdown] = false;
      }
    });
  }

  private createTemplates() {
    this.templates['table'] = `| Col1     |      Col2     |  Col3 |
|----------|:-------------:|------:|
| col 1 is |  left-aligned | €1000 |
| col 2 is |    centered   |   €90 |
| col 3 is | right-aligned |    €5 |`;
    this.templates['olist'] = `1. List item 1\n2. List item 2\n3. List item 3`;
    this.templates['ulist'] = `* List item 1\n* List item 2\n* List item 3`;
    this.templates['header1'] = `# title`;
    this.templates['header2'] = `## title`;
    this.templates['header3'] = `### title`;
    this.templates['quote'] = `> This is a blockquote.`;
    this.templates['bold'] = `**this text is bold**`;
    this.templates['rule'] = `---`;
    this.templates['space'] = `<br>`;
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
