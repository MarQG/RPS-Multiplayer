/*
	====== Login.js ======
	Handles all login logout of users and session managment
*/

var Login = (function(){
	var loginModalButton;
	var createModalButton;
	var userLoggedIn = false;




	function loginUser(){
		var email = $("#login-email-input").val().trim();
		var password = $("#login-password-input").val();
		var valid = Login.validateInput([email, password]);
		var alertWin = $("#alert-login");
		if(valid){
			firebase.auth().signInWithEmailAndPassword(email, password).then(function(user){
				console.log("signed in" + user);
				alertWin.empty();
				$("#login-modal").modal("toggle");
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
				console.log("User created and signed in Success" + user);
				user.updateProfile({displayName: username});
				alertWin.empty();
				$("#create-account-modal").modal("toggle");
			},function(err){
				alertWin.html("<p class='alert alert-danger'>" + err + "</p>");
			});
		} else {
			alertWin.html("<p class='alert alert-danger'>Please check your username, email, and password.</p>");
		}
	}

	function logoutUser(){
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

			firebase.auth().onAuthStateChanged(function(user){
				if(user){
					curUser = firebase.auth().currentUser;
					$("#current-user").text(curUser.displayName);
					userLoggedIn = true;
					$("#login-button").hide();
					$("#logout-button").show();
					$("#logout-button").on("click", logoutUser);
				} else {
					if(userLoggedIn){
						userLoggedIn = false;
						window.location.reload();
					}
				}
			})
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
				console.log(input);
				if(input === ""){
					validInput = false;
					return validInput;
				} 
			});
			return validInput;
		}
	}
})();