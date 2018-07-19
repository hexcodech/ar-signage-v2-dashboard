import { Injectable } from '@angular/core';
import { ReplaySubject } from '../../../node_modules/rxjs';
import { HttpClient } from '../../../node_modules/@angular/common/http';
import { MqttService } from './mqtt.service';

@Injectable({
  providedIn: 'root'
})
export class MediaListService {
  private mediaList: any;
  private mediaListObservable: ReplaySubject<any> = new ReplaySubject<any>(1);

  constructor(
    private http: HttpClient,
    private mqttService: MqttService,
  ) {
    this.mqttService.mqttMessageObservable.subscribe(message => {
      this.mqttMessageHandler(message.topic, message.message);
    });
  }

  private mqttMessageHandler(topic, message) {
    let messageObject;
    try {
      messageObject = JSON.parse(message.toString());
    } catch (err) {
      console.error(`mqttMessageHandler JSON parse error: ${err.toString()}`);
    }

    switch (topic) {
      case `ar-signage/dashboard/medialisturl`:
        this.http.get<any>(messageObject.value).subscribe(mediaList => this.mediaListObservable.next(mediaList));
        break;
    }
  }

  public getMediaList(): Promise<[any]> {
    return new Promise(resolve => {
      if (this.mediaList) {
        resolve(this.mediaList);
        return;
      }

      this.mediaListObservable.subscribe(mediaList => {
        this.mediaList = mediaList;
        resolve(mediaList);
      });
    });
  }
}
