/*
	====== Main.js ======

	Hooks together all of the main components of the application 
	together and runs it on the screen.
*/
firebase.initializeApp(Config.firebase);

function resizeChat(){
	$("#chat-window").height($(window).height() - 400);
	$(window).resize(function(){
		$("#chat-window").height($(window).height() - 400);
	});
	
}


window.onload = function(){

	resizeChat();
	//Start Loading Each Script here
	//Login Script
	
	
	Login.init();
	Chat.init();

};