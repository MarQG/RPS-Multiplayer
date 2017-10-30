/*
	====== Chat.js ======
	Setups and processes the Chat Functionality
*/



var Chat = (function(){
	var chatInput;
	var chatSendButton;
	var ref;
	
	function sendChat(){
		chatInput.prop("disabled", true);
		chatSendButton.prop("disabled", true);

		var message = chatInput.val();
		var curUser = firebase.auth().currentUser;
		ref.push({
			username: curUser.displayName,
			message: message
		});

		chatInput.val("");

		chatInput.prop("disabled", false);
		chatSendButton.prop("disabled", false);
	}

	function announceChat(){

		var curUser = firebase.auth().currentUser;
		var message = curUser.displayName + " logged in.";
		ref.push({
			username: "system",
			message: message
		});
	}

	function loadChat(){
		ref.limitToLast(25).on("child_added", function(snapshot){
				var curUser = firebase.auth().currentUser;
				var li = $("<li>");
				if(curUser != null){
					//console.log("User is present")
					console.log
					if(curUser.displayName === snapshot.val().username){
						li.addClass("user-message");
					} else {
						//console.log("User is not present");
						li.addClass("default-message");
					}
				} else {
					li.addClass("default-message");
				}
				
				
				li.html("<p> " + snapshot.val().message + "</p>" +
					"<footer>" + snapshot.val().username + "</footer>");
				
				// TODO: Clear the currently displayed elements to limit it to 25 messages display only irregardless of page refresh.
				$("#chat-window").append(li);
				
				$("#chat-window").get(0).scrollTop = $("#chat-window").get(0).scrollHeight;
				
			},function(err){
				console.log("Error occured: " + err);
		});

	}

	return{
		init: function(){
			chatInput = $("#chat-input");
			chatSendButton = $("#chat-send");
			ref = firebase.database().ref("/chat");
			

			chatSendButton.on("click", function(e){
				e.preventDefault();
				sendChat();
			});

			//loadChat();

		},

		onUserLogin: function(){
			chatInput.prop("disabled", false);
			chatSendButton.prop("disabled", false);
			loadChat();
			//Disabled until reload work around can be found.
			//announceChat();

		}
	}
})();