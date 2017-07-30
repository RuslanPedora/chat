'use sctrict'
//--------------------------------------------------------------------------------
const SVR_MSG_EVENT = 'server-message';
const CLT_MSG_EVENT = 'client-message';
const CLT_MSG_PRT_EVENT = 'client-private-message';
const ONLINE_LIST_EVENT = 'online-users-update';
const WRONG_NICK_NAME_EVENT = 'wrong-nickname';
const TYPING_EVENT = 'typing';
const MAIN_DIALOG = 'all';
//--------------------------------------------------------------------------------
let socket;
let nickName;
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
    message = new PrivateMessage( nickName, currentCollocutor, '' );
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
        message = new Message( nickName, messageText );
        socket.emit( CLT_MSG_EVENT, JSON.stringify( message ) );
    } else {
        message = new PrivateMessage( nickName, currentCollocutor, messageText );
        socket.emit( CLT_MSG_PRT_EVENT, JSON.stringify( message ) );
    }
    dialogs.addMessageToDilaog( message, currentCollocutor );
    rednerCurrentDialog();
});
//--------------------------------------------------------------------------------
$( '#connect-button' ).click ( () => {
    
    nickName = $( '#user' ).val();

    socket = io.connect( `${document.documentURI}?user=${nickName}` );

    socket.on( WRONG_NICK_NAME_EVENT, () => {
        alert( 'Nickname not unique! Please select another one.' );
        socket.disconnect();
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
            dialogs.addDialog( new Dialog( message.sender ) );
            renderCollocutors();
        }        
        dialogs.addMessageToDilaog( message, message.sender );
        if ( currentCollocutor === message.sender ) {
            rednerCurrentDialog();
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
            if( nickName === onlineUserList[ index ] ) {
                inlineStyle = 'style="cursor:default;"'
            }
            tempHTML += `<li id=\'onlineUser${index}\' ${inlineStyle}>${onlineUserList[index]}</li>`
        }
        $( '#online-users' ).html( tempHTML );
        for(  let index in onlineUserList ) {            
            if ( nickName === onlineUserList[ index ] ) {
                continue;
            }
            $( `#onlineUser${index}` ).on( 'click', () => {                
                let neededNickName = onlineUserList[ index ];
                
                if ( !dialogs.hasCollocutor( neededNickName )  ) {
                    dialogs.addDialog( new Dialog( neededNickName ) ); 
                    renderCollocutors();
                }
            });
        }
    } );
    renderCollocutors();
});
//--------------------------------------------------------------------------------
function renderCollocutors() {
    let tempHTML = '';
    let inlineStyle = '';
    let inlineDelete = '';
    let collocutors = dialogs.getCollocutors();

    for( let index in collocutors ) {
        inlineDelete = index == 0 ? '' : `<span id=\'collocutorDel${index}\' class=\'cross\'> x </span>`;
        inlineStyle  = collocutors[ index ] === currentCollocutor ? 'style="color:green;"' : '';
        tempHTML += `<li id=\'collocutor${index}\' ${inlineStyle}>\
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
    let tempHTML = totalRefresh ? '' : $( '#tracker' ).html();
    let messages;
    let inlineStyle;

    if ( totalRefresh ) {
        messages = dialogs.getDialog( currentCollocutor ).getMessages();
    } else {
        messages = [];
        messages.push( dialogs.getDialog( currentCollocutor).getLastMessage() );
    }
    for ( let message of messages ) {
        inlineStyle = message.failed ? 'style="color:grey;"' : '';
        tempHTML += `<br><span ${inlineStyle}>${JSON.stringify(message)}</span>`;
    }
    $( '#tracker' ).html( tempHTML  );
}
//--------------------------------------------------------------------------------
setInterval( () => $( '#typing-detector' ).html( '' ) , 1500 );