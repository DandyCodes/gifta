//Create the variable for map
let map;
let placesService;
let infowindow;
let markers = [];

init();

function init() {
  const searchButton = document.querySelector("#search");
  searchButton.addEventListener("click", search);
}

//Renders the map to the page with a default position with the center of Australia displayed
function initMap() {
  infowindow = new google.maps.InfoWindow();
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -25.274, lng: 133.775 },
    zoom: 4,
  });
}

function search(onClickEvent) {
  onClickEvent.preventDefault();
  markers.forEach((marker) => {
    marker.setMap(null);
  });
  markers = [];
  let searchTerms = [];
  const item = document.querySelector('#select').value.toLowerCase();
  charities.forEach(charity => {
    if(charity.items.includes(item)) {
      searchTerms.push(charity.nickName);
    }
  });
  // const rockingham = {lat: -32.278, lng: 115.735}
  searchTerms.forEach(searchTerm => {
    const placesServiceRequest = {
      query: searchTerm,
      fields: ["name", "geometry", "formatted_address"],
      // locationBias: rockingham
    };
    placesService = new google.maps.places.PlacesService(map);
    placesService.findPlaceFromQuery(placesServiceRequest, (places, responseStatus) => {
      if (responseStatus === google.maps.places.PlacesServiceStatus.OK && places) {
        createMarker(places[0])
        map.setCenter(places[0].geometry.location);
      }
    });
  });

  function createMarker(place) {
    if (!place.geometry || !place.geometry.location) return;
    const marker = new google.maps.Marker({
      map,
      position: place.geometry.location,
    });
    google.maps.event.addListener(marker, "click", () => {
      infowindow.setContent(place.name + ": " + place.formatted_address);
      infowindow.open(map, marker);
    });
    markers.push(marker);
  }
}

