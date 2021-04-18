//Create the variables
let map;
let placesService;
let infowindow;
let markers = [];
const australia = { lat: -25.274, lng: 133.775 };
let searches = [];

init();

function init() {
  const searchButton = document.querySelector("#search");
  searchButton.addEventListener("click", search);
  //Call on the load history function
  loadHistory();
  const options = document.querySelectorAll("option");
  Array.from(options).forEach(function (option){
    option.value = option.textContent.toLowerCase();
  });
  const requestURL = "https://en.wikipedia.org/w/api.php?action=parse&origin=*&page=Society of Saint Vincent de Paul&prop=text&format=json&formatversion=2";
  fetch(requestURL, {method: "GET"})
  .then(response => {
    return response.json();
  }).then(obj => {
    const $element = $(obj.parse.text);
    $element[0].style.backgroundColor = "white";
    $element[0].style.maxHeight = "20rem";
    $('body').append($element);
  })
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
      // FIX THIS
      alert("Please enter a valid postcode");
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

//Renders the map to the page with a default position with the center of Australia displayed
function initMap() {
  infowindow = new google.maps.InfoWindow();
  map = new google.maps.Map(document.getElementById("map"), {
    center: australia,
    zoom: 4,
  });
}

function getLocationAndSearch(postcode) {
  const placesServiceRequest = {
    query: "postcode " + postcode + " Australia",
    fields: ["geometry"],
    locationBias: australia,
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

function clearMarkers() {
  markers.forEach((marker) => {
    marker.setMap(null);
  });
  markers = [];
}
