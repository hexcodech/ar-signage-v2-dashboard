import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { NgxElectronModule } from 'ngx-electron';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { NgbModule, NgbDropdown } from '@ng-bootstrap/ng-bootstrap';

import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { NavbarComponent } from './navbar/navbar.component';

import { MqttService } from './services/mqtt.service';
import { RoomsService } from './services/rooms.service';

import { faPlay, faPause, faCheckCircle, faStop, faVolumeUp, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { ClientComponent } from './client/client.component';
import { MediaComponent } from './media/media.component';
import { ClientsService } from './services/clients.service';
import { MediaListService } from './services/media-list.service';
import { MediaCacheService } from './services/media-cache.service';

library.add(faPlay, faPause, faStop, faCheckCircle, faTimesCircle, faVolumeUp);

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavbarComponent,
    ClientComponent,
    MediaComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    NgxElectronModule,
    FormsModule,
    FontAwesomeModule,
    NgbModule.forRoot(),
    RouterModule.forRoot([
      { path: '', component: HomeComponent }
    ]),
  ],
  providers: [
    MqttService,
    RoomsService,
    ClientsService,
    MediaListService,
    MediaCacheService,
    NgbDropdown,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
