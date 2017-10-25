/*
	====== Main.js ======

	Hooks together all of the main components of the application 
	together and runs it on the screen.
*/
firebase.initializeApp(Config.firebase);

window.onload = function(){

	//Start Loading Each Script here
	//Login Script
	Login.init();

};