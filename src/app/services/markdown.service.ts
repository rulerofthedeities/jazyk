import {Map} from '../models/course.model';
import {Alignment, TagOptions, SnippetOptions, ReplaceOptions,
        ColumnOptions} from '../models/markdown.model';
import {awsPath} from '../services/shared.service';

export class MarkdownService {

  parseFontStyles(text: string, tag: string): string {
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

  parseSize(text: string, tag: string): string {
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

  parseColor(text: string, tag: string): string {
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

  parseTranslation(text: string, tag: string): string {
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

  parseHeaders(text: string, tag: string): string {
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

  parseBorders(text: string, tag: string): string {
    // format [border: text]
    const borderTags = this.getTags({
      text,
      tag,
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
        hasBracket: true});
    });
    return html;
  }

  parseTab(text: string, tag: string): string {
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
      if (tabTag) {
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

  parseAudio(text: string): string {
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
        html = text;
    audioTags.forEach((audioTag, i) => {
      audioData = audioTag.split(',');
      audioData = audioData.map(data => data.trim());
      audioUrl = audioData[0];
      audioUrl = audioUrl.substr(0, 1) === '/' ? audioUrl.substr(1) : audioUrl; // remove starting /
      audioUrl = audioUrl.substr(0, 4) === 'http' ? audioUrl : 'https://' + awsPath + 'audio/' + audioUrl;  // add path if not included
      audioFormat = audioData[1] && validFormats.find(format => format === audioData[1]) ? audioData[1] : 'ogg';
      audioHtml = this.getHtmlSnippet('audio', {url: audioUrl, format: audioFormat, audioNr: i});
      html = this.replaceText({tag, html, oldText: audioTag, newText: audioHtml, hasBracket: true});
    });
    return html;
  }

  parseLists(text: string): string {
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
        listHtml += this.getHtmlSnippet(tag, {content: item});
      });
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

  parseTables(text: string): string {
    /* format [table:
    | Col1     |      Col2     |  Col3 |
    |<         |               |>      |
    | col 1 is | left-aligned  | €1000 |
    | col 2 is |   centered    |   €90 |
    | col 3 is | right-aligned |    €5 | table] */
    const isEmptyRow = (row: string) => {
      let isEmpty = true;
      const cells = row.split('|');
      cells.forEach(cell => {
        if (cell.trim() !== '') {
          isEmpty = false;
        }
      });
      return isEmpty;
    };

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
        if (rowNr === 0) {
          headerCells = tableCells;
        } else if (rowNr === 1) {
          // column options
          tableCells.forEach((cell, colNr) => {
            colOptions[colNr] = {
              align: cell.indexOf('<') > -1 ? Alignment.Left : (cell.indexOf('>') > -1 ? Alignment.Right : Alignment.Center),
              inverse: cell.indexOf('i') > -1 ? true : false
            };
          });
        } else {
          if (headerCells) {
            tableHtml = this.getHtmlSnippet('t-header', {table: {
              cells: headerCells,
              columns: colOptions,
              hasHeader: !noHeader
            }});
            headerCells = null;
          }
          tableHtml += this.getHtmlSnippet('t-row', {table: {
            cells: tableCells,
            first: rowNr === 1,
            last: rowNr === tableRows.length - 1,
            columns: colOptions
          }});
        }
      });
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

  getTemplates(): Map<string> {
    const templates: Map<string> = {};
    templates['table'] = `
      [table:
      | Col1     |      Col2     |  Col3 |
      |<i        |               |      >|
      | col 1 is |  left-aligned | €1000 |
      | col 2 is |    centered   |   €90 |
      | col 3 is | right-aligned |    €5 |table]`;
    templates['header'] = `[header: My header]`;
    templates['subheader'] = `[subheader: My subheader]`;
    templates['subsubheader'] = `[subsubheader: My sub-subheader]`;
    templates['size1'] = `[size:1: large text]`;
    templates['size2'] = `[size:2: larger text]`;
    templates['size3'] = `[size:3: largest text]`;
    templates['tabfirstline'] = `[tab:2] Only the first line is indented (1, 2 or 3)`;
    templates['tabblock'] = `[tab:2 The enclosed text is indented (1, 2 or 3)]`;
    templates['color'] = `[color:f: color options are f, m, mi, ma, n]`;
    templates['italic'] = `[i:this text is italic]`;
    templates['bold'] = `[b:this text is bold]`;
    templates['border'] = `[border: this text has a border!]`;
    templates['audio'] = `[audio: cs/5ac50892b12e080e30c28b7f]`;
    templates['list'] = `[list: item1
      item2
      item3 list]`;

    return templates;
  }

  private getTags(options: TagOptions) {
    const regexBrackets = new RegExp(
            options.hasClosingTag ?
            `(?<=\\[${options.tag}:).*?(?=${options.tag}\\])` :
            `(?<=\\[${options.tag}:).*?(?=\\])`, 'igs'
          ),
          regexNoBrackets = new RegExp(`(?<=${options.tag}).*?(?=${options.tag})`, 'gs'),
          regex = options.hasBracket ? regexBrackets : regexNoBrackets,
          data: Array<string> = [];
    let result: RegExpExecArray,
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

  getHtmlSnippet(tpe: string, options: SnippetOptions) {
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
        return `<span class="btn btn-outline-secondary">${options.title}</span>`;
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
        return `<ul class="list-group i-list">${options.content}</ul>`;
      case 'audio':
        return `<audio id="audio${options.audioNr}">
                  <source src="${options.url}" type="audio/${options.format}">
                </audio>
                <span onclick="play(this, ${options.audioNr})" class="fa fa-play-circle"></span>
                `;
      case 't-header':
        if (options.table.hasHeader) {
          options.table.cells.forEach((cell, i) => {
            classes = this.getColumnClasses(options.table.columns[i]);
            html += `<th${classes}>${cell.trim()}</th>`;
          });
          return `<thead><tr>${html}</tr></thead>`;
        } else {
          return '';
        }
      case 't-row':
        options.table.cells.forEach((cell, i) => {
          classes = this.getColumnClasses(options.table.columns[i]);
          html += `<td${classes}>${cell.trim()}</td>`;
        });
        const row = `<tr>${html}</tr>`;
        return options.table.first ? `<tbody>${row}` : (options.table.last ? `${row}</tbody>` : row);
      case 'table':
        return `<table class="i-table">${options.content}</table>`;
      default :
        return '';
    }
  }

  getColumnClasses(options: ColumnOptions): string {
    if (options) {
      const alignClass = options.align === Alignment.Left ? 'left' : (options.align === Alignment.Right ? 'right' : 'center'),
            inverseClass = options.inverse ? 'inverse' : null,
            classes = alignClass + ' ' + (inverseClass || '');
      return ` class="${classes.trim()}"`;
    } else {
      return '';
    }
  }

  replaceText(options: ReplaceOptions): string {
    const firstTag = options.tag + ':',
          closedTag = `[${firstTag + options.oldText + options.tag}]`,
          noBracketTag = `${options.tag + options.oldText + options.tag}`,
          openTag = options.hasBracket ? `[${firstTag + options.oldText}]` : noBracketTag;
    return options.html.replace(options.hasClosingTag ? closedTag : openTag, options.newText);
  }

  // Remove tags from user input data
  removeTags(text: string, tags: string[]): string {
    const defaultTags = ['script', 'a', 'img', 'embed', 'object', 'canvas', 'iframe', 'input', 'source', 'textarea', 'video', 'applet'];
    let filteredText = text,
        regex: RegExp;
    // remove script tags and enclosed data
    defaultTags.forEach(scriptTag => {
      regex = new RegExp(`<${scriptTag}\\b[^<]*(?:(?!<\\/${scriptTag}>)<[^<]*)*<\\/${scriptTag}>`, 'gi');
      filteredText = filteredText.replace(regex, '');
    });
    // remove image tag
    filteredText = filteredText.replace(/<img[^>]*>/g, '');
    // remove other html tags
    tags.forEach(tag => {
      regex = new RegExp(`(<${tag}>)|(<\\/${tag}>)`, 'gi');
      filteredText = filteredText.replace(regex, '');
    });
    return filteredText;
  }
}
