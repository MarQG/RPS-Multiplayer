/*
	====== Login.js ======
	Handles all login logout of users and session managment
*/

var Login = (function(){
	var loginModalButton;
	var createModalButton;
	var userLoggedIn = false;

	var curUser;




	function loginUser(){
		var email = $("#login-email-input").val().trim();
		var password = $("#login-password-input").val();
		var valid = Login.validateInput([email, password]);
		var alertWin = $("#alert-login");
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

	function createUser(){
		var username = $("#create-username-input").val();
		var email = $("#create-email-input").val().trim();
		var password = $("#create-password-input").val();
		var valid = Login.validateInput([email, password, username]);
		var alertWin = $("#alert-create");
		
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

	function logoutUser(){
		var curUser = firebase.auth().currentUser;
		var message = curUser.displayName + " logged out.";
		firebase.database().ref("/chat").push({
			username: "system",
			message: message
		});
		firebase.auth().signOut().then(function(){
			console.log("Signed Out");
			$("#login-button").show();
			$("#logout-button").hide();
		}, function(err){
			console.log("Sign out Error ", err);
		});
	}

	return{
		init: function(){
			//userLoggedIn = false;

			firebase.auth().onAuthStateChanged(function(user){
				//console.log(user);
				if(user){
					curUser = firebase.auth().currentUser;
					$("#current-user").text(curUser.displayName);
					$("#login-button").hide();
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