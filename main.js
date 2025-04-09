// -----------------------------
// CODE THAT LOADS THE HVAC PARTS (FROM FIRESTORE)
// -----------------------------

var db = firebase.firestore();

db.collection("parts")
	.limit(10)
	.get()
	.then((querySnapshot) => {
		querySnapshot.forEach((doc) => {
			const data = doc.data();
			const partArray = [
				doc.id,
				data.imageURL,
				data.Manufacturer,
				data.Model,
				data.Type,
				data.Price,
				data.Availability,
				data.Orders,
			];
			drawDiv(partArray);
		});
	});

function drawDiv(divData) {
	if (divData == null) return null;
	let partNum = divData[0].trim();
	let imgURL = divData[1].trim();
	let mfr = divData[2].trim();
	let model = divData[3].trim();
	let type = divData[4].trim();
	let price = "$" + Number(divData[5]).toFixed(2);
	let avail = divData[6].trim();
	let orders = String(divData[7]).trim();

	var newPartsDiv = document.createElement("div");
	newPartsDiv.className = "catalog-part";
	newPartsDiv.setAttribute("mfr", mfr);
	newPartsDiv.setAttribute("model", model);

	var partImg = document.createElement("img");
	partImg.setAttribute("src", "https://" + imgURL);
	newPartsDiv.appendChild(partImg);

	var newOverlayDiv = document.createElement("div");
	newOverlayDiv.className = "overlay";

	var link = document.createElement("a");
	link.className = "part-ref";
	link.setAttribute("href", "#");
	link.textContent = mfr + " #" + partNum;

	var newOverlayDivP = document.createElement("p");
	newOverlayDivP.appendChild(link);
	newOverlayDivP.appendChild(document.createElement("br"));
	newOverlayDivP.appendChild(document.createTextNode(orders + " Orders"));
	newOverlayDivP.appendChild(document.createElement("br"));
	newOverlayDivP.appendChild(document.createTextNode(price + " " + avail));

	var reviewContainer = document.createElement("span");
	reviewContainer.id = "review-" + partNum;

	newOverlayDiv.appendChild(newOverlayDivP);
	newPartsDiv.appendChild(newOverlayDiv);
	newOverlayDivP.appendChild(reviewContainer);

	document.getElementById("parts-content").appendChild(newPartsDiv);
	postReviews(partNum);
}

function postReviews(drawnpartNum) {
	let totalRating = 0;
	let numReviews = 0;

	var review_file_path = "/parts/" + drawnpartNum + "/reviews";

	return db
		.collection(review_file_path)
		.get()
		.then((querySnapshot) => {
			querySnapshot.forEach((doc) => {
				totalRating += doc.data().rating;
				numReviews++;
			});
			return { totalRating, numReviews };
		})
		.then(({ totalRating, numReviews }) => {
			const avgRating = totalRating / numReviews;
			const roundedRating = Math.floor(avgRating);
			reviewsTargetID = "review-" + drawnpartNum;
			const reviewEl = document.getElementById(reviewsTargetID);
			reviewEl.innerHTML = "<br>" + numReviews + " Reviews<br>";
			displayStars(roundedRating, reviewsTargetID);
		})
		.catch((error) => {
			console.error("Error fetching reviews:", error);
		});
}

document
	.getElementById("parts-content")
	.addEventListener("click", function (event) {
		if (event.target.classList.contains("part-ref")) {
			const pn = event.target.textContent;
			localStorage.setItem("part-index", pn);
			console.log("the PN is " + localStorage.getItem("part-index"));
			window.location.href = "detail.html";
		}
	});

function displayStars(rating, elementId) {
	const container = document.getElementById(elementId);
	if (!container) return;
	console.log('display stars firing');

	const fullStars = Math.floor(rating);
	const hasHalfStar = rating % 1 >= 0.5;
	const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

	for (let i = 0; i < fullStars; i++) {
		const star = document.createElement("span");
		star.className = "fa fa-star checked";
		container.appendChild(star);
	}

	if (hasHalfStar) {
		const halfStar = document.createElement("span");
		halfStar.className = "fa fa-star-half-o checked";
		container.appendChild(halfStar);
	}

	for (let i = 0; i < emptyStars; i++) {
		const star = document.createElement("span");
		star.className = "fa fa-star";
		container.appendChild(star);
	}
}

// -----------------------------
// AUTHENTICATION AND ACCOUNT MANAGEMENT CODE VIA FIREBASE AUTH SERVICE
// -----------------------------

document.getElementById('login-trigger').addEventListener('click', authUser);

function authUser() {
	handle_auth();
}

document.getElementById('register-link').addEventListener('click', onReg);

