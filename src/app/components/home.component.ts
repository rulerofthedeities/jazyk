import {Component} from '@angular/core';

@Component({
  template: `
  <div class="row">
    <div class="col-xs-8">

      <div class="btn-mega clearfix login">
        <div class="btn-text btn-sub unselectable"> 
          Login
        </div>
        <div class="btn-icon btn-sub unselectable">
          <span class="fa fa-key"></span>
        </div>
      </div>

      <div class="btn-mega clearfix signup">
        <div class="btn-text btn-sub unselectable"> 
          Sign up
        </div>
        <div class="btn-icon btn-sub unselectable">
          <span class="fa fa-pencil"></span>
        </div>
      </div>

      <div class="btn-mega clearfix try">
        <div class="btn-text btn-sub unselectable"> 
          Give Jazyk a try!
        </div>
        <div class="btn-icon btn-sub unselectable">
          <span class="fa fa-play"></span>
        </div>
      </div>

    </div>
    <div class="col-xs-4">
      <div class="panel panel-default info">
        <div class="panel-heading">What is Jazyk?</div>
        <div class="panel-body">
          blablabla...
        </div>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .info {
      height: 442px;
    }
    .info .panel-heading {
      font-size: 32px;
    }
    .btn-mega {
      font-size: 56px;
      line-height: 1.3333333;
      margin-bottom: 32px;
      color: #eee;
      text-shadow: 1px 1px 1px #333;
    }  
    .btn-mega .btn-sub {
      padding: 25px 32px;
      border-radius: 6px;
      position: relative;
      box-sizing: border-box;
      min-height: 1px;
      float: left;
      text-align: center;
      border: 1px dotted #333;
      cursor: pointer;
    }
    .btn-text {
      width: 80%;
    }
    .btn-icon {
      width: 19.8%;
      margin-left: 0.2%;
    }
    .btn-mega:hover .btn-sub {
      box-shadow: inset 0 8px 12px rgba(51, 51, 51, .125);
      border: 1px solid #999;
    }
    .btn-mega:active .btn-sub {
      box-shadow: inset 0 8px 12px rgba(20, 20, 20, .25);
      border: 1px solid #666;
    }
    .login {
      background-color: rgba(232, 76, 61, 0.2);
    }
    .login .btn-sub {
      background-color: rgb(232, 76, 61);
    }
    .login .btn-icon {
      background-color: rgb(219, 71, 57);
    }
    .signup {
      background-color: rgba(243, 156, 17, 0.2);
    }
    .signup .btn-sub {
      background-color: rgb(243, 156, 17);
    }
    .signup .btn-icon {
      background-color: rgb(229, 148, 16);
    }
    .try {
      background-color: rgba(242, 196, 15, 0.2);
    }
    .try .btn-sub {
      background-color: rgb(242, 196, 15);
    }
    .try .btn-txt {
      background-color: rgb(229, 186, 14);
    }
  `]
})

export class HomeComponent {

}
