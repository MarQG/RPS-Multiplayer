/*
	====== Game.js ======
	This is where the main game logic is. Handles setting up the game rooms
	and matching players to open game rooms. Preventing users from joining 
	game rooms if they are already a part of one and also running the game
	logic based on the state of the game room.
*/


var Game = (function(){

	var gameRef;

	const STATE = {
		GAME_OPEN_STATE: "OPEN",
		GAME_JOINED_STATE: "JOINED",
		GAME_PLAYER_ONE_STATE: "PLAYER_ONE_CHOICE",
		GAME_PLAYER_TWO_STATE: "PLAYER_TWO_CHOICE",
		GAME_COMPLETED_STATE: "COMPLETED",
	}

	function createGame(){
		var curUser = firebase.auth().currentUser;

		var key = gameRef.push();
		key.set({
				creator: {
					cid: curUser.uid,
					cName: curUser.displayName,
				},
				state: STATE.GAME_OPEN_STATE
		});

		key.onDisconnect().remove();

		gameWatcher(key.key);
		console.log("Game created");

		gameCreated = true;

		$("#create-game").hide();
		$("#leave-game").show();
	}

	function gameWatcher(key){
		var currentGameRef = gameRef.child(key);
		currentGameRef.on("value", function(snapshot){

			var curGame = snapshot.val();
			console.log("Game Updated", curGame);

			if(!curGame){
				console.log("Game ended play again!");
				$("#create-game").show();
			}

			switch(curGame.state){
				case STATE.GAME_JOINED_STATE:
					console.log("Joined");
					break;
				case STATE.GAME_PLAYER_ONE_STATE:
					console.log("Player One Choice Made");
					break;
				case STATE.GAME_PLAYER_TWO_STATE:
					console.log("Player Two Choice Made");
					break;
				case STATE.GAME_COMPLETED_STATE:
					console.log("Game Completed");
					break;

			}
		})
	}

	function leaveGame(){
		var curUser = firebase.auth().currentUser;

		console.log("Game creator left the room");
		gameRef.orderByChild('gameCreator').equalTo(curUser.uid).
		once("value").then(function(snapshot){
			snapshot.forEach(function(childSnapshot){
				gameRef.child(childSnapshot.key).remove();
			});
		});	
		
		gameCreated = false;

		$("#leave-game").hide();
		$("#create-game").show();
	}

	function joinGameListener(){

		var joinList = gameRef.orderByChild('state').equalTo(STATE.GAME_OPEN_STATE);

		joinList.on("child_added", function(snapshot){

			var availableGames = snapshot.val();
			console.log("Game Added", availableGames);

			if(availableGames.creator.cid != firebase.auth().currentUser.uid){
				var joinBtn = $("<button>");
				joinBtn.addClass("btn btn-primary join");
				joinBtn.text("Join " + availableGames.creator.cName);
				joinBtn.id = availableGames.key;
				joinBtn.on("click", function(){
					console.log("You joined a game!");
				})
				$("#join-window").append(joinBtn);	
			}
		}, function(err){
			console.log("Game Error: " + err);
		});

		gameRef.on("child_removed", function(snapshot){

			var joinBtn = $("#" + snapshot.key);

			if(joinBtn){
				joinBtn.remove();
			}

		}, function(err){
			console.log("Game Error: " + err);
		})
	}


	return{

		init: function(){

			$("#leave-game").hide();

			gameRef = firebase.database().ref("/games");

			
			joinGameListener();



			$("#create-game").on("click", function(){
				createGame();
				$("#join-window").hide();
			});

			$("#leave-game").on("click", function(){
				leaveGame();
				$("#join-window").show();
			});
		}
	}
})();