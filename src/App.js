import React, { Component } from 'react';
import Chatkit from '@pusher/chatkit-client';

import './App.css';
import MessageList from './components/MessageList';
import SendMessageForm from './components/SendMessageForm';
import RoomList from './components/RoomList';
import NewRoomForm from './components/NewRoomForm';
import TypingIndicator from './components/TypingIndicator'

import { tokenUrl, instanceLocator } from './config';

const username = "firas"
// const roomId = 19680942

class App extends Component {
  constructor() {
    super()
    this.state = {
        currentRoomId: null,
        joinableRooms: [],
        joinedRooms: [],
        messages: [],
        usersWhoAreTyping: []
    }
    this.subscribeToRoom = this.subscribeToRoom.bind(this)
    this.sendMessage = this.sendMessage.bind(this)
    this.getRooms = this.getRooms.bind(this)
    this.createRoom = this.createRoom.bind(this)
    this.sendTypingEvent = this.sendTypingEvent.bind(this)
  }

  componentDidMount () {
      const chatManager = new Chatkit.ChatManager({
              instanceLocator,
              userId: username,
              tokenProvider: new Chatkit.TokenProvider({
                  url: tokenUrl
          })
      })

      chatManager.connect()
      .then(currentUser => {
          this.currentUser = currentUser
          this.getRooms()
          console.log("SUCCESS CONNECTION");
      })
  }

  sendMessage(text) {
      this.currentUser.sendMessage({
          text,
          roomId: this.state.currentRoomId
      })
  }

  createRoom(name) {
      this.currentUser.createRoom({
          name
      })
      .then(room => this.subscribeToRoom(room.id))
      .catch(err => console.log(err))
  }

  getRooms() {
    this.currentUser.getJoinableRooms()
    .then(joinableRooms => {
        this.setState({
            joinableRooms,
            joinedRooms: this.currentUser.rooms
        })
    })
    .catch(err => console.log('error on joinableRooms: ', err))
  }

  subscribeToRoom(roomId) {
      this.setState({
          messages: []
      });
      this.currentUser.subscribeToRoom({
          roomId: roomId,
          hooks: {
              onMessage: message => {
                this.setState({
                    messages: [...this.state.messages, message]
                })
              },
              onUserStartedTyping: user => {
                console.log("User typing", user);
              },
              onUserJoined: user => {
                console.log("user",user);
              },
              onUserLeft: user => {
                console.log("User Left",user);
              }
          }
      })
      .then(currentRoom => {
          this.setState({currentRoomId: currentRoom.id})
          
          console.log(this.currentUser.rooms[0].userIds);
          this.getRooms()
      })
      .catch(err => console.log('error on subscribing: ', err))
  }

  sendTypingEvent() {
    this.currentUser
      .isTypingIn({ roomId: this.state.currentRoomId })
      .catch(error => console.error('error', error))
  }

  render() {
    return (
      <div className="app">
          <Title />
          <RoomList
              rooms={[...this.state.joinableRooms, ...this.state.joinedRooms]}
              subscribeToRoom={this.subscribeToRoom}
              currentRoomId={this.state.currentRoomId} />
          <MessageList
              currentRoomId={this.state.currentRoomId}
              messages={this.state.messages} />
          <NewRoomForm createRoom={this.createRoom} />
          <TypingIndicator usersWhoAreTyping={this.state.usersWhoAreTyping} />
          <SendMessageForm
              sendMessage={this.sendMessage}
              disabled={!this.state.currentRoomId} 
              sendTypingEvent={this.sendTypingEvent} />
      </div>
    );
  }
}

function Title() {
  return <p className="title">Youandme Messanger</p>
}

export default App;
