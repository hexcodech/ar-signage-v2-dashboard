import { Injectable } from '@angular/core';
import { ReplaySubject } from '../../../node_modules/rxjs';
import { MqttService } from './mqtt.service';
import { HttpClient } from '../../../node_modules/@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ClientsService {
  private clients: any;
  private clientsObservable: ReplaySubject<any> = new ReplaySubject<any>(1);

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
      case `ar-signage/dashboard/clientsurl`:
        this.http.get<any>(messageObject.value).subscribe(clients => this.clientsObservable.next(clients));
        break;
    }
  }

  public getClients(): Promise<[string]> {
    return new Promise(resolve => {
      if (this.clients) {
        resolve(this.clients);
        return;
      }

      this.clientsObservable.subscribe(clients => {
        this.clients = clients;
        resolve(clients);
      });
    });
  }
}
