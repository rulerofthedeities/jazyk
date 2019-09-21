import { AfterViewInit, Directive, ElementRef } from '@angular/core';
import { PlatformService } from '../services/platform.service';

@Directive({
  selector: '[kmFocus]',
})
export class FocusDirective implements AfterViewInit {
  constructor(
    private readonly element: ElementRef<HTMLElement>,
    private readonly platform: PlatformService,
  ) {}

  ngAfterViewInit(): void {
    console.log('focus');
    if (this.platform.isBrowser) {
      this.element.nativeElement.focus();
    }
  }
}
