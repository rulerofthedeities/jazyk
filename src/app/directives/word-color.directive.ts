import {Directive, ElementRef, Renderer2, Input, OnChanges} from '@angular/core';

@Directive({
  selector: '[kmWordColor]'
})

export class WordColorDirective implements OnChanges {
  @Input() identifier: string;
  @Input() active = true;

  constructor(
    private element: ElementRef,
    private renderer: Renderer2
  ) {}

  ngOnChanges() {
    if (this.identifier) {
      const color = this.getColor();
      this.color(color);
    }
  }

  private getColor() {
    let color = 'black';
    if (this.active) {
      switch (this.identifier.toLowerCase()) {
        case 'f': color = 'red'; break;
        case 'mi':
        case 'm': color = 'darkBlue'; break;
        case 'ma': color = 'dodgerBlue'; break;
        case 'n': color = 'green'; break;
        default: color = 'black';
      }
    }
    return color;
  }

  private color(color: string) {
    this.renderer.setStyle(this.element.nativeElement, 'color', color);
  }
}
