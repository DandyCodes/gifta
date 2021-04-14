let map;

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -25.274, lng: 133.775 },
    zoom: 4,
  });
}
