import { Component, OnInit, ViewChildren, ViewChild, AfterViewInit, QueryList, ElementRef } from '@angular/core';
import { MatDialog, MatDialogRef, MatList, MatListItem } from '@angular/material';

import { Action, Event, Message, User } from './shared/model';
import { SocketService } from './shared/services/socket.service';
import { DialogUserComponent } from './dialog-user/dialog-user.component';
import { DialogUserType } from './dialog-user/dialog-user-type';
import { isArray } from 'util';

const AVATAR_URL = 'https://api.adorable.io/avatars/285';

@Component({
  selector: 'wne-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewInit {
  action = Action;
  user: User;
  connected: boolean;
  messages: Message[] = [];
  messageContent: string;
  ioConnection: any;
  dialogRef: MatDialogRef<DialogUserComponent> | null;
  defaultDialogUserParams: any = {
    disableClose: true,
    data: {
      title: 'Welcome',
      dialogType: DialogUserType.NEW
    }
  };

  // getting a reference to the overall list, which is the parent container of the list items
  @ViewChild(MatList, { read: ElementRef }) matList: ElementRef;

  // getting a reference to the items/messages within the list
  @ViewChildren(MatListItem, { read: ElementRef }) matListItems: QueryList<MatListItem>;

  constructor(private socketService: SocketService,
    public dialog: MatDialog) { }

  ngOnInit() {
    this.initModel();

    // Using timeout due to https://github.com/angular/angular/issues/14748
    setTimeout(() => {
      this.openUserPopup(this.defaultDialogUserParams);
    }, 0);
  }

  ngAfterViewInit(): void {
    // subscribing to any changes in the list of items / messages
    this.matListItems.changes.subscribe(elements => {
      this.scrollToBottom();
    });
  }

  private scrollToBottom(): void {
    try {
      this.matList.nativeElement.scrollTop = this.matList.nativeElement.scrollHeight;
    } catch (err) {
    }
  }

  private initModel(): void {
    const randomId = this.getRandomId();
    this.user = {
      id: randomId,
      avatar: `${AVATAR_URL}/${randomId}.png`
    };
  }

  private initIoConnection(): void {
    this.socketService.initWebSocket();
    console.log('init');
    this.ioConnection = this.socketService.onMessage()
      .subscribe(
        ((message) => {
          console.log('receive');
          if (message.msg === 'connected') {
            // receive connected status
            this.socketService.setConnectionStatus(true);
            this.connected = true;
            this.messages = message.history;
          } else if (isArray(message)) {
            this.messages = this.messages.concat(message);
          } else {
            this.messages.push(message);
          }
        }),
        ((err) => {
          console.log('err', err);
          // set connection status false
          this.socketService.setConnectionStatus(false);
          this.connected = false;
          // try reconnecting after 5 sec
          setTimeout(() => {
            this.reSubscribe();
            this.socketService.sendReconnecting({msg: 'reconnecting'});
          }, 5000);
        }),
        (() => {
          console.log('completed');
        }));
  }

  private reSubscribe(): void {
    this.ioConnection = this.socketService.onMessage()
      .subscribe(
        ((message) => {
          console.log('receive');
          if (!this.connected) {
            this.connected = true;
            this.socketService.setConnectionStatus(true);
            this.messages = message.history;
          }
          if (message.msg === 'connected') {
            this.connected = true;
          } else if (isArray(message)) {
            this.messages = this.messages.concat(message);
          } else {
            this.messages.push(message);
          }
        }),
        ((err) => {
          console.log('err', err);
          // set connection status false
          if (this.connected) {
            this.socketService.setConnectionStatus(false);
            this.connected = false;
          }
          // try reconnecting after 5 sec
          setTimeout(() => {
            this.reSubscribe();
            this.socketService.sendReconnecting({msg: 'reconnecting'});
          }, 5000);
        }),
        (() => {
          console.log('completed');
        }));
  }

  private getRandomId(): number {
    return Math.floor(Math.random() * (1000000)) + 1;
  }

  public onClickUserInfo() {
    this.openUserPopup({
      data: {
        username: this.user.name,
        title: 'Edit Details',
        dialogType: DialogUserType.EDIT
      }
    });
  }

  private openUserPopup(params): void {
    this.dialogRef = this.dialog.open(DialogUserComponent, params);
    this.dialogRef.afterClosed().subscribe(paramsDialog => {
      if (!paramsDialog) {
        return;
      }

      this.user.name = paramsDialog.username;
      if (paramsDialog.dialogType === DialogUserType.NEW) {
        this.initIoConnection();
        this.sendNotification(paramsDialog, Action.JOINED);
      } else if (paramsDialog.dialogType === DialogUserType.EDIT) {
        this.sendNotification(paramsDialog, Action.RENAME);
      }
    });
  }

  public sendMessage(message: string): void {
    if (!message) {
      return;
    }

    this.socketService.send({
      from: this.user,
      content: message,
      created: new Date()
    });
    this.messageContent = null;
  }

  public sendNotification(params: any, action: Action): void {
    let message: Message;

    if (action === Action.JOINED) {
      message = {
        from: this.user,
        action: action
      };
    } else if (action === Action.RENAME) {
      message = {
        action: action,
        content: {
          username: this.user.name,
          previousUsername: params.previousUsername
        },
        created: new Date()
      };
    }

    this.socketService.send(message);
  }

}
