/*
	====== Main.js ======

	Hooks together all of the main components of the application 
	together and runs it on the screen.
*/

// Initializes our Firebase Connection and App
firebase.initializeApp(Config.firebase);


// ====== resizeChat() ======
/*
	Resized the chat window based on the window size and will update it on any changes.
*/
function resizeChat(){
	$("#chat-window").height($(window).height() - 400);
	$(window).resize(function(){
		$("#chat-window").height($(window).height() - 400);
	});
	
}

// ====== Main.js Start ======
window.onload = function(){
	// Update Interface for User
	// TODO resizing game window
	resizeChat();

	// ====== Scripts ======
	// Initialize scripts for each component.

	Login.init();
	Chat.init();
	Game.init();

};