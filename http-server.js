'use strict'
const PORT = 8080;
const SUCCESS_LOGIN_EVENT = 'success-login';
const SVR_MSG_EVENT = 'server-message';
const CLT_MSG_EVENT = 'client-message';
const CLT_MSG_PRT_EVENT = 'client-private-message';
const ONLINE_LIST_EVENT = 'online-users-update';
const WRONG_NICK_NAME_EVENT = 'wrong-nickname';
const TYPING_EVENT = 'typing';
//--------------------------------------------------------------------------------
const express = require( 'express' );
const expressApp = express();
const server = require( 'http' ).Server( expressApp );
const io = require( 'socket.io' )( server );
const fs = require( 'fs' );
const bodyParser = require( 'body-parser' );
const cm = require( './src/classes.js' );
const udb = require( './src/user-db.js' );
//--------------------------------------------------------------------------------
let onlineUserList = new cm.OnlineUserList();
let userDB = new udb.UserDB();
//--------------------------------------------------------------------------------
expressApp.use( bodyParser.json() );
expressApp.use( '/src', express.static( __dirname + '/src' ) );
expressApp.use( '/images', express.static( __dirname + '/images' ) );
expressApp.use( '/socket.io', express.static( __dirname + '/node_modules/socket.io-client/dist' ) );

expressApp.get( '/', mainPageLoader );
expressApp.use( onError );


try {
    server.listen( PORT, () => {
        console.log( "Server has started on port: " + PORT );
    });
}
catch ( err ) {
    console.log( err.message );
    console.log( 'Unable to start server on port: ' + PORT );
    process.exit( 0 )
}
//--------------------------------------------------------------------------------
function mainPageLoader( req, res, next ) {
    res.sendFile( __dirname + '/src/index.html' );
}
//--------------------------------------------------------------------------------
function onError( err, req, res, next ) {

    if ( res.statusCode === 401 ) {
        return;
    }
    res.status( res.statusCode === 200 ? 500 : res.statusCode || 500 ).json( {
        errorMessage: err.message,
        stack: err.stack
    } );    
}
//--------------------------------------------------------------------------------
io.on( 'connection' , ( socket ) => {
    let nickname = socket.request._query.user;
    let password = socket.request._query.password;
    let tempUser;
    let errMessage = '';
    
    if ( tempUser = userDB.getUser( nickname )  ) {
        errMessage = tempUser.verifyPassword( password ) ? '' : 'Wrong password'; 
    } else {
        userDB.addUser( new udb.User( nickname, password ) );
    }
    errMessage = errMessage || ( onlineUserList.isUserOnline( nickname ) ? `User ${nickname} is online` : '' );
    
    if ( errMessage ) {
        socket.emit( WRONG_NICK_NAME_EVENT, errMessage );
        socket.disconnect();
        return;
    }

    onlineUserList.connectUser( new cm.OnlineUser( nickname, socket) );
    socket.emit( SUCCESS_LOGIN_EVENT, 'Success connection established' );
    io.emit( SVR_MSG_EVENT, JSON.stringify( new cm.Message( 'server', `<b>${nickname}</b> has connected` ) ) );
    io.emit( ONLINE_LIST_EVENT, JSON.stringify(  { onlineUserList: onlineUserList.getnicknames() } ) );

    socket.on( CLT_MSG_EVENT, ( message ) => {
        let tempObj = JSON.parse( message );
        
        socket.broadcast.emit( SVR_MSG_EVENT, JSON.stringify( new cm.Message( tempObj.nickname, tempObj.message ) ) );        
    });

    socket.on( CLT_MSG_PRT_EVENT, ( message ) => {
        let tempObj = JSON.parse( message );
        let user = onlineUserList.getUser( tempObj.receiver );

        if ( user ) {
            user.socket.emit( CLT_MSG_PRT_EVENT, message );        
        } else {
            socket.emit( CLT_MSG_PRT_EVENT, JSON.stringify( new cm.PrivateMessage( tempObj.receiver,
                                                                                   tempObj.sender,
                                                                                   tempObj.message, 
                                                                                   true
            ) ) );
        }
    });

    socket.on( TYPING_EVENT, ( message ) => {
        let tempObj = JSON.parse( message );
        let user = onlineUserList.getUser( tempObj.receiver );

        if ( user ) {
            user.socket.emit( TYPING_EVENT, message );        
        } 
    });

    socket.on( 'disconnect', () => {
        let user = onlineUserList.getUserBySocketId( socket.id );

        onlineUserList.disconnectUser( user.nickname );
        io.emit( SVR_MSG_EVENT, JSON.stringify( new cm.Message( 'server', `${user.nickname} has disconnected` ) ) );        
        io.emit( ONLINE_LIST_EVENT, JSON.stringify( { onlineUserList: onlineUserList.getnicknames() } ) );
    });
});