import { modeType } from './mapObjects.js';
import { Marker} from './Marker.js';
import { Line} from './Line.js';
import { Rectangle} from './Rectangle.js';
import { TwoPointObject } from './TwoPointOjbect.js';

let map = undefined;
let mapObjects = [];
let searchWords = "";
let lastMouseLocation = undefined;

let mode = modeType.POINT;
let ignoreNextClick = false;

let setIgnoreNextClick = function() {
  ignoreNextClick = true;
}

//update the options bar to show the new mode chosen
let displayMode = function(oldMode, newMode) {
  switch (oldMode) {
    case modeType.POINT:
      $("#pointButton").removeClass("buttonSelected");
      break;
    case modeType.LINE:
      $("#lineButton").removeClass("buttonSelected");
      break;
    case modeType.RECTANGLE:
      $("#rectangleButton").removeClass("buttonSelected");
      break;
  }
  switch (newMode) {
    case modeType.POINT:
      $("#pointButton").addClass("buttonSelected");
      break;
    case modeType.LINE:
      $("#lineButton").addClass("buttonSelected");
      break;
    case modeType.RECTANGLE:
      $("#rectangleButton").addClass("buttonSelected");
      break;
  }
}

// set the drawing mode
let setMode = function(newMode) {
  let oldMode = mode;
  if (Object.values(modeType).includes(newMode)) {
    mode = newMode;
  }
  displayMode(oldMode, mode);
}

// retrieve the current map object we are editing
const getCurrentEditingObject = function() {
  return mapObjects.find((mapObject) => mapObject.editing)
}

// clear all mapObjects from editing, EXCEPT the exception if given
const clearAllEditingObjects = function(exception = undefined) {
  mapObjects.forEach( mapObject => {
    if ((mapObject !== exception) && (mapObject.editing)) {
      mapObject.toggleEdit();
    }
  })
}

// remove a given mapObject from the list
const removeMapObject = function(removeObject) {
  mapObjects = mapObjects.filter(mapObject => mapObject !== removeObject);
  displayMapObjects();
}

// document key handler
const handleKey = function(keyEvent) {
  let currentObjectEditing = getCurrentEditingObject();
  if (currentObjectEditing) {
    if ((keyEvent.keyCode === 8) || (keyEvent.keyCode === 127)) {
      currentObjectEditing.removeLastCharFromTooltipContent();       
    } else if (keyEvent.keyCode === 46) {
      removeMapObject(currentObjectEditing);     
      currentObjectEditing.removeFromMap();
    } else if (keyEvent.keyCode === 27) {
      currentObjectEditing.removeFromMap();
      removeMapObject(currentObjectEditing);
    } else if ((keyEvent.keyCode === 13) && (keyEvent.shiftKey)) {
      currentObjectEditing.addCharToTooltipContent("<br>"); 
    } else if (keyEvent.keyCode === 13) {
      currentObjectEditing.toggleEdit();   
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

// show the map options on the sidebar
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

// initialization on document ready
$(document).ready(function() {
  
  $(document).on('keydown', handleKey);
  $("#pointButton").on('click', () => setMode(modeType.POINT));
  $("#lineButton").on('click', () => setMode(modeType.LINE));
  $("#rectangleButton").on('click', () => setMode(modeType.RECTANGLE));
  setMode(mode);

  map = L.map('map').setView([51.505, -0.09], 13);
  map.locate({setView: true, maxZoom: 14});
  
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  // map onclick handler
  map.on('click', (e) => {
    if (ignoreNextClick) {
      ignoreNextClick = false;
      return;
    }
    switch(mode) {
      case modeType.POINT:
        clearAllEditingObjects();
        mapObjects.push(new Marker(L, map, [e.latlng], { clearAllEditingObjects , removeMapObject, setIgnoreNextClick, displayMapObjects} ));
        mapObjects[mapObjects.length-1].createOnMap();
        displayMapObjects();
        break;
      case modeType.LINE:
        clearAllEditingObjects();
        mapObjects.push(new Line(L, map, [e.latlng], { clearAllEditingObjects , removeMapObject, setIgnoreNextClick, displayMapObjects} ));
        mapObjects[mapObjects.length-1].createOnMap(e.latlng);
        displayMapObjects();
        break;
      case modeType.RECTANGLE:
        clearAllEditingObjects();
        mapObjects.push(new Rectangle(L, map, [e.latlng], { clearAllEditingObjects , removeMapObject, setIgnoreNextClick, displayMapObjects} ));
        mapObjects[mapObjects.length-1].createOnMap(e.latlng);
        displayMapObjects();
        break;
    }
  })
  
  // map mousemove handler
  map.on('mousemove', (e) => {
    let editObject = getCurrentEditingObject();
    if (editObject) {
      if (editObject.moving) {
        if (lastMouseLocation) {
          let delta = new L.LatLng(e.latlng.lat - lastMouseLocation.lat, e.latlng.lng - lastMouseLocation.lng);
          editObject.move(delta);
        }
      } else {
        if (editObject instanceof TwoPointObject) {
          editObject.createOnMap(e.latlng);
        }
      }
    }
    lastMouseLocation = e.latlng;
  })

  // search box key handler
  $('#searchText').on('keydown', (event) => {
    if (event.keyCode === 13) {
      let searchText = $('#searchText').val().toLowerCase();
      searchWords = searchText.split(' ').filter(word => word.length > 0);
      $('#searchText').val('');
      displayMapObjects();
    }
  })

  $('#map').focus();
})
