let map;
let infowindow;
let markers = [];
let searches = [];
const startLocation = { lat: -25.274, lng: 133.775 }; // Center of Australia
const startZoom = 4;
const searchResultZoom = startZoom * 2.5;

init();

function init() {
  Array.from($("option")).forEach(option => {
    option.value = option.textContent.toLowerCase();
  });
  loadHistory();
  $("#search").click(search);
}

/* This is a callback invoked by the goolge maps API when the associated script loads
 It renders the map to the page with a default position - the center of Australia */
function initMap() {
  infowindow = new google.maps.InfoWindow();
  map = new google.maps.Map($("#map")[0], {
    center: startLocation,
    zoom: 4,
  });
}

function loadHistory() {
  searches = JSON.parse(localStorage.getItem("searches"));
  if (!searches) {
    searches = [];
  }
  searches.forEach(search => {
    createPreviousSearchButton(search.postcode, search.itemName);
  });
}

function createPreviousSearchButton(postcodeInputValue, selectedItemName) {
  const $previousSearchButton = $("<button>");
  $previousSearchButton.text(`${postcodeInputValue} - ${selectedItemName}`);
  $previousSearchButton.data("postcode", postcodeInputValue);
  $previousSearchButton.data("item", selectedItemName);
  $previousSearchButton.addClass("button is-justify-content-space-between");
  $previousSearchButton.click(clickEvent => {
    const postcode = $(clickEvent.target).data("postcode");
    const itemName = $(clickEvent.target).data("item");
    $("#postcode-input").val(postcode);
    $("#item-dropdown").val(itemName);
    search(clickEvent);
  });
  const $deleteButton = $("<button>");
  $deleteButton.addClass("delete");
  $deleteButton.click(clickEvent => {
    clickEvent.stopPropagation();
    const $parent = $(clickEvent.target).closest('.button');
    const postcode = $parent.data("postcode");
    const item = $parent.data("item");
    searches.forEach((search, index) => {
      if (search.postcode === postcode && search.itemName === item) {
        searches.splice(index, 1)
      }
    });
    localStorage.setItem("searches", JSON.stringify(searches));
    $parent.remove();
  })
  $previousSearchButton.append($deleteButton);
  $("#search-history").append($previousSearchButton);
}

function search(clickEvent) {
  clickEvent.preventDefault();
  const selectedItemName = $("#item-dropdown")[0].value.toLowerCase();
  if (selectedItemName === "select your category") return;
  clearMarkers();
  const postcodeInput = $("#postcode-input")[0];
  if (postcodeInput.value) {
    if (!postcodes.includes(postcodeInput.value)) {
      postcodeInput.value = "Invalid postcode";
      return;
    }
    getPostcodeLocationAndSearch(postcodeInput.value);
  }
  else {
    searchForCharities(null);
  }
  UpdateSearchHistory(postcodeInput.value, selectedItemName);
}

function clearMarkers() {
  markers.forEach(marker => {
    marker.setMap(null);
  });
  markers = [];
}

function getPostcodeLocationAndSearch(postcode) {
  const placesServiceRequest = {
    query: `postcode ${postcode} Australia`,
    fields: ["geometry"],
    locationBias: startLocation,
  };
  const placesService = new google.maps.places.PlacesService(map);
  placesService.findPlaceFromQuery(placesServiceRequest, (places, responseStatus) => {
    if (responseStatus === google.maps.places.PlacesServiceStatus.OK && places) {
      const location = places[0].geometry.location.toJSON();
      searchForCharities(location);
    }
  }
  );
}

function searchForCharities(location) {
  const item = $("#item-dropdown")[0].value.toLowerCase();
  let searchTerms = getCharitiesWhichAcceptItem(item);
  searchTerms.forEach(searchTerm => {
    const placesServiceRequest = {
      query: searchTerm,
      fields: ["name", "geometry", "formatted_address"],
    };
    if (location) {
      placesServiceRequest.locationBias = location;
      map.setCenter(location);
      map.setZoom(searchResultZoom);
    }
    else {
      findLocationAndCenterMap();
    }
    const placesService = new google.maps.places.PlacesService(map);
    placesService.findPlaceFromQuery(placesServiceRequest, (places, responseStatus) => {
        if (responseStatus === google.maps.places.PlacesServiceStatus.OK && places) {
          createMarker(places[0]);
        }
      }
    );
  });
}

function getCharitiesWhichAcceptItem(item) {
  let searchTerms = [];
  charities.forEach((charity) => {
    if (charity.items.includes(item)) {
      searchTerms.push(charity.searchTerm);
    }
  });
  return searchTerms;
}

function findLocationAndCenterMap() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        map.setCenter(pos);
        map.setZoom(searchResultZoom);
      },
      () => {
        map.setCenter(startLocation);
        map.setZoom(startZoom);
      }
    );
  } else {
    map.setCenter(startLocation);
    map.setZoom(startZoom);
  }
}

function createMarker(place) {
  if (!place.geometry || !place.geometry.location) return;
  const marker = new google.maps.Marker({
    map,
    position: place.geometry.location,
  });
  google.maps.event.addListener(marker, "click", () => {
    infowindow.setContent(`${place.name}: ${place.formatted_address}`);
    infowindow.open(map, marker);
  });
  markers.push(marker);
}

function UpdateSearchHistory(postcodeInputValue, selectedItemName) {
  let alreadyExists = false;
  searches.forEach(search => {
    if (search.itemName == selectedItemName && search.postcode == postcodeInputValue) {
      alreadyExists = true;
    }
  });
  if (alreadyExists) return;
  createPreviousSearchButton(postcodeInputValue, selectedItemName);
  saveSearchToLocalStorage(postcodeInputValue, selectedItemName);
}

function saveSearchToLocalStorage(postcodeInputValue, selectedItemName) {
  let search = {
    postcode: postcodeInputValue,
    itemName: selectedItemName,
  };
  searches.push(search);
  localStorage.setItem("searches", JSON.stringify(searches));
}