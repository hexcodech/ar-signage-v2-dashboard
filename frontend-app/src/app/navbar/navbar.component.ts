import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MqttService } from '../services/mqtt.service';
import { RoomsService } from '../services/rooms.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  public selectedRoom: String;
  public rooms: [string];
  public timerMinuteString = '00';
  public timerSecondsString = '00';

  constructor(
    private mqttService: MqttService,
    private roomsService: RoomsService,
    private changeRef: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.mqttService.mqttMessageObservable.subscribe(message => {
      this.mqttMessageHandler(message.topic, message.message);
    });
    this.roomsService.getRooms().then(rooms => {
      this.rooms = rooms;
      if (rooms.length > 0) {
        this.selectedRoom = rooms[0];
      }
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
      case `ar-signage/${this.selectedRoom}/timer/seconds`:
        this.timerSecondsString = ('0' + messageObject.value % 60).slice(-2);
        this.timerMinuteString = ('0' + Math.floor(messageObject.value / 60)).slice(-2);
        this.changeRef.detectChanges();
        break;
    }
  }

  public timerPlay() {
    this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/timer/control`, JSON.stringify({
      value: 'START'
    }));
  }

  public timerSet() {
    this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/timer/setseconds`, JSON.stringify({
      value: 15
    }));
  }

}
