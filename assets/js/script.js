init();

function init() {
  const searchButton = document.querySelector("#search");
  searchButton.addEventListener("click", search);
}

function search() {

}
//Create the variable for map
let map;

//Renders the map to the page with a default position with the center of Australia displayed
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -25.274, lng: 133.775 },
    zoom: 4,
  });
}

//Add an event listener to the form element for the submit event 

//Submit event handler function
function onPostcodeSubmit() {
  //prevent default behaviour

  //send a request to the map to show charities near the postcode
}


