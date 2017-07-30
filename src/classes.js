'use strict';
class OnlineUser {
    constructor( nickName, socket ) {
        this.socket = socket;
        this.nickName = nickName;
    }
}
//--------------------------------------------------------------------------------
class OnlineUserList {    
    constructor() {
        this.userList = [];
    }
    //--------------------------------------------------------------------------------
    isFreeNickName( nickName ) {
        return !Boolean( this.userList.find( el => el.nickName === nickName ) );
    }
    //--------------------------------------------------------------------------------
    connectUser( user ) {
        this.userList.push( user );
    }
    //--------------------------------------------------------------------------------
    disconnectUser( nickName ) {
        this.userList = this.userList.filter( el => el.nickName !== nickName );
    }
    //--------------------------------------------------------------------------------
    getUser( nickName ) {
        let user = this.userList.find( el => el.nickName === nickName );

        return user ? user : false;
    }
    //--------------------------------------------------------------------------------
    getUserBySocketId( socketId ) {
        let user = this.userList.find( el => el.socket.id === socketId );

        return user ? user : false;
    }
    //--------------------------------------------------------------------------------
    getNickNames() {
        return this.userList.map( el => el.nickName );
    }
}
//--------------------------------------------------------------------------------
class Message {
    constructor ( sender, message ) {
        this.sender = sender;
        this.message = message;
        this.time = new Date;
    }
}
//--------------------------------------------------------------------------------
class PrivateMessage extends Message {
    constructor( sender, receiver, message, failed = false ) {
        super( sender, message );
        this.receiver = receiver;
        this.failed = failed;
    }
}
//--------------------------------------------------------------------------------
module.exports = {
    OnlineUser,
    OnlineUserList,
    Message,
    PrivateMessage
}
//--------------------------------------------------------------------------------
