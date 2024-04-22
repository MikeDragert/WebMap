import {modeType, Marker, Line, Rectangle } from './mapObjects.js';


let map = undefined;
let mapObjects = [];
let searchWords = "";
let lastMouseLocation = undefined;

let mode = modeType.POINT;
let ignoreNextClick = false;

let setIgnoreNextClick = function() {
  ignoreNextClick = true;
}

let setMode = function(newMode) {
  if (Object.values(modeType).includes(newMode)) {
    mode = newMode;
  }
}

const getCurrentEditingObject = function() {
  return mapObjects.find((mapObject) => mapObject.editing)
}


const clearAllEditingObjects = function(exception = undefined) {
  mapObjects.forEach( mapObject => {
    if ((mapObject !== exception) && (mapObject.editing)) {
      mapObject.toggleEdit(L, map);
    }
  })
}

const removeMapObject = function(removeObject) {
  mapObjects = mapObjects.filter(mapObject => mapObject !== removeObject);
  displayMapObjects();
}

const handleKey = function(keyEvent) {
  let currentObjectEditing = getCurrentEditingObject();
  if (currentObjectEditing) {
    if ((keyEvent.keyCode === 8) || (keyEvent.keyCode === 127)) {
      currentObjectEditing.removeLastCharFromTooltipContent();       
    } else if (keyEvent.keyCode === 46) {
      removeMapObject(currentObjectEditing);     
      currentObjectEditing.removeFromMap(map);
    } else if (keyEvent.keyCode === 27) {
      currentObjectEditing.removeFromMap(map);
      removeMapObject(currentObjectEditing);
    } else if ((keyEvent.keyCode === 13) && (keyEvent.shiftKey)) {
      currentObjectEditing.addCharToTooltipContent("<br>"); 
    } else if (keyEvent.keyCode === 13) {
      currentObjectEditing.toggleEdit(L, map);   
    } else if (keyEvent.keyCode === 32) {
      keyEvent.stopPropagation();
      keyEvent.preventDefault();
      currentObjectEditing.addCharToTooltipContent(keyEvent.key); 
    } else if (keyEvent.keyCode >= 48 ) {
      keyEvent.stopPropagation();
      keyEvent.preventDefault();
      currentObjectEditing.addCharToTooltipContent(keyEvent.key);
    }
  }
}

//todo: we may want the option to just update one from the list, instead of removing all and recreating on typing text
const displayMapObjects = function() {
  let filteredMapObjects = mapObjects;
  if (searchWords.length > 0) {
    filteredMapObjects = mapObjects.filter( mapObject => {
      return searchWords.reduce((found, searchWord) => found || mapObject.tooltipContent.toLowerCase().includes(searchWord), false)  
    })
  }
  $("#searchResults").empty();

  if (searchWords.length > 0) {
    let newDiv = $('<div />')
      .addClass('searchUsed')
      .attr('id','searchUsed');
      
    let newSpan =  $('<span />').html(`Search: ${searchWords.join(', ')}`);
    let newSpanX = $('<span />')
      .html('X')
      .attr('id', 'searchX')
      .on('click', () => {
        searchWords = [];
        displayMapObjects();
      });
    newDiv.append(newSpan);
    newDiv.append(newSpanX);
    $("#searchResults").append(newDiv);
  }

  filteredMapObjects.forEach( mapObject => {
    let newSpan = $('<span />').html(mapObject.tooltipContent).on('click', () => map.flyTo(mapObject.getCenterPoint()))
    $("#searchResults").append(newSpan);
  })
}

$(document).ready(function() {
  
  $(document).on('keydown', handleKey);
  $("#pointButton").on('click', () => setMode(modeType.POINT));
  $("#lineButton").on('click', () => setMode(modeType.LINE));
  $("#rectangleButton").on('click', () => setMode(modeType.RECTANGLE));

  //todo:  what is the default location - can we get the location of the user?
  map = L.map('map').setView([51.505, -0.09], 13);
  
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  //handle on click event for map
  map.on('click', (e) => {
    if (ignoreNextClick) {
      ignoreNextClick = false;
      return;
    }
    switch(mode) {
      case modeType.POINT:
        clearAllEditingObjects();
        mapObjects.push(new Marker([e.latlng], { clearAllEditingObjects , removeMapObject, setIgnoreNextClick, displayMapObjects} ));
        mapObjects[mapObjects.length-1].createOnMap(L, map);
        displayMapObjects();
        break;
      case modeType.LINE:
        clearAllEditingObjects();
        mapObjects.push(new Line([e.latlng], { clearAllEditingObjects , removeMapObject, setIgnoreNextClick, displayMapObjects} ));
        mapObjects[mapObjects.length-1].createOnMap(L, map, e.latlng);
        displayMapObjects();
        break;
      case modeType.RECTANGLE:
        clearAllEditingObjects();
        mapObjects.push(new Rectangle([e.latlng], { clearAllEditingObjects , removeMapObject, setIgnoreNextClick, displayMapObjects} ));
        mapObjects[mapObjects.length-1].createOnMap(L, map, e.latlng);
        displayMapObjects();
        break;
    }
  })
  
  map.on('mousemove', (e) => {
    let editObject = getCurrentEditingObject();
    if (editObject) {
      if (editObject.moving) {
        if (lastMouseLocation) {
          let delta = new L.LatLng(e.latlng.lat - lastMouseLocation.lat, e.latlng.lng - lastMouseLocation.lng);
          editObject.move(L, map, delta);
        }
      } else {
        switch(mode) {
          case modeType.LINE:
          case modeType.RECTANGLE:
            editObject.createOnMap(L, map, e.latlng);
            break;
        }
      }
    }
    lastMouseLocation = e.latlng;
  })

  $('#searchText').on('keydown', (event) => {
    if (event.keyCode === 13) {
      let searchText = $('#searchText').val().toLowerCase();
      searchWords = searchText.split(' ').filter(word => word.length > 0);
      $('#searchText').val('');
      displayMapObjects();
    }
  })

  $('#map').focus();
   

  // todo:  we really want it to load to the persons actual location if we can

  //refactor??

  //styling
  //  1 - colour scheme
  //     \-> Title colour, background colour, text color, border colors
  //  2 - Buttons styling - font-awesome?
  //  3 - map items styling
  //    \-> drawing/selected colour, finished colour, tooltip styling
  //  4 - clear title bar?


})
