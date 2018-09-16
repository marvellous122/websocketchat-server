import { Injectable } from '@angular/core';
import { WebSocketSubject } from 'rxjs/webSocket';
import { Message, Event } from '../model';
import { Observable } from 'rxjs';

const SERVER_URL = 'ws://frozen-reaches-54483.herokuapp.com/';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private webSocket;
  private connected = false;

  public initWebSocket(): void {
    this.webSocket = new WebSocketSubject(SERVER_URL);
  }

  public setConnectionStatus(status: boolean): void {
    this.connected = status;
  }

  public sendReconnecting(message: any): void {
    this.webSocket.next(message);
  }

  public send(message: Message): void {
    this.webSocket.next(message);
  }

  public onMessage(): Observable<any> {
    return this.webSocket;
  }

  constructor() { }
}
