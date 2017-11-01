/*
	====== Login.js ======
	Handles all login/logout of users and session managment
*/

// ====== Login ======
// Creates the Login Self Calling Function and returns an object

var Login = (function(){
	// ====== Private Variables ======
	var loginModalButton;
	var createModalButton;
	var userLoggedIn = false;
	var curUser;

	// ====== loginUser() ======
	/*
		loginUser will get the user information from the login-modal
		and login the user via Email and Password through Firebase
		Authentication
	*/
	function loginUser(){
		// Inputs
		var email = $("#login-email-input").val().trim();
		var password = $("#login-password-input").val();

		// Validate Input
		var valid = Login.validateInput([email, password]);

		// Alert
		var alertWin = $("#alert-login");

		// Login User if input is valid otherwise alert them to any issues.
		if(valid){
			firebase.auth().signInWithEmailAndPassword(email, password).then(function(user){
				alertWin.empty();
				$("#login-modal").modal("toggle");
				$("#alert-main").html('<p class="alert alert-success">Login Successful!</p>');
			}, function(err){
				alertWin.html("<p class='alert alert-danger'>" + err + "</p>");
			})
		} else {
			alertWin.html("<p class='alert alert-danger'>Please check your email and password.</p>");
		}
	}

	// ====== createUser() ======
	/*
		createUser will get the user information from the create-account-modal
		and create the user via Email and Password through Firebase
		Authentication as well as update their unique displayName for the game.
	*/
	function createUser(){
		// Inputs
		var username = $("#create-username-input").val();
		var email = $("#create-email-input").val().trim();
		var password = $("#create-password-input").val();

		// Validate Input
		var valid = Login.validateInput([email, password, username]);

		//Alert
		var alertWin = $("#alert-create");
		
		// Create User if input is valid or alert them to any issues.
		if(valid){
			firebase.auth().createUserWithEmailAndPassword(email, password).then(function(user){
				//console.log(user);
				curUser = user;
				curUser.updateProfile({displayName: username});
				alertWin.empty();
				logoutUser();
				windows.location.reload();
				$("#alert-main").html('<p class="alert alert-success">Account Successfully Created. Please Login</p>');
			},function(err){
				alertWin.html("<p class='alert alert-danger'>" + err + "</p>");
			});
		} else {
			alertWin.html("<p class='alert alert-danger'>Please check your username, email, and password.</p>");
		}
	}

	// ====== logoutUser() ======
	/*
		logoutUser will logout the user via Firebase
		Authentication.
	*/
	function logoutUser(){

		// Announce User status in the chat.
		var curUser = firebase.auth().currentUser;
		var message = curUser.displayName + " logged out.";
		firebase.database().ref("/chat").push({
			username: "system",
			message: message
		});

		// Log User out.
		firebase.auth().signOut().then(function(){
			$("#login-button").show();
			$("#create-button").show();
			$("#logout-button").hide();
		}, function(err){
			console.log("Sign out Error ", err);
		});
	}

	// Returns the Login Object with Public Interfaces.
	return{

		// ====== init() ======
		// Initialize Login and readies it for use.
		init: function(){
			
			// Firebase Authentication Listener to check for user state changes.
			firebase.auth().onAuthStateChanged(function(user){
				// If the user exists then we log them in otherwise they have logged out.
				if(user){
					curUser = firebase.auth().currentUser;
					$("#current-user").text(curUser.displayName);
					$("#login-button").hide();
					$("#create-button").hide();
					$("#logout-button").show();
					$("#logout-button").on("click", logoutUser);
					userLoggedIn = true;
					Chat.onUserLogin();
					Game.onUserLogin();

				} else {
					if(userLoggedIn){
						userLoggedIn = false;
						window.location.reload();
					}
				}

			});

			// Login Button
			loginModalButton = $("#login-email-button");

			// Logout Button
			$("#logout-button").hide();

			// Create Button
			createModalButton = $("#create-account-button");

			// Login Click Event
			loginModalButton.on("click", loginUser);

			// Create Click Event
			createModalButton.on("click", createUser);
			
		},

		// ====== validateInput() ======
		// Simple input validation. Checks to see if an input is empty or not. Returns true or false.
		validateInput: function(inputs){
			var validInput = true;
			inputs.forEach(function(input){
				if(input === ""){
					validInput = false;
					return validInput;
				} 
			});
			return validInput;
		}
	}
})();