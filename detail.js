// Creates an instance of the DB using the Firebase SDK
var db = firebase.firestore();
// Global variable to store the part number
var partnum = "";

// Single DOMContentLoaded event listener for all initialization
document.addEventListener('DOMContentLoaded', function() {
    // Get just the part number that the user clicked on in the parts search page
    var partIndex = localStorage.getItem("part-index");
    if (!partIndex) {
        console.error("No part index found in localStorage");
        return;
    }
    
    // Set the global partnum variable
    partnum = partIndex.split("#", 2)[1];
    console.log("incoming with part number " + partnum);

    // Define the file path for where the part data lives
    var part_file_path = "parts/" + partnum;

    // Go get the part data from the applicable document in Firestore
    db.doc(part_file_path)
        .get()
        .then(function (docSnapshot) {
            if (!docSnapshot.exists) {
                console.error("No document found for part:", partnum);
                return;
            }
            
            var part = docSnapshot.data();
            var id = docSnapshot.id;

            // Render the specific part information on the page
            document.getElementById("partnum").textContent = "Part #: " + id;
            document.getElementById("availability").textContent = "Availability: " + part.Availability;
            document.getElementById("orders").textContent = "Orders (90 day): " + part.Orders;
            document.getElementById("price").textContent = "Price: $" + parseFloat(part.Price).toFixed(2);
            document.getElementById("part-title").textContent = part.Manufacturer + " " + part.Model + " " + part.Type;
            document.getElementById("part-img").setAttribute("src", "https://" + part.imageURL);

            // Initialize the stars and number of ratings
            var review_file_path = "parts/" + partnum + "/reviews";
            postReviews(review_file_path);
        })
        .catch(function(error) {
            console.error("Error getting document:", error);
        });
        
    // Set up event listeners for review functionality
    const reviewSignifier = document.getElementById("review-signifier");
    if (reviewSignifier) {
        reviewSignifier.addEventListener("click", handleReviewClick);
    }
    
    const modLink = document.getElementById("mod-link");
    if (modLink) {
        modLink.addEventListener("click", handleModifyReviewClick);
    }
    
    // Set up authentication state listener
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            console.log("seeing user " + user.email);
            
            // Set the review file path for retrieving reviews
            var review_file_path = "parts/" + partnum + "/reviews";
            console.log("Checking for user review in path:", review_file_path);
            
            var reviews = db.collection(review_file_path);

            reviews
                .where("user", "==", user.uid)
                .get()
                .then(function (querySnapshot) {
                    if (!querySnapshot.empty) {
                        console.log(
                            "I see you have a review; in fact, " +
                            querySnapshot.size +
                            " review/s"
                        );

                        document.getElementById("review-title").textContent = "Your Review";
                        document.getElementById("review-signifier").style.display = "none";

                        querySnapshot.forEach(function (doc) {
                            var userReview = doc.data();
                            var userRating = userReview.rating;
                            console.log("The rating is " + userRating);

                            displayStars(userRating, "user-star-rating");
                            document.getElementById("mod-link").style.display = "block";
                        });
                    } else {
                        console.log("No existing review found for this user");
                    }
                })
                .catch(function(error) {
                    console.error("Error checking for user review:", error);
                });
        } else {
            console.log("no user");
            document.getElementById("user-reviews").style.display = "none";
        }
    });
});

function postReviews(reviewFilePath) {
  let totalRating = 0;
  let numReviews = 0;

  return db
    .collection(reviewFilePath)
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
      displayStars(roundedRating, "star-rating");
      document.getElementById("numReviews").textContent =
        numReviews + " Reviews";
    })
    .catch((error) => {
      console.error("Error fetching reviews:", error);
    });
}

// Define the function that handles the review submission logic
function handleReviewClick(e) {
  if (e.target && e.target.matches("input.star")) {
    var rating = parseInt(e.target.id.split("-")[1], 10);
    selectedRating = rating;
    console.log("User selected rating: " + rating);
    addReview(partnum, rating);
  }
}

// Define the function that handles the review submission logic
function handleModifyReviewClick(e) {
  // Prevent default behavior
  e.preventDefault();
  
  // Show the review signifier and hide the modify link
  document.getElementById("review-signifier").style.display = "block";
  document.getElementById("mod-link").style.display = "none";
  document.getElementById("review-title").textContent = "Review this item";
  document.getElementById("user-star-rating").style.display = "none";
  
  // Add event listeners to the star inputs
  const starInputs = document.querySelectorAll('input.star');
  starInputs.forEach(input => {
    input.addEventListener('change', function() {
      const rating = parseInt(this.id.split("-")[1], 10);
      console.log("User selected rating for modification: " + rating);
      addReview(partnum, rating);
    });
  });
}

// Function to afford the user adding a review
function addReview(part_num, rating) {
  console.log("Adding review for part:", part_num, "with rating:", rating);
  var review_file_path = "parts/" + part_num + "/reviews";
  var userId = firebase.auth().currentUser.uid;
  var docref = db.collection(review_file_path).doc(userId);
  docref
    .set(
      {
        partnum: part_num,
        rating: rating,
        user: userId,
        emailAddress: firebase.auth().currentUser.email,
      },
      { merge: true },
    )
    .then(function () {
      // Handle successful update
      console.log("Review added successfully");
      document.getElementById("review-title").textContent = "Thanks for your review.";
      document.getElementById("review-signifier").innerHTML = "";
      displayStars(rating, "user-star-rating");
      
      // Show the modify link after a short delay
      setTimeout(function() {
        document.getElementById("mod-link").style.display = "block";
      }, 2000);
    })
    .catch(function(error) {
      console.error("Error adding review:", error);
    });
}

// Utility to display visual stars in a review
function displayStars(rating, elementId) {
  const container = document.getElementById(elementId);
  if (!container) return;
  container.innerHTML = "";

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
