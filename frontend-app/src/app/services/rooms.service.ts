import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MqttService } from './mqtt.service';
import { ReplaySubject } from '../../../node_modules/rxjs';

@Injectable({
  providedIn: 'root'
})
export class RoomsService {
  private rooms: [string];
  private roomsObservable: ReplaySubject<[string]> = new ReplaySubject<[string]>(1);

  constructor(private http: HttpClient, private mqttService: MqttService) {
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
      case `ar-signage/dashboard/roomsurl`:
        this.http.get<[string]>(messageObject.value).subscribe(rooms => this.roomsObservable.next(rooms));
        break;
    }
  }

  public getRooms(): Promise<[string]> {
    return new Promise(resolve => {
      if (this.rooms) {
        resolve(this.rooms);
        return;
      }

      this.roomsObservable.subscribe(rooms => {
        resolve(rooms);
      });
    });
  }
}
