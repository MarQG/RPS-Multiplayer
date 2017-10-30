/*
	====== Game.js ======
	This is where the main game logic is. Handles setting up the game rooms
	and matching players to open game rooms. Preventing users from joining 
	game rooms if they are already a part of one and also running the game
	logic based on the state of the game room.
*/


var Game = (function(){

	var gameRef;

	const RPS = ["Barry Boulder", "Wafer-Thin Jim", "Steven Slicer"];

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
		//console.log("Game created");

		$("#game-results").html(
			"<p>Game Created. Waiting for someone to join...</p>");

		$("#create-game").hide();
		//$("#leave-game").show();
	}

	function gameWatcher(key){
		var currentGameRef = gameRef.child(key);
		currentGameRef.on("value", function(snapshot){

			var curGame = snapshot.val();
			//console.log("Game Updated", curGame);

			if(!curGame){
				console.log("Game ended play again!");
				$("#create-game").show();
				return;
				
			}
			switch(curGame.state){
				case STATE.GAME_JOINED_STATE:
					playerJoined(currentGameRef, curGame);
					displayChoices(currentGameRef, curGame);
					break;
				case STATE.GAME_PLAYER_ONE_STATE:
					//console.log("Player One Choice Made");
					displayChoices(currentGameRef, curGame);
					break;
				case STATE.GAME_PLAYER_TWO_STATE:
					//console.log("Player Two Choice Made");
					checkWinner(currentGameRef, curGame);
					break;
				case STATE.GAME_COMPLETED_STATE:
					//console.log("Game Completed");
					showWinner(currentGameRef, curGame);
					break;

			}

			//console.log("game watcher running...");
		}, function(err){
			console.log("Game Watcher Error: " + err);
		});
	}

	function joinGameListener(){

		var joinList = gameRef.orderByChild('state').equalTo(STATE.GAME_OPEN_STATE);

		joinList.on("child_added", function(snapshot){

			var availableGames = snapshot.val();
			//console.log("Game Added", availableGames);

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
			//console.log(snapshot.key);
			var joinBtn = $("#" + snapshot.key);

			if(joinBtn){
				joinBtn.remove();
			}

		}, function(err){
			console.log("Game Error: " + err);
		})
	}

	function joinGame(key){
			//console.log("Attempting to join a game", key);
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
						$("#game-results").html("<p>Joined " + snapshot.val().creator.cName  +"'s game.</p><p>Waiting for " + snapshot.val().creator.cName +" to make a choice...</p>");
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
		if(curGameKey.creator.cid === firebase.auth().currentUser.uid){
			$("#game-results").html("<p>Game has been joined by: " + curGameKey.joiner.jName +"</p>");
			//console.log("Player joined:");
		}		
	}

	function displayChoices(curGameRef, curGameKey){
		//console.log(curGameRef, curGameKey);
		if(curGameKey.state === STATE.GAME_JOINED_STATE && curGameKey.creator.cid === firebase.auth().currentUser.uid){
			$("#player-one").append("<p>Choose your knight:</p>");
			$.each(RPS, function(index, value){
				var rpsBtn = $("<button>");
				var img = $("<img>");
				rpsBtn.addClass("btn btn-primary p1");
				if(RPS[index] === RPS[1]){
					img.addClass("selection-image paper");
				}
				if(RPS[index] === RPS[0]){
					img.addClass("selection-image rock");
				}
				if(RPS[index] === RPS[2]){
					img.addClass("selection-image scissor");
				}
				rpsBtn.attr({
					"id": curGameRef.key,
					"data-choice": RPS[index]
				});
				rpsBtn.html(img);
				$("#player-one").append(rpsBtn);


			});

			$(".p1").on("click", function(){
				curGameRef.update({
					state: STATE.GAME_PLAYER_ONE_STATE,
					"creator/choice": $(this).attr("data-choice")
				});
				$("#game-results").html("<p>Choice made.</p><p>Waiting on " + curGameKey.joiner.jName + " to make a choice...</p>");
				$("#player-one").empty();
				//$("#game-results").html("<p>" + curGameKey.creator.cName  +"'s choice made.</p>");
			});
		} else if(curGameKey.state === STATE.GAME_PLAYER_ONE_STATE && curGameKey.joiner.jid === firebase.auth().currentUser.uid){
			$("#game-results").html("<p>" + curGameKey.creator.cName + " choice made.</p>");
			$("#player-two").append("<p>Choose your knight:</p>");
			$.each(RPS, function(index, value){
				var rpsBtn = $("<button>");
				var img = $("<img>");
				rpsBtn.addClass("btn btn-primary p2");
				if(RPS[index] === RPS[1]){
					img.addClass("selection-image paper");
				}
				if(RPS[index] === RPS[0]){
					img.addClass("selection-image rock");
				}
				if(RPS[index] === RPS[2]){
					img.addClass("selection-image scissor");
				}
				rpsBtn.attr({
					"id": curGameRef.key,
					"data-choice": RPS[index]
				});
				rpsBtn.html(img);
				$("#player-two").append(rpsBtn);
			});

			$(".p2").on("click", function(){
				curGameRef.update({
					state: STATE.GAME_PLAYER_TWO_STATE,
					"joiner/choice": $(this).attr("data-choice")
				});
				$("#player-two").empty();
				//$("#game-results").html("<p>" + curGameKey.joiner.jName  +"'s choice made.</p>");
			});
		}
	}

	function checkWinner(curGameRef, curGameKey){

		if(curGameKey.creator.choice === curGameKey.joiner.choice){
			curGameRef.update({
				winner: "Draw",
				state: STATE.GAME_COMPLETED_STATE
			});
		} else if( curGameKey.creator.choice === RPS[0] && curGameKey.joiner.choice === RPS[2]){
			curGameRef.update({
				winner: curGameKey.creator.cName,
				state: STATE.GAME_COMPLETED_STATE
			});
		} else if( curGameKey.creator.choice === RPS[0] && curGameKey.joiner.choice === RPS[1]){
			curGameRef.update({
				winner: curGameKey.joiner.jName,
				state: STATE.GAME_COMPLETED_STATE
			});
		} else if( curGameKey.creator.choice === RPS[1] && curGameKey.joiner.choice === RPS[0]){
			curGameRef.update({
				winner: curGameKey.creator.cName,
				state: STATE.GAME_COMPLETED_STATE
			});
		} else if( curGameKey.creator.choice === RPS[1] && curGameKey.joiner.choice === RPS[2]){
			curGameRef.update({
				winner: curGameKey.joiner.jName,
				state: STATE.GAME_COMPLETED_STATE
			});
		} else if( curGameKey.creator.choice === RPS[2] && curGameKey.joiner.choice === RPS[1]){
			curGameRef.update({
				winner: curGameKey.creator.cName,
				state: STATE.GAME_COMPLETED_STATE
			});
		} else if( curGameKey.creator.choice === RPS[2] && curGameKey.joiner.choice === RPS[0]){
			curGameRef.update({
				winner: curGameKey.joiner.jName,
				state: STATE.GAME_COMPLETED_STATE
			});
		}


	}

	function showWinner(curGameRef, curGameKey){
		//console.log("show winner ran");
		if(curGameRef != undefined){
			console.log("print winner");
			$("#game-results").html(
			"<p>" + curGameKey.creator.cName + " picked " + curGameKey.creator.choice + "</p>"+
			"<p>" + curGameKey.joiner.jName + " picked " + curGameKey.joiner.choice + "</p>"+
			"<p>The Winner is " + curGameKey.winner + "</p>");
			//console.log(curGameRef);
			curGameRef.remove();
			//console.log(curGameRef);
			$("#create-game").show();
			$("#join-window").show();

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

		},

		onUserLogin: function(){
			$("#create-game").prop("disabled", false);
		}
	}
})();