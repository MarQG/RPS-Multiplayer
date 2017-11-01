/*
	====== Config.js ======
	Setups the configurations of the Firebase App
*/

// Creates a Self Calling Config() that returns the firebase config in an object.
Config = function(){
	return{
		// Initialize Firebase
		  firebase: {
		    apiKey: "AIzaSyA1M6R4AuuPMoW_O4EZHnYpvnPlZZVKW8I",
		    authDomain: "rps-multi-da615.firebaseapp.com",
		    databaseURL: "https://rps-multi-da615.firebaseio.com",
		    projectId: "rps-multi-da615",
		    storageBucket: "rps-multi-da615.appspot.com",
		    messagingSenderId: "561556180428"
		  }
	}
}();