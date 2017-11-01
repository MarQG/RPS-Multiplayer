/*
	====== Chat.js ======
	Setups and processes the Chat Functionality
*/


// ====== Chat ======
// Creates the Chat Self Calling Function and returns an object
var Chat = (function(){

	// ====== Private Variables ======
	var chatInput;
	var chatSendButton;
	var ref;
	
	// ====== sendChat() ======
	/*
		sendChat will get the user chat input and push it to the database.
		Prevents the user from flooding the chat with more than one message
		at a time.
	*/
	function sendChat(){
		// Disables the Chat input and send.
		chatInput.prop("disabled", true);
		chatSendButton.prop("disabled", true);

		// Gets User Chat input and stores it in firebase
		var message = chatInput.val();
		var curUser = firebase.auth().currentUser;
		ref.push({
			username: curUser.displayName,
			message: message
		});

		// Clears the Chat input
		chatInput.val("");

		// Enables the Chat input and send again
		chatInput.prop("disabled", false);
		chatSendButton.prop("disabled", false);
	}

	// ====== announceChat() ======
	/*
		announceChat is used to send system related messages into the Chat.
		Currently only displays when a User logins.
	*/
	function announceChat(){
		// Announce to Chat when User Logs in.
		var curUser = firebase.auth().currentUser;
		var message = curUser.displayName + " logged in.";
		ref.push({
			username: "system",
			message: message
		});
	}

	// ====== loadChat() ======
	/*
		loadChat setups a listener that will load new chat messages.
		It is limited to loading the most recent 25 at User Login.
	*/
	function loadChat(){
		// Firebase Database Listener that will check /chat for any new child_added and display them in the Chat Window

		ref.limitToLast(25).on("child_added", function(snapshot){

				// Get the Current User
				var curUser = firebase.auth().currentUser;
				var li = $("<li>");
				// If the User is present then we will check who they are.
				// Else we will display them as default.
				if(curUser != null){
					// Checks if the current User is the message owner change their message style.
					// Else show it as default.
					if(curUser.displayName === snapshot.val().username){
						li.addClass("user-message");
					} else {
						li.addClass("default-message");
					}
				} else {
					li.addClass("default-message");
				}
				
				// Load the message into the new li
				li.html("<p> " + snapshot.val().message + "</p>" +
					"<footer>" + snapshot.val().username + "</footer>");
				
				// Append it to the Chat Window
				$("#chat-window").append(li);
				
				// Snap the Chat Window up to show the newest message.
				$("#chat-window").get(0).scrollTop = $("#chat-window").get(0).scrollHeight;
				
			},function(err){
				// Log any errors.
				console.log("Error occured: " + err);
		});

	}

	// Returns the Login Object with Public Interfaces.
	return{

		//// ====== init() ======
		// Initialize Chat and readies it for use.
		init: function(){
			// Inputs
			chatInput = $("#chat-input");
			chatSendButton = $("#chat-send");

			// Set Firebase Database Reference
			ref = firebase.database().ref("/chat");
			
			// Set Click Listener on Chat Send
			chatSendButton.on("click", function(e){
				e.preventDefault();
				sendChat();
			});

		},

		//// ====== onUserLogin() ======
		// Enables the Chat Window and Inputs once the User is logged in.
		onUserLogin: function(){
			chatInput.prop("disabled", false);
			chatSendButton.prop("disabled", false);
			loadChat();
			announceChat();

		}
	}
})();