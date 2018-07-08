import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { NgxElectronModule } from 'ngx-electron';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { NavbarComponent } from './navbar/navbar.component';

import { MqttService } from './services/mqtt.service';
import { RoomsService } from './services/rooms.service';

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
