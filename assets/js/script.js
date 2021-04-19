let popup;
let map;

init();

function init() {
  initMap();
  $('#search').click(search);
  loadHistory();
  Array.from($('option')).forEach($option => {
    $option.value = $option.textContent.toLowerCase();
  });
}

function initMap(popup) {
  popup = new ol.Overlay({
    element: $('#popup')[0],
    autoPan: true,
    autoPanAnimation: {
      duration: 240,
    },
  });
  map = new ol.Map({
    target: 'map',
    layers: [new ol.layer.Tile({
      source: new ol.source.OSM(),
    }),
    new ol.layer.Vector({
      source: new ol.source.Vector({
        features: []
      }),
      style: new ol.style.Style({
        image: new ol.style.Icon({
          scale: 0.75,
          src: 'https://openlayers.org/en/latest/examples/data/icon.png'
        }),
      })
    })],
    overlays: [popup],
    view: new ol.View({
      center: ol.proj.fromLonLat([133.775, -25.274]),
      zoom: 4
    })
  });

  $('#popup-closer').click(_ => {
    popup.setPosition(undefined);
  });

  map.on('singleclick', event => {
    const pixel = map.getEventPixel(event.originalEvent);
    map.forEachFeatureAtPixel(pixel, feature => {
      const coordinate = event.coordinate;
      $('#popup-content').text(feature.values_.description);
      popup.setPosition(coordinate);
    });
  });
}

function search(event) {
  event.preventDefault();
  clearFeatures();
  const $postcodeInput = $('#postcode');
  if (postcodes.includes($postcodeInput.val())) {
    getPostcodeLocationAndGetBoundingBoxAndSearch($postcodeInput.val());
    return;
  }
  geolocateAndGetBoundingBoxAndSearch();
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

function getPostcodeLocationAndGetBoundingBoxAndSearch(postcode) {
  const searchURL = `https://nominatim.openstreetmap.org/search/"${postcode}, Australia"?format=json&addressdetails=1&polygon_svg=1&countrycodes=au/`;
  fetch(searchURL, { method: "GET" }).then(response => {
    return response.json();
  }).then(obj => {
    const lat = obj[0].lat;
    const lon = obj[0].lon;
    getBoudingBoxAndSearch(lat, lon);
  }).catch(error => {
    console.log(error);
  });
}

function geolocateAndGetBoundingBoxAndSearch() {
  const lat = geoplugin_latitude();
  const lon = geoplugin_longitude();
  getBoudingBoxAndSearch(lat, lon)
}

function getBoudingBoxAndSearch(lat, lon) {
  map.getView().setCenter(ol.proj.fromLonLat([lon, lat]));
  map.getView().setZoom(10);
  const boundingbox = [parseFloat(lat) - 1, parseFloat(lat) + 1, parseFloat(lon) - 1, parseFloat(lon) + 1];
  searchForCharitiesAcceptingItem(boundingbox, lat, lon);
}

function searchForCharitiesAcceptingItem(boundingbox, lat, lon) {
  let searchTerms = [];
  const item = document.querySelector("#select").value.toLowerCase();
  charities.forEach((charity) => {
    if (charity.items.includes(item)) {
      searchTerms.push(charity.searchTerm);
    }
  });
  searchTerms.forEach((searchTerm) => {
    const searchURL = `https://nominatim.openstreetmap.org/search/${searchTerm} near ${lat},${lon}?format=json&addressdetails=1&polygon_svg=1&countrycodes=au&limit=10&bounded=1&viewbox=${boundingbox[3]},${boundingbox[2]},${boundingbox[1]},${boundingbox[0]}/`;
    fetch(searchURL, { method: "GET" }).then(response => {
      return response.json();
    }).then(obj => {
      obj.forEach(result => {
        const address = result.address;
        let name = '';
        if (address.shop) {
          name = address.shop;
        }
        if (address.place) {
          name = address.place;
        }
        if (address.amenity) {
          name = address.amenity;
        }
        if (address.building) {
          name = address.building;
        }
        let number = '';
        if (address.house_number) {
          number = address.house_number;
        }
        const fullAddress = `${name}, ${number} ${address.road}, ${address.suburb}, ${address.postcode}, ${address.state}`
        createFeature(fullAddress, result.lon, result.lat);
      });
    }).catch(error => {
      console.log(error);
    });
  });

  function createFeature(fullAddress, lon, lat) {
    const iconFeature = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat([lon, lat])),
      description: fullAddress,
    });
    map.getLayers().array_[1].getSource().addFeature(iconFeature);
  }
}

function clearFeatures() {
  map.getLayers().array_[1].getSource().clear();
}