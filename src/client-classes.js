'use strict';
//--------------------------------------------------------------------------------
class Message {
    constructor ( sender, message ) {
        this.sender = sender;
        this.message = message;
        this.time = formatDate( new Date() );
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
class Dialog {
    constructor( collocutor ) {
        this.collocutor = collocutor;
        this.messages = [];
        this.notRead = false;
    }
    //--------------------------------------------------------------------------------
    setUnread() {
        this.notRead = true;
    }
    //--------------------------------------------------------------------------------
    setRead() {
        this.notRead = false;
    }    
    //--------------------------------------------------------------------------------
    isRead() {
        return !this.notRead;
    }
    //--------------------------------------------------------------------------------
    getMessages() {
        return this.messages;
    }
    //--------------------------------------------------------------------------------
    getLastMessage() {
        return this.messages.length ? this.messages[ this.messages.length - 1 ]: 
                                      new Message( '', '' );
    }
    //--------------------------------------------------------------------------------
    postMessage( message ) {
        this.messages.push( message );
    }
    //--------------------------------------------------------------------------------
}
//--------------------------------------------------------------------------------
class DialogContainer {
    constructor() {
        this.dialogs = [];
    }
    //--------------------------------------------------------------------------------
    hasCollocutor( collocutor ) {
        return this.dialogs.findIndex( el => el.collocutor === collocutor ) !== -1;
    }
    //--------------------------------------------------------------------------------
    addDialog( dialog ) {
        this.dialogs.push( dialog );
    }
    //--------------------------------------------------------------------------------
    addMessageToDilaog( message, collocutor ) {
        let dialog = this.dialogs.find( el => el.collocutor === collocutor );

        if( dialog  ) {
            dialog.postMessage( message );
        }
    }
    //--------------------------------------------------------------------------------
    getCollocutors() {
        return this.dialogs.map( el => el.collocutor  );
    }
    //--------------------------------------------------------------------------------
    deleteDialog( collocutor ) {
        this.dialogs = this.dialogs.filter( el => el.collocutor !== collocutor );
    }
    //--------------------------------------------------------------------------------
    getDialog( collocutor ) {
        let dialog = this.dialogs.find( el => el.collocutor === collocutor );
        
        return dialog ? dialog : [];
    }
}
//--------------------------------------------------------------------------------
function formatDate( date ) {
    return `${date.getDate()}/${date.getMonth()}/${date.getFullYear()}  ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}