function onReg() {
	document.getElementById('loginForm').style.display = "none";
	document.getElementById('registerForm').style.display = "block";
}

document.getElementById('forgotten-link').addEventListener('click', onForget);

function onForget() {
	document.getElementById('forgottenForm').style.display = "block";
	document.getElementById('before-reset').style.display = "block";
	document.getElementById('loginForm').style.display = "none";
}

function handle_auth() {
	var user = firebase.auth().currentUser;
	console.log("dealing with " + user);

	if (!user) {
		ltState = document.getElementById('login-content').style.display;
		console.log(ltState);
		if (ltState == "block") {
			document.getElementById('login-content').style.display = "none";
		} else {
			document.getElementById('login-content').style.display = "block";
			document.getElementById('registerForm').style.display = "none";
			document.getElementById('before-reset').style.display = "none";
			document.getElementById('after-reset').style.display = "none";
			document.getElementById('if-error').style.display = "none";
			document.getElementById('loginForm').style.display = "block";
		}
	} else {
		firebase.auth().signOut().then(function () {
			console.log("Signed out " + user.email);
		}).catch(function (error) {
			alert("Something went wrong.");
		});
		document.getElementById("auth-text").innerHTML = "Log In";
	}
}

const loginForm = document.getElementById('loginForm');
loginForm.addEventListener('submit', loginUser);

function loginUser() {
	console.log("attempting to login user");

	email = document.getElementById("login_email").value;
	pwd = document.getElementById("login_pwd").value;

	firebase.auth().signInWithEmailAndPassword(email, pwd).then(function () {
		document.getElementById("loginForm").reset();
	}, function (error) {
		var errorMessage = error.message;
		alert(errorMessage);
	});
}

const registerForm = document.getElementById('registerForm');
registerForm.addEventListener('submit', registerUser);

function registerUser() {
	console.log("I'll try to register this user");

	email = document.getElementById("register_email").value;
	pwd = document.getElementById("register_pwd").value;
	rePwd = document.getElementById("register_re_pwd").value;

	if (pwd != rePwd) {
		document.getElementById("reg-error-response").innerHTML = "Error: passwords do not match.";
		document.getElementById('if-reg-error').style.display = "block";
	} else {
		firebase.auth().createUserWithEmailAndPassword(email, pwd).then(function (user) {
			if (user) {
				document.getElementById("registerForm").reset();
			}
		}, function (error) {
			var errorMessage = error.message;
			document.getElementById("reg-error-response").innerHTML = errorMessage;
			document.getElementById('if-reg-error').style.display = "block";
		});
	}
}

const forgottenForm = document.getElementById('forgottenForm');
forgottenForm.addEventListener('submit', recoverPassword);

function recoverPassword() {
	email = document.getElementById("recovery_email").value;

	firebase.auth().sendPasswordResetEmail(email).then(function () {
		console.log("sending recovery to " + email);
		document.getElementById('before-reset').style.display = "none";
		document.getElementById('after-reset').style.display = "block";
		document.getElementById("forgottenForm").reset();
	}).catch(function (error) {
		var errorMessage = error.message;
		document.getElementById("error-response").innerHTML = errorMessage;
		document.getElementById('if-error').style.display = "block";
	});
}

const loginAgain = document.getElementById('loginAgain');
loginAgain.addEventListener('click', fromForgot);

function fromForgot() {
	document.getElementById('after-reset').style.display = "none";
	document.getElementById('login-content').style.display = "block";
	document.getElementById('loginForm').style.display = "block";
}

firebase.auth().onAuthStateChanged(function (user) {
	if (user) {
		console.log("welcoming now..." + user.email);
		document.getElementById("auth-text").innerHTML = "Log Out";
		document.getElementById('login-content').style.display = "none";
	} else {
		console.log('No user is signed in');
	}
	console.log('end of onAuthState...');
});

// -----------------------------
// CODE THAT FILTERS THE PARTS
// -----------------------------

const goButton = document.getElementById('go-btn');
goButton.addEventListener('click', filterParts);

function filterParts() {
	console.log('go!');

	selMfr = document.getElementById('ddMfr').value;
	selModel = document.getElementById('ddModel').value;
	console.log("the selected mfr is " + selMfr + ", and the selected model is " + selModel);

	var parts = document.getElementsByClassName("catalog-part");
	for (var i = 0; i < parts.length; i++) {
		parts.item(i).style.display = "block";
		if ((selMfr != parts.item(i).getAttribute('mfr')) && (selMfr != "All")) {
			console.log("mfr diff");
			parts.item(i).style.display = "none";
		}
		if ((selModel != parts.item(i).getAttribute('model')) && (selModel != "All")) {
			console.log("model diff");
			parts.item(i).style.display = "none";
		}
	}
}
