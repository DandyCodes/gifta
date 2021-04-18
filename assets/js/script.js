let map;
let markers;

init();

function init() {
  initMap();
  $('#search').click(search);
  loadHistory();
  const options = document.querySelectorAll("option");
  Array.from(options).forEach(function (option) {
    option.value = option.textContent.toLowerCase();
  });
}

// function search(onClickEvent) {
//   onClickEvent.preventDefault();
//   const postcodeInput = document.querySelector("#postcode");
//   const selectedItemName = document.querySelector("#select").value.toLowerCase();
//   if (postcodeInput.value) {
//     const postcode = postcodeInput.value;
//     if (!postcodes.includes(postcode)) {
//       // FIX THIS
//       alert("Please enter a valid postcode");
//       return;
//     }
//     getLocationAndSearch(postcode);
//   } else {
//     searchForCharitiesAcceptingItem(null);
//   }
//   if (selectedItemName === "select your category") return;
//   UpdateSearchHistory(selectedItemName, postcodeInput.value);
// }

function search(event) {
  event.preventDefault();
  fetch(`https://nominatim.openstreetmap.org/search?q=vinnies&origin=*&countrycodes=au/`,
    { method: "GET" }
  ).then(response => {
    console.log(response);
  })
  return;
  const location = getCoords(-32.278, 115.735);
  markers.clearMarkers();
  markers.addMarker(new OpenLayers.Marker(location));
  map.setCenter(location);
}

function initMap() {
  const australia = ol.proj.fromLonLat([133.775, -25.274]);
  const defaultZoom = 4;
  var map = new ol.Map({
    target: 'map',
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM()
      })//,
      // new ol.layer.Vector({
      //   source: new ol.source.Vector({
      //     format: new ol.format.GeoJSON(),
      //     url: './data/countries.json'
      //   })
      // })
    ],
    view: new ol.View({
      center: australia,
      zoom: defaultZoom
    })
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

function getLocationAndSearch(postcode) {
  const location = postcode;
  searchForCharitiesAcceptingItem(location);
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
    createMarker();
  });

  function createMarker() {
  }
}
