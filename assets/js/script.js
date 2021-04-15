let map;
let markers;

init();

function init() {
    initMap();
    document.querySelector('#search').onclick = search;
}

function search(event) {
    event.preventDefault();
    fetch(`https://nominatim.openstreetmap.org/search?q=vinnies&countrycodes=au/`).then(response => {
        console.log(response);
    })
    return;
    const location = getCoords(-32.278, 115.735);
    markers.clearMarkers();
    markers.addMarker(new OpenLayers.Marker(location));
    map.setCenter(location);
}

function initMap() {
    map = new OpenLayers.Map("mapdiv");
    map.addLayer(new OpenLayers.Layer.OSM());
    const australia = getCoords(-25.274, 133.775);
    const zoom = 4;
    markers = new OpenLayers.Layer.Markers("Markers");
    map.addLayer(markers);
    map.setCenter(australia, zoom);
}

function getCoords(latitude, longitude) {
    return new OpenLayers.LonLat(longitude, latitude).transform(
        new OpenLayers.Projection("EPSG:4326"),
        map.getProjectionObject()
    );
}