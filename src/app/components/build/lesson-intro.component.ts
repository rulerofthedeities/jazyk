import {Component, Input, OnInit, OnDestroy, ViewChild, AfterViewInit, ElementRef, HostListener} from '@angular/core';
import {BuildService} from '../../services/build.service';
import {ErrorService} from '../../services/error.service';
import {PreviewService} from '../../services/preview.service';
import {UtilsService} from '../../services/utils.service';
import {Intro, Map} from '../../models/course.model';
import 'rxjs/add/operator/takeWhile';

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
  hasHeader?: boolean;
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
  audioNr = 0;
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
    this.previewService.loadAudioButtonScript();
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
    this.audioNr = 0;
    const tags = ['span', 'div', 'audio', 'h1', 'h2', 'ul', 'li'];
    let html = this.previewService.removeTags(this.intro.text, tags);
    html = html.replace(/(?:\r\n|\r|\n)/g, '<br>'); // replace line breaks with <br>
    html = html.replace(/(?:->)/g, '→'); //replace -> with arrow
    html = this.parseFontStyles(html, 'b');
    html = this.parseFontStyles(html, 'i');
    html = this.parseSize(html, 'size');
    html = this.parseColor(html, 'color');
    html = this.parseTranslation(html, 'tl');
    html = this.parseHeaders(html, 'header');
    html = this.parseHeaders(html, 'subheader');
    html = this.parseHeaders(html, 'subsubheader');
    html = this.parseBorders(html, 'border');
    html = this.parseTab(html, 'tab');
    html = this.parseLists(html);
    html = this.parseAudio(html);
    html = this.parseTables(html);
    this.intro.html = html;
  }

  private parseFontStyles(text: string, tag: string): string {
    // format [i: text] (italic) or [b: text] (bold)
    const fontTags = this.getTags({
      text,
      tag,
      hasBracket: true
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
        newText: fontHtml,
        hasBracket: true});
    });
    return html;
  }

  private parseTranslation(text: string, tag: string): string {
    // format [tag: text] 
    const tlTags = this.getTags({
      text,
      tag,
      hasBracket: true
    });
    let tlText: string,
        tlHtml: string,
        html = text;
    tlTags.forEach(tlTag => {
      tlText = tlTag.trim() || '';
      tlHtml = this.getHtmlSnippet(tag, {content: tlText});
      html = this.replaceText({
        tag,
        html,
        oldText: tlTag,
        newText: tlHtml,
        hasBracket: true});
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

  private parseBorders(text: string, tag: string): string {
    // format [tag: text] 
    const borderTags = this.getTags({
      text,
      tag,
      hasClosingTag: true,
      hasBracket: true
    });
    let borderText: string,
        borderHtml: string,
        html = text;
    borderTags.forEach(borderTag => {
      borderText = borderTag.trim() || '';
      borderHtml = this.getHtmlSnippet(tag, {title: borderText});
      html = this.replaceText({
        tag,
        html,
        oldText: borderTag,
        newText: borderHtml,
        hasClosingTag: true,
        hasBracket: true});
    });
    return html;
  }

  private parseSize(text: string, tag: string): string {
    // format [size:2:text] (1, 2, 3 with 3 being the largest)
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

  private parseTab(text: string, tag: string): string {
    // format [tab:2 text] (1, 2, 3) - block
    // format [tab:2] text (1, 2, 3) - only first line
    const tabTags = this.getTags({
      text,
      tag,
      hasBracket: true
    });
    let tabText: string,
        tabHtml: string,
        html = text,
        tab: number;
    tabTags.forEach(tabTag => {
      if (tabTag) {//} && tabTag.length > 2 && tabTag[1] === ':') {
        tab = parseInt(tabTag[0], 10);
        tab = tab > 0 && tab < 4 ? tab : 1;
        tabText = tabTag.substr(2, tabTag.length - 2).trim() || '';
        tabHtml = this.getHtmlSnippet(tag, {content: tabText, value: tab});
        html = this.replaceText({
          tag,
          html,
          oldText: tabTag,
          newText: tabHtml,
          hasBracket: true});
      }
    });
    return html;
  }

  private parseColor(text: string, tag: string): string {
    // format [color:f text] (m, f, mi, ma, n)
    const colorTags = this.getTags({
      text,
      tag,
      hasBracket: true
    });
    let colorText: string,
        colorHtml: string,
        html = text,
        color: string,
        colorArr: string[];
    colorTags.forEach(colorTag => {
      if (colorTag && colorTag.length > 2) {
        colorArr = colorTag.split(/\:(.+)/);
        if (colorArr.length > 1) {
          color = colorArr[0].trim().toLowerCase();
          colorText = colorArr[1].trim() || '';
          colorHtml = this.getHtmlSnippet(tag, {content: colorText, format: color});
          html = this.replaceText({
            tag,
            html,
            oldText: colorTag,
            newText: colorHtml,
            hasBracket: true});
        }
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
      listHtml = '';
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
    const isEmptyRow = (row: string) => {
      let isEmpty = true;
      const tableCells = row.split('|');
      tableCells.forEach(cell => {
        if (cell.trim() !== '') {
          isEmpty = false;
        }
      });
      return isEmpty;
    }

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
        colOptions: ColumnOptions[],
        noHeader = false;
    tableTags.forEach(tableTag => {
      tableHtml = '';
      colOptions = [];
      tableRows = tableTag.split('<br>');
      if (tableRows.length && tableRows[0].trim() === '') {
        tableRows.shift(); // First row is empty, remove
      }
      if (tableRows.length && isEmptyRow(tableRows[0])) {
        noHeader = true;
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
            tableHtml = this.getHtmlSnippet('t-header', {table: {
              cells: headerCells,
              columns: colOptions,
              hasHeader: !noHeader
            }});
            headerCells = null;
          }
          tableHtml+= this.getHtmlSnippet('t-row', {table: {
            cells: tableCells,
            first: rowNr===1,
            last: rowNr===tableRows.length - 1,
            columns: colOptions
          }});
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
    while (result && cnt < 200) {
      if (result[0]) {
        data.push(result[0]);
      }
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
      case 'subsubheader': 
        return `<h3 class="i">${options.title}</h3>`;
      case 'border': 
        return `<span class="btn btn-default">${options.title}</span>`;
      case 'tl': 
        return `<span class="translation">${options.content}</span>`;
      case 'i': // Italic 
        return `<em>${options.content}</em>`;
      case 'b': // Italic 
        return `<strong>${options.content}</strong>`;
      case 'size': 
        return `<span class="i-size-${options.value}">${options.content}</span>`;
      case 'tab': 
      if (options.content) {
        return `<span class="i-tab-${options.value} block">${options.content}</span>`;
      } else {
        return `<span class="i-tab-${options.value}"></span>`;
      }
      case 'color':
        return `<span class="i-color-${options.format}">${options.content}</span>`;
      case 'list': 
        return `<li class="list-group-item">${options.content}</li>`;
      case 'ul':
        return `<ul class="list-group i-list">${options.content}</ul>`
      case 'audio':
        this.audioNr++;
        return `<audio id="audio${this.audioNr}">
                  <source src="${options.url}" type="audio/${options.format}">
                </audio>
                <span onclick="play(this, ${this.audioNr})" class="fa fa-play-circle"></span>
                `;
      case 't-header':
        if (options.table.hasHeader) {
          options.table.cells.forEach((cell, i) => {
            classes = this.getColumnClasses(options.table.columns[i]);
            html += `<th${classes}>${cell.trim()}</th>`;
          })
          return `<thead><tr>${html}</tr></thead>`;
        } else {
          return ''
        }
      case 't-row':
        options.table.cells.forEach((cell, i) => {
          classes = this.getColumnClasses(options.table.columns[i]);
          html += `<td${classes}>${cell.trim()}</td>`;
        })
        let row = `<tr>${html}</tr>`;
        return options.table.first ? `<tbody>${row}` :(options.table.last ? `${row}</tbody>`: row);
      case 'table':
        return `<table class="i-table">${options.content}</table>`;
      default :
        return '';
    }
  }

  private getColumnClasses(options: ColumnOptions): string {
    if (options) {
      const alignClass = options.align === Alignment.Left ? "left" : (options.align === Alignment.Right ? "right" : "center"),
            inverseClass = options.inverse ? "inverse" : null,
            classes = alignClass + ' ' + (inverseClass || '');
      return ` class="${classes.trim()}"`;
    } else {
      return '';
    }
  }

  private replaceText(options: ReplaceOptions): string {
    const firstTag = options.tag + ':',
          closedTag = `[${firstTag + options.oldText + options.tag}]`,
          noBracketTag = `${options.tag + options.oldText + options.tag}`,
          openTag = options.hasBracket ? `[${firstTag + options.oldText}]` : noBracketTag;
    return options.html.replace(options.hasClosingTag ? closedTag : openTag, options.newText);
  }

  private closeDropdowns(keepOpen: string) {
    const dropdowns: Array<string> = ['arrange', 'header', 'size', 'other'];
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
    this.templates['subsubheader'] = `[subsubheader: My sub-subheader]`;
    this.templates['size1'] = `[size:1: large text]`;
    this.templates['size2'] = `[size:2: larger text]`;
    this.templates['size3'] = `[size:3: largest text]`;
    this.templates['tabfirstline'] = `[tab:2] Only the first line is indented (1, 2 or 3)`;
    this.templates['tabblock'] = `[tab:2 The enclosed text is indented (1, 2 or 3)]`;
    this.templates['color'] = `[color:f: color options are f, m, mi, ma, n]`;
    this.templates['italic'] = `[i:this text is italic]`;
    this.templates['bold'] = `[b:this text is bold]`;
    this.templates['border'] = `[border: this text has a border!]`;
    this.templates['audio'] = `[audio: https://s3.eu-central-1.amazonaws.com/jazyk/audio/cs/5ac50892b12e080e30c28b7f]`;
    this.templates['list'] = `[list: item1
    item2
    item3 list]`;
  }

  ngOnDestroy() {
    this.componentActive = false;
  }
}
