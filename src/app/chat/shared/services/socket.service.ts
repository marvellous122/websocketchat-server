import { Injectable } from '@angular/core';
import { WebSocketSubject } from 'rxjs/webSocket';
import { Message, Event } from '../model';
import { Observable, BehaviorSubject } from 'rxjs';

const SERVER_URL = 'wss://frozen-reaches-54483.herokuapp.com/';
// const SERVER_URL = 'ws://localhost:8999/';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private webSocket;
  private connected = false;
  private browserOnline = true;
  private pingId: number;
  private receivedPingId: number;
  connectedSubscription: BehaviorSubject<boolean> = new BehaviorSubject(false);

  public initWebSocket(): void {
    this.webSocket = new WebSocketSubject(SERVER_URL);
    this.pingId = 1;
    this.receivedPingId = 1;
    this.sendPing();

    this.connectedSubscription.next(this.connected);
  }

  public closeWebSocket(): void {
    this.webSocket.unsubscribe();
  }

  public getPingId(): number {
    return this.pingId;
  }

  public getReceviedPingId(): number {
    return this.receivedPingId;
  }

  public setReceivedPingId(pingId: number): void {
    this.receivedPingId = pingId;
  }

  public getBrowserConnectionStatus(): boolean {
    return this.browserOnline;
  }

  public setBrowserConnectionStatus(status: boolean): void {
    this.browserOnline = status;
  }

  public getConnectionStatus(): boolean {
    return this.connected;
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

  public sendPing(): void {
    setTimeout(() => {
      if (this.browserOnline) {
        if (!this.checkPingStatus()) {
          this.connected = false;
        }
        this.webSocket.next({
          type: 'ping',
          id: this.pingId
        });
        this.pingId ++;
        if (this.pingId >= 10000) {
          this.pingId = 1;
        }
      }
      this.sendPing();
    }, 5000);
  }

  public onMessage(): Observable<any> {
    return this.webSocket;
  }

  private checkPingStatus(): boolean {
    if (this.pingId > this.receivedPingId + 2) {
      return false;
    }
    if (this.receivedPingId > 9000 && this.pingId < 100) {
      if ((this.pingId + 9999) > (this.receivedPingId + 2)) {
        return false;
      }
    }
    return true;
  }

  private handleReConnect(): void {
    if (this.browserOnline && !this.connected) {
    }
  }

  constructor() { }
}
