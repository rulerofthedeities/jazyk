import {Component, Input} from '@angular/core';

@Component({
  selector: 'km-signup',
  template: `
    <span class="signup">
      <a routerLink="/auth/signup" [queryParams]="{courseId: courseId}">
        {{text["SignupAction"]}}</a> {{text["ToSeeResults"]}}!
    </span>
  `,
  styles: [`.signup {font-size: 22px;}`]
})

export class LearnSignUpComponent {
  @Input() text: Object;
  @Input() courseId: string;
}
