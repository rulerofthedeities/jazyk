import { Directive, AfterViewInit, ElementRef } from '@angular/core';

@Directive(
  {selector: '[kmScrollTo]'}
)

export class ScrollToDirective implements AfterViewInit {
  constructor(
    private elRef: ElementRef
  ) {}

  ngAfterViewInit() {
    this.elRef.nativeElement.scrollIntoView({behavior: 'smooth'});
  }
}
