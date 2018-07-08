import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { NgxElectronModule } from 'ngx-electron';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { NavbarComponent } from './navbar/navbar.component';

import { MqttService } from './services/mqtt.service';
import { RoomsService } from './services/rooms.service';

import { faPlay, faPause, faCheckCircle, faStop } from '@fortawesome/free-solid-svg-icons';

library.add(faPlay, faPause, faStop, faCheckCircle);

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavbarComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    NgxElectronModule,
    FormsModule,
    FontAwesomeModule,
    RouterModule.forRoot([
      { path: '', component: HomeComponent }
    ]),
  ],
  providers: [
    MqttService,
    RoomsService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
