import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ClientsService } from '../services/clients.service';
import { MqttService } from '../services/mqtt.service';
import { RoomsService } from '../services/rooms.service';

@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.scss']
})
export class ClientComponent implements OnInit {
  public selectedRoom: string;
  public clients: any = {};

  constructor(
    private mqttService: MqttService,
    private clientsService: ClientsService,
    private roomsService: RoomsService,
    private changeRef: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.mqttService.mqttMessageObservable.subscribe(message => {
      this.mqttMessageHandler(message.topic, message.message);
      this.changeRef.detectChanges();
    });
    this.clientsService.getClients().then(clients => {
      for (const clientUID of Object.keys(clients)) {
        if (!this.clients[clients[clientUID].roomname]) {
          this.clients[clients[clientUID].roomname] = [];
        }

        this.clients[clients[clientUID].roomname].push({uid: clientUID, clientname: clients[clientUID].clientname});
      }
    });
    this.roomsService.selectedRoomObservable.subscribe(room => this.selectedRoom = room);
  }

  private mqttMessageHandler(topic, message) {
    let messageObject;
    try {
      messageObject = JSON.parse(message.toString());
    } catch (err) {
      console.error(`mqttMessageHandler JSON parse error: ${err.toString()}`);
    }

    switch (true) {

    }
  }

}
