'use sctrict'
//--------------------------------------------------------------------------------
const SUCCESS_LOGIN_EVENT = 'success-login';
const SVR_MSG_EVENT = 'server-message';
const CLT_MSG_EVENT = 'client-message';
const CLT_MSG_PRT_EVENT = 'client-private-message';
const ONLINE_LIST_EVENT = 'online-users-update';
const WRONG_NICK_NAME_EVENT = 'wrong-nickname';
const TYPING_EVENT = 'typing';
const MAIN_DIALOG = 'General';
//--------------------------------------------------------------------------------
let socket;
let glNickname;
let onlineUserList = [];
let currentCollocutor = MAIN_DIALOG;
let dialogs = new DialogContainer();
dialogs.addDialog( new Dialog( MAIN_DIALOG ) );
//--------------------------------------------------------------------------------
$( '#message' ).keyup( () => {
    let message;

    if ( currentCollocutor === MAIN_DIALOG ) {
        return;
    }
    message = new PrivateMessage( glNickname, currentCollocutor, '' );
    socket.emit( TYPING_EVENT, JSON.stringify( message ) );
});
//--------------------------------------------------------------------------------
$( '#send-button' ).click( () => {
    let messageText = $( '#message' ).val();
    let message;

    if( ( '' + messageText ).trim() === ''  ) {
        return;
    }
    if ( currentCollocutor === MAIN_DIALOG ) {
        message = new Message( glNickname, messageText );
        socket.emit( CLT_MSG_EVENT, JSON.stringify( message ) );
    } else {
        message = new PrivateMessage( glNickname, currentCollocutor, messageText );
        socket.emit( CLT_MSG_PRT_EVENT, JSON.stringify( message ) );
    }
    dialogs.addMessageToDilaog( message, currentCollocutor );
    rednerCurrentDialog();
});
//--------------------------------------------------------------------------------
$( '#login-button' ).click( () => {  
    let nickname = $( '#nickname' ).val();
    let password = $( '#password' ).val();
    
    $( '#message-box' ).hide();
    if ( nickname.trim() === '' || password.trim() === '' ) {
        showMessage( 'Please fill nickname and password' );
        return;
    }

    socket = io.connect( `${document.documentURI}?user=${nickname}&password=${password}` );//

    socket.on( WRONG_NICK_NAME_EVENT, errMessage => {
        showMessage( errMessage );
        socket.disconnect();
    });

    socket.on( SUCCESS_LOGIN_EVENT, data => {
        let t = 1;

        glNickname = nickname;
        $( '#title-nickname' ).html( nickname );
        $( '#login-container' ).hide();
    });

    socket.on( SVR_MSG_EVENT, data => {
        let message = JSON.parse( data );
        
        dialogs.addMessageToDilaog( message, MAIN_DIALOG );
        if ( currentCollocutor === MAIN_DIALOG ) {
            rednerCurrentDialog();
        }    
    });

    socket.on( CLT_MSG_PRT_EVENT, data => {
        let message = JSON.parse( data );
        
        if ( !dialogs.hasCollocutor( message.sender ) ) {
            let newDialog = new Dialog( message.sender );
            dialogs.addDialog( newDialog );
            newDialog.setUnread();
            renderCollocutors();
        }        
        dialogs.addMessageToDilaog( message, message.sender );
        if ( currentCollocutor === message.sender ) {
            rednerCurrentDialog();
        }
        else {
            dialogs.getDialog( message.sender ).setUnread();
            renderCollocutors();
        }
    });

    socket.on( TYPING_EVENT, data => {
        let message = JSON.parse( data );

        if ( message.sender === currentCollocutor ) {
            $( '#typing-detector' ).html( `${currentCollocutor} is typing...` );
        }
    });


    socket.on( ONLINE_LIST_EVENT, data => {
        let onlineUserList = JSON.parse( data ).onlineUserList;        
        let tempHTML = '';
        let inlineStyle = '';

        for( let index in onlineUserList ) {
            if( glNickname === onlineUserList[ index ] ) {
                inlineStyle = 'style="cursor:default;"'
            }
            tempHTML += `<li id=\'onlineUser${index}\' ${inlineStyle}>${onlineUserList[index]}</li>`
        }
        $( '#online-users' ).html( tempHTML );
        for(  let index in onlineUserList ) {            
            if ( glNickname === onlineUserList[ index ] ) {
                continue;
            }
            $( `#onlineUser${index}` ).on( 'click', () => {                
                let needednickname = onlineUserList[ index ];
                
                if ( !dialogs.hasCollocutor( needednickname )  ) {
                    dialogs.addDialog( new Dialog( needednickname ) ); 
                    renderCollocutors();
                }
            });
        }
    });
    renderCollocutors();
});
//--------------------------------------------------------------------------------
function renderCollocutors() {
    let tempHTML = '';
    let inlineStyle = '';
    let inlineDelete = '';
    let inlineClass = '';
    let collocutors = dialogs.getCollocutors();

    for( let index in collocutors ) {
        inlineDelete = index == 0 ? '' : `<span id=\'collocutorDel${index}\' class=\'cross\'> x </span>`;
        inlineStyle  = collocutors[ index ] === currentCollocutor ? 'style="background-color:rgb( 47, 154, 192 );"' : '';
        inlineClass = dialogs.getDialog( collocutors[ index ] ).isRead() ? '' : 'class="unread-dialog"';
        tempHTML += `<li id=\'collocutor${index}\' ${inlineClass} ${inlineStyle}>\
                     ${collocutors[index]}
                     ${inlineDelete}\
                     </li>`;
    }
    $( '#collocutors' ).html( tempHTML );
    for( let index in collocutors ) {
        $( `#collocutor${index}` ).on( 'click', () => {
            if ( currentCollocutor !== collocutors[ index ] ) {
                currentCollocutor = collocutors[ index ];
                $( '#typing-detector' ).html( '' );
                dialogs.getDialog( currentCollocutor ).setRead();
                renderCollocutors(); 
                rednerCurrentDialog( true );
            }      
        });
        $( `#collocutorDel${index}` ).on( 'click', () => {            
            if ( currentCollocutor === collocutors[ index ] ) {
                currentCollocutor = collocutors[ index -1 ];
                $( '#typing-detector' ).html( '' );
            }            
            dialogs.deleteDialog( collocutors[ index ] );
            renderCollocutors();
            rednerCurrentDialog( true );
        });
    }    
}
//--------------------------------------------------------------------------------
function rednerCurrentDialog( totalRefresh = false ) {
    let tracker = $( '#tracker' );
    let tempHTML = totalRefresh ? '' : tracker.html();
    let messages;
    let inlineStyle;
    let inlineContent;
    

    if ( totalRefresh ) {
        messages = dialogs.getDialog( currentCollocutor ).getMessages();
    } else {
        messages = [];
        messages.push( dialogs.getDialog( currentCollocutor).getLastMessage() );
    }
    for ( let message of messages ) {
        inlineStyle = message.failed ? 'style="color:grey;"' : '';
        inlineContent = message.failed ? ' <br> Delivery failed' : '';

        tempHTML += `<div class="message-line" ${inlineStyle}>\
                        <div>\
                            <b>${message.sender}</b>\
                            <span>${message.time}</span>\
                        </div>\
                        <div>\
                            ${message.message} ${inlineContent}\
                        </div>\
                     </div>`;
    }
    tracker.html( tempHTML );
}
//--------------------------------------------------------------------------------
$( '#close-message' ).click( () => 
    $( '#message-box' ).hide() 
);
//--------------------------------------------------------------------------------
function showMessage( errMessage ) {
    $( '#message-content' ).html( errMessage );
    $( '#message-box' ).show();
}
//--------------------------------------------------------------------------------
setInterval( () => $( '#typing-detector' ).html( '' ) , 1500 );