'use strict';
const USER_DB_FILE = 'user-db.json';
const fs = require( 'fs' );
//--------------------------------------------------------------------------------
class UserDB {
	constructor() {
		this.userList = this.readFromFile();		
	}
	//--------------------------------------------------------------------------------
	getUser( nickname ) {
		let user;
        
	
		if ( user = this.userList.find( el => el.nickname.toLowerCase() === ( '' + nickname ).toLowerCase() ) ) {
			return user;
		}
		return undefined;
	}
	//--------------------------------------------------------------------------------
	addUser( user ) {
		if ( !this.userList.find( el => el.nickname.toLowerCase() === user.nickname.toLowerCase() ) ) {
			this.userList.push( user );
		}
		this.writeToFile();
	}
	//--------------------------------------------------------------------------------
	writeToFile() {
		fs.writeFileSync( USER_DB_FILE, JSON.stringify( this.userList )  );
	}
	//--------------------------------------------------------------------------------
	readFromFile() {
		try {
			let data = fs.readFileSync( USER_DB_FILE );
			let tempList = JSON.parse( data );

			return tempList.map( el => new User( el.nickname, el.password ) );
		}
		catch( err ) {
			return [];
		}
	}
}
//--------------------------------------------------------------------------------
class User {
	constructor( nickname, password ) {
		this.nickname = '' + nickname;
		this.password = '' + password;
	}
	//--------------------------------------------------------------------------------
	verifyPassword( password ) {
		return this.password === '' + password;
	}
}
//--------------------------------------------------------------------------------
module.exports = {
	UserDB,
	User
}