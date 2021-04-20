//Create the variables
let map;
let placesService;
let infowindow;
let markers = [];
let searches = [];
const startLocation = { lat: -25.274, lng: 133.775 };
const startZoom = 4;
const searchResultZoom = startZoom * 3;

init();

function init() {
  const searchButton = document.querySelector("#search");
  searchButton.addEventListener("click", search);
  //Call on the load history function
  loadHistory();
  const options = document.querySelectorAll("option");
  Array.from(options).forEach(function (option) {
    option.value = option.textContent.toLowerCase();
  });
}

//Renders the map to the page with a default position with the center of Australia displayed
function initMap() {
  infowindow = new google.maps.InfoWindow();
  map = new google.maps.Map(document.getElementById("map"), {
    center: startLocation,
    zoom: 4,
  });
}

function loadHistory() {
  searches = JSON.parse(localStorage.getItem("searches"));
  if (!searches) {
    searches = [];
  }
  searches.forEach(function (search) {
    let postcode = search.postcode;
    let itemName = search.itemName;
    createPreviousSearchButton(postcode, itemName);
  });
}

function search(onClickEvent) {
  onClickEvent.preventDefault();
  clearMarkers();
  const postcodeInput = document.querySelector("#postcode");
  const selectedItemName = document.querySelector("#select").value.toLowerCase();
  if (postcodeInput.value) {
    const postcode = postcodeInput.value;
    if (!postcodes.includes(postcode)) {
      postcodeInput.value = "Invalid postcode";
      return;
    }
    getLocationAndSearch(postcode);
  } else {
    searchForCharitiesAcceptingItem(null);
  }
  if (selectedItemName === "select your category") return;
  UpdateSearchHistory(selectedItemName, postcodeInput.value);
}

function UpdateSearchHistory(selectedItemName, postcodeInputValue) {
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

//--added by SP
function createPreviousSearchButton(postcodeInputValue, selectedItemName) {
  var searchHistory = $("#list-group");
  let $button = $(
    `<button data-postcode="${postcodeInputValue}" data-item="${selectedItemName}">${postcodeInputValue} - ${selectedItemName}</button>`
  );
  $button.addClass("button")
  $button[0].style.display = "inline-flex";
  $button[0].style.alignItems = "center";
  $button[0].style.justifyContent = "space-between";
  const $delete = $('<button class="delete"></button>');
  $delete.click(function (event) {
    event.stopPropagation();
    const parent = this.closest('.button');
    const postcode = parent.dataset.postcode;
    const item = parent.dataset.item;
    searches.forEach((search, index) => {
      if (search.postcode === postcode && search.itemName === item) {
        searches.splice(index, 1)
      }
    });
    localStorage.setItem("searches", JSON.stringify(searches));
    parent.remove();
  })
  $button.append($delete);
  $button.click(function (e) {
    const postcode = this.dataset.postcode;
    const itemName = this.dataset.item;
    const postcodeInput = document.querySelector("#postcode");
    const selectInput = document.querySelector("#select");
    postcodeInput.value = postcode;
    selectInput.value = itemName;
    search(e);
  });
  searchHistory.append($button);
}

function getLocationAndSearch(postcode) {
  const placesServiceRequest = {
    query: "postcode " + postcode + " Australia",
    fields: ["geometry"],
    locationBias: startLocation,
  };
  placesService = new google.maps.places.PlacesService(map);
  placesService.findPlaceFromQuery(
    placesServiceRequest,
    (places, responseStatus) => {
      if (
        responseStatus === google.maps.places.PlacesServiceStatus.OK &&
        places
      ) {
        const location = places[0].geometry.location.toJSON();
        searchForCharitiesAcceptingItem(location);
      }
    }
  );
}

function searchForCharitiesAcceptingItem(location) {
  let searchTerms = [];
  const item = document.querySelector("#select").value.toLowerCase();
  charities.forEach((charity) => {
    if (charity.items.includes(item)) {
      searchTerms.push(charity.searchTerm);
    }
  });
  searchTerms.forEach((searchTerm) => {
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
      geolocateMapCenter();
    }

    placesService = new google.maps.places.PlacesService(map);
    placesService.findPlaceFromQuery(
      placesServiceRequest,
      (places, responseStatus) => {
        if (
          responseStatus === google.maps.places.PlacesServiceStatus.OK &&
          places
        ) {
          createMarker(places[0]);
          // map.setCenter(places[0].geometry.location);
        }
      }
    );
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

function geolocateMapCenter() {
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

function clearMarkers() {
  markers.forEach((marker) => {
    marker.setMap(null);
  });
  markers = [];
}
