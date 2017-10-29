/*
	====== Game.js ======
	This is where the main game logic is. Handles setting up the game rooms
	and matching players to open game rooms. Preventing users from joining 
	game rooms if they are already a part of one and also running the game
	logic based on the state of the game room.
*/


var Game = (function(){

	var gameRef;

	const RPS = ["R", "P", "S"];

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

		//gameCreated = true;

		$("#create-game").hide();
		//$("#leave-game").show();
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
					playerJoined(currentGameRef, curGame);
					displayChoices(currentGameRef, curGame);
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
		

		console.log("Game creator left the room");
		gameRef.orderByChild('gameCreator').equalTo(curUser.uid).
		once("value").then(function(snapshot){
			snapshot.forEach(function(childSnapshot){
				gameRef.child(childSnapshot.key).remove();
			});
		});	

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
				joinBtn.attr("id", snapshot.key); 
				joinBtn.on("click", function(){
					joinGame(snapshot.key);
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

	function joinGame(key){
			console.log("Attempting to join a game", key);
			var joiningPlayer = firebase.auth().currentUser;
			gameRef.child(key).transaction(function(game){
				if(!game.joiner){
					game.state = STATE.GAME_JOINED_STATE;
					game.joiner = {
						jid: joiningPlayer.uid,
						jName: joiningPlayer.displayName
					}
				}

				return game;
			}, function(error, commited, snapshot){
				if(commited){
					if(snapshot.val().joiner.jid === joiningPlayer.uid){
						$("#create-game").hide();
						$("#" + key).remove();
						gameWatcher(key);
					} else {
						console.log("Game already joined. Please Choose another");
					}
				}else {
					console.log("Game error: " + err);
				}
			});
	}

	function playerJoined(curGameRef, curGameKey){
		if(curGameKey.creator.cud === firebase.auth().currentUser.uid){
			console.log("Game has been joined by: " + curGameKey.joiner.jName);	
		}		
	}

	function displayChoices(curGameRef, curGameKey){
		console.log(curGameRef, curGameKey);
		if(curGameKey.state === STATE.GAME_JOINED_STATE && curGameKey.creator.cid === firebase.auth().currentUser.uid){

			$.each(RPS, function(index, value){
				var rpsBtn = $("<button>");
				rpsBtn.addClass("btn btn-primary p1");
				rpsBtn.attr({
					"id": curGameRef.key,
					"data-choice": RPS[index]
				});
				rpsBtn.text(RPS[index]);
				$("#player-one").append(rpsBtn);


			});

			$(".p1").on("click", function(){
				curGameRef.update({
					state: STATE.GAME_PLAYER_ONE_STATE,
					"creator/choice": $(this).attr("data-choice")
				});
				$("#player-one").empty();
			});
		} else if(curGameKey.state === STATE.GAME_PLAYER_ONE_STATE && curGameKey.joiner.id === firebase.auth().currentUser.uid){
			console.log("Player two make a choice!");
		}
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
				//leaveGame();
				$("#join-window").show();
			});
		}
	}
})();