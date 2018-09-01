import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MqttService } from '../services/mqtt.service';
import { RoomsService } from '../services/rooms.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  public selectedRoom: string;
  public rooms: [string];
  public timerSeconds: any = {};
  public timerMinuteString = '00';
  public timerSecondsString = '00';
  public timerSetMinute = '0';
  public timerSetSeconds = '0';

  constructor(
    private mqttService: MqttService,
    private roomsService: RoomsService,
    private changeRef: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.mqttService.mqttMessageObservable.subscribe(message => {
      this.mqttMessageHandler(message.topic, message.message);
      this.changeRef.detectChanges();
    });
    this.roomsService.getRooms().then(rooms => {
      this.rooms = rooms;
      if (rooms.length > 0) {
        const localStorageRoom = JSON.parse(window.localStorage.getItem('selectedRoom'));
        if (localStorageRoom) {
          this.selectedRoom = localStorageRoom;
        } else {
          this.selectedRoom = rooms[0];
        }

        this.roomsService.selectedRoomObservable.next(this.selectedRoom);
        window.localStorage.setItem('selectedRoom', JSON.stringify(this.selectedRoom));
        this.makeTimeString();
      }
    });
  }

  public setRoom(room) {
    this.selectedRoom = room;
    window.localStorage.setItem('selectedRoom', JSON.stringify(room));
    this.roomsService.selectedRoomObservable.next(room);
    this.makeTimeString();
  }

  public timerPlay() {
    this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/timer/control`, JSON.stringify({
      value: 'START'
    }));
  }

  public timerPause() {
    this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/timer/control`, JSON.stringify({
      value: 'PAUSE'
    }));
  }

  public timerReset() {
    this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/timer/control`, JSON.stringify({
      value: 'RESET'
    }));
  }

  public timerSet() {
    this.mqttService.mqttModule.mqttClient.publish(`ar-signage/${this.selectedRoom}/timer/setseconds`, JSON.stringify({
      value: (parseInt(this.timerSetMinute, 10) * 60) + parseInt(this.timerSetSeconds, 10)
    }));
  }

  private mqttMessageHandler(topic, message) {
    let messageObject;
    let roomName;
    try {
      messageObject = JSON.parse(message.toString());
    } catch (err) {
      console.error(`mqttMessageHandler JSON parse error: ${err.toString()}`);
    }

    switch (true) {
      case topic.match(/^ar-signage\/.+\/timer\/seconds$/g) && topic.match(/^ar-signage\/.+\/timer\/seconds$/g).length > 0:
        roomName = topic.split(/[\/\/]/g)[1];
        this.timerSeconds[roomName] = parseInt(messageObject.value, 10);
        this.makeTimeString();
        break;
    }
  }

  private makeTimeString() {
    this.timerSecondsString = ('0' + this.timerSeconds[this.selectedRoom] % 60).slice(-2);
    this.timerMinuteString = ('0' + Math.floor(this.timerSeconds[this.selectedRoom] / 60)).slice(-2);
  }

}
