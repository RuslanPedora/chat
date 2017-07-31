'use strict';
class OnlineUser {
    constructor( nickname, socket ) {
        this.socket = socket;
        this.nickname = '' + nickname;
    }
}
//--------------------------------------------------------------------------------
class OnlineUserList {    
    constructor() {
        this.userList = [];
    }
    //--------------------------------------------------------------------------------
    isUserOnline( nickname ) {
        return Boolean( this.userList.find( el => el.nickname.toLowerCase() === ( '' + nickname ).toLowerCase() ) );
    }
    //--------------------------------------------------------------------------------
    connectUser( user ) {
        this.userList.push( user );
    }
    //--------------------------------------------------------------------------------
    disconnectUser( nickname ) {
        this.userList = this.userList.filter( el => el.nickname.toLowerCase() !== ( '' + nickname ).toLowerCase() );
    }
    //--------------------------------------------------------------------------------
    getUser( nickname ) {
        let user = this.userList.find( el => el.nickname.toLowerCase() === ( '' + nickname ).toLowerCase() );

        return user ? user : false;
    }
    //--------------------------------------------------------------------------------
    getUserBySocketId( socketId ) {
        let user = this.userList.find( el => el.socket.id === socketId );

        return user ? user : false;
    }
    //--------------------------------------------------------------------------------
    getnicknames() {
        return this.userList.map( el => el.nickname );
    }
}
//--------------------------------------------------------------------------------
class Message {
    constructor ( sender, message ) {
        this.sender = sender;
        this.message = message;
        this.time = formatDate( new Date );
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
function formatDate( date ) {
    return `${date.getDate()}/${date.getMonth()}/${date.getFullYear()}  ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}
//--------------------------------------------------------------------------------
module.exports = {
    OnlineUser,
    OnlineUserList,
    Message,
    PrivateMessage
}
//--------------------------------------------------------------------------------
