'use strict'
const PORT = 8080;
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
//--------------------------------------------------------------------------------
let onlineUserList = new cm.OnlineUserList();
//--------------------------------------------------------------------------------
expressApp.use( bodyParser.json() );
expressApp.use( '/src', express.static( __dirname + '/src' ) );
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
    let nickName = socket.request._query.user;
    
    if ( !onlineUserList.isFreeNickName( nickName ) ) {
        socket.emit( WRONG_NICK_NAME_EVENT, 'Nick name not unique!' );
        socket.disconnect();
        return;
    }

    onlineUserList.connectUser( new cm.OnlineUser( nickName, socket) );
    io.emit( SVR_MSG_EVENT, JSON.stringify( new cm.Message( 'server', `${nickName} has connected` ) ) );
    io.emit( ONLINE_LIST_EVENT, JSON.stringify(  { onlineUserList: onlineUserList.getNickNames() } ) );

    socket.on( CLT_MSG_EVENT, ( message ) => {
        let tempObj = JSON.parse( message );
        
        socket.broadcast.emit( SVR_MSG_EVENT, JSON.stringify( new cm.Message( tempObj.nickName, tempObj.message ) ) );        
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

        onlineUserList.disconnectUser( user.nickName );
        io.emit( SVR_MSG_EVENT, JSON.stringify( new cm.Message( 'server', `${user.nickName} has disconnected` ) ) );        
        io.emit( ONLINE_LIST_EVENT, JSON.stringify( { onlineUserList: onlineUserList.getNickNames() } ) );
    });
});