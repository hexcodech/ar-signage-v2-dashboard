import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ClientsService } from '../services/clients.service';
import { MqttService } from '../services/mqtt.service';
import { RoomsService } from '../services/rooms.service';
import { NgbModal } from '../../../node_modules/@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-client',
  templateUrl: './client.component.html',
  styleUrls: ['./client.component.scss']
})
export class ClientComponent implements OnInit {
  public selectedRoom: string;
  public clients: any = {};

  constructor(
    private modalService: NgbModal,
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

        this.clients[clients[clientUID].roomname].push({uid: clientUID, clientname: clients[clientUID].clientname, mediaType: null});
      }
    });
    this.roomsService.selectedRoomObservable.subscribe(room => this.selectedRoom = room);
  }

  private mqttMessageHandler(topic, message) {
    let messageObject;
    let roomname, uid;
    try {
      messageObject = JSON.parse(message.toString());
    } catch (err) {
      console.error(`mqttMessageHandler JSON parse error: ${err.toString()}`);
    }

    switch (true) {
      case topic.match(/^ar-signage\/.+\/.+\/media\/none$/g) && topic.match(/^ar-signage\/.+\/.+\/media\/none$/g).length > 0:
        roomname = topic.split(/[\/\/]/g)[1];
        uid = topic.split(/[\/\/]/g)[2];
        if (!roomname || !uid || !this.clients[roomname]) {
          return;
        }
        this.clients[roomname].find(x => x.uid === uid).mediaType = 'none';
        break;
      case topic.match(/^ar-signage\/.+\/.+\/media\/text$/g) && topic.match(/^ar-signage\/.+\/.+\/media\/text$/g).length > 0:
        roomname = topic.split(/[\/\/]/g)[1];
        uid = topic.split(/[\/\/]/g)[2];
        if (!roomname || !uid || !this.clients[roomname]) {
          return;
        }
        this.clients[roomname].find(x => x.uid === uid).mediaType = 'text';
        break;
      case topic.match(/^ar-signage\/.+\/.+\/media\/image$/g) && topic.match(/^ar-signage\/.+\/.+\/media\/image$/g).length > 0:
        roomname = topic.split(/[\/\/]/g)[1];
        uid = topic.split(/[\/\/]/g)[2];
        if (!roomname || !uid || !this.clients[roomname]) {
          return;
        }
        this.clients[roomname].find(x => x.uid === uid).mediaType = 'image';
        break;
      case topic.match(/^ar-signage\/.+\/.+\/media\/video$/g) && topic.match(/^ar-signage\/.+\/.+\/media\/video$/g).length > 0:
        roomname = topic.split(/[\/\/]/g)[1];
        uid = topic.split(/[\/\/]/g)[2];
        if (!roomname || !uid || !this.clients[roomname]) {
          return;
        }
        this.clients[roomname].find(x => x.uid === uid).mediaType = 'video';
        break;
    }
  }

  public setText(textModal, uid) {
    this.modalService.open(textModal, {ariaLabelledBy: 'modal-basic-title'}).result.then(result => {
      this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/${uid}/media/text`, JSON.stringify({
        value: result
      }));
    }).catch(err => {
      // Closed without submiting
    });
  }

  public setTimer(uid) {
    this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/${uid}/media/none`, JSON.stringify({
      value: null
    }));
  }

}
