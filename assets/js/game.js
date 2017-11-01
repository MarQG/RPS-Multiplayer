/*
	====== Game.js ======
	This is where the main game logic is. Handles setting up the game rooms
	and matching players to open game rooms. Preventing users from joining 
	game rooms if they are already a part of one and also running the game
	logic based on the state of the game room.
*/

// ====== Game ======
// Creates the Game Self Calling Function and returns an object
var Game = (function(){
	// ====== Private Variables ======
	var gameRef;

	const RPS = ["Barry Boulder", "Wafer-Thin Jim", "Steven Slicer"];

	const STATE = {
		GAME_OPEN_STATE: "OPEN",
		GAME_JOINED_STATE: "JOINED",
		GAME_PLAYER_ONE_STATE: "PLAYER_ONE_CHOICE",
		GAME_PLAYER_TWO_STATE: "PLAYER_TWO_CHOICE",
		GAME_COMPLETED_STATE: "COMPLETED",
	}

	// ====== createGame() ======
	/*
		createGame creates a new game in the /game reference on the
		Firebase Real-Time Database and setup two watchers. The first
		watcher is onDisconnect() and will remove the game if the 
		User that created it disconnects. The second is the gameWatcher
		and will beging watching the new Game for state changes and update
		the Game Creator's screen with information based on the state.
	*/
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

		$("#game-results").html(
			"<p>Game Created. Waiting for someone to join...</p>");

		$("#create-game").hide();
	}

	// ====== gameWatcher(key) ======
	/*
		gameWatcher takes a unique Game key and watches it for state changes.
		This is how we tie two unique Users to one unique Game and lock them in.
		This will continue watching based on the state and progress the game until
		completion upon which it will update the Users displays accordingly and
		allow them to make a new game afterwards. 
		TODO: Catch the Error thrown by Firebase when checking the state of the Game
		after it has been removed.
	*/
	function gameWatcher(key){

		var currentGameRef = gameRef.child(key);

		currentGameRef.on("value", function(snapshot){

			var curGame = snapshot.val();
			
			if(!curGame){
				$("#create-game").show();
				return;	
			}

			switch(curGame.state){
				case STATE.GAME_JOINED_STATE:
					playerJoined(currentGameRef, curGame);
					displayChoices(currentGameRef, curGame);
					break;
				case STATE.GAME_PLAYER_ONE_STATE:
					displayChoices(currentGameRef, curGame);
					break;
				case STATE.GAME_PLAYER_TWO_STATE:
					checkWinner(currentGameRef, curGame);
					break;
				case STATE.GAME_COMPLETED_STATE:
					showWinner(currentGameRef, curGame);
					break;

			}
		}, function(err){
			console.log("Game Watcher Error: " + err);
		});
	}

	// ====== joinGameListener() ======
	/*
		joinGameListener checks the state of /games for any Games with
		a state of OPEN. If it is OPEN it will display them to any user
		that is currently not the Game's Creator. This ensure that the same
		User cannot join their own game and also won't show Games that are
		currently being played to other Users. This is the primary 
		matchmaking function and how players connect to each other to play
		a game. It will also remove any Games that have been joined.
	*/
	function joinGameListener(){

		var joinList = gameRef.orderByChild('state').equalTo(STATE.GAME_OPEN_STATE);

		joinList.on("child_added", function(snapshot){

			var availableGames = snapshot.val();

			if(availableGames.creator.cid != firebase.auth().currentUser.uid){
				var joinBtn = $("<button>");
				joinBtn.addClass("btn btn-lg btn-primary join");
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

	// ====== joinGame() ======
	/*
		joinGame attempts to connect a joining player to an available Game.
		So long as the game doesn't have a joiner then the player
		clicking join will be able to join that game. If by chance
		two Users click the same game only one will be allowed to
		join. After the joiner has been commited to the game we update
		the display.
	*/
	function joinGame(key){
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
						$("#game-results").html("<p>Game Already Full. Please select another one.</p>");
					}
				}else {
					console.log("Game error: " + err);
				}
			});
	}

	// ====== playerJoined(curGameRef, curGameKey) ======
	/*
		playerJoined takes the current game reference as a key to the Game
		and a current game key to the specifics of the Game and updates
		the Game Creator when another player has joined their Game.
	*/
	function playerJoined(curGameRef, curGameKey){
		if(curGameKey.creator.cid === firebase.auth().currentUser.uid){
			$("#game-results").html("<p>Game has been joined by: " + curGameKey.joiner.jName +"</p>");
		}		
	}

	// ====== displayChoices(curGameRef, curGameKey) ======
	/*
		displayChoices takes the current game reference as a key to the Game
		and a current game key to the specifics of the Game and displays the 
		game choices based on the current Game state and which User's turn it
		is.
	*/
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
			});

		} else if(curGameKey.state === STATE.GAME_PLAYER_ONE_STATE && curGameKey.joiner.jid === firebase.auth().currentUser.uid){
			$("#game-results").html("<p>" + curGameKey.creator.cName + "'s choice made.</p>");
			
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

			});
		}
	}

	// ====== checkWinner(curGameRef, curGameKey) ======
	/*
		checkWinner takes the current game reference as a key to the Game
		and a current game key to the specifics of the Game and checks 
		the Game Creator's Choice vs the Joining Player's Choice using
		the rules of Rock Paper Scissors to determine the winner. This
		is based on the choices in the const RPS array. Game Logic
			if Creator Choice === Joiner Choice {
				game is a draw
			} else if Creator Rock === Joiner Scissors {
				winner is Creator
			} else if Creator Rock === Joiner Paper {
				winner is Joiner
			} else if Creator Paper === Joiner Rock {
				winner is Creator
			} else if Creator Paper === Joiner Scissor {
				winner is Joiner
			} else if Creator Scissor === Joiner Paper {
				winner is Creator
			} else if Creator Scissor === Joiner Rock {
				winner is Joiner
			}
		After the winner is determined it will update the Game state to COMPLETED.
	*/
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

	// ====== showWinner(curGameRef, curGameKey) ======
	/*
		showWinner takes the current game reference as a key to the Game
		and a current game key to the specifics of the Game and displays the 
		Winner of the Game. It will show Player Choices and the results of the
		Game. It will then allow the Users to join any new Games or Create another
		Game to play again.
	*/
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

	// Returns the Game Object with Public Interfaces.
	return{

		// ====== init() ======
		// Initialize Game and readies it for use.
		init: function(){

			// Sets the Firebase Database Reference to /games
			gameRef = firebase.database().ref("/games");

			// Turns on the joinGameListener
			joinGameListener();

			// Click Listener for the Create Game Button
			$("#create-game").on("click", function(){
				createGame();
				$("#join-window").hide();
			});

		},

		// ====== onUserLogin() ======
		// Enables the Create Game button when a User has logged in.
		onUserLogin: function(){
			$("#create-game").prop("disabled", false);
		}
	}
})();