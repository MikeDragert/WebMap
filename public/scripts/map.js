const modeType = {
  POINT: 1,
  LINE: 2,
  RECTANGLE: 3
}

let points = [];
let justDeletedLine = false;

let mode = modeType.POINT;

let setMode = function(newMode) {
  if (Object.values(modeType).includes(newMode)) {
    mode = newMode;
  }
}

$("document").ready(function() {
  
  $("#pointButton").on('click', () => setMode(modeType.POINT));
  $("#lineButton").on('click', () => setMode(modeType.LINE));
  $("#rectangleButton").on('click', () => setMode(modeType.RECTANGLE));

  let map = L.map('map').setView([51.505, -0.09], 13);
  
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  let clearPoints = function() {
    points = [];
  }

  let createMarker = function(points) {
    if (points.length < 1) {
      return;
    }
    let marker = L.marker(points[0]);
    marker.on('click', (e) => {
      map.removeLayer(marker);
    });
    marker.addTo(map);
    clearPoints();
  }
  
  let createLine = function(points) {
    //todo:  could we make it so that if only one point we draw a line from point[0] to mouse curser?
      //would have to update on move of mouse
    if (points.length < 2) {
        return;
    }
    var polyLine = new L.Polyline(points, {
        color: 'blue',
        weight: 3,
        opacity: 0.5,
        smoothFactor: 1
    });
    polyLine.on('click', () => {
      map.removeLayer(polyLine);
      justDeletedLine = true;      
    });
    polyLine.addTo(map);
    clearPoints();
  }
  
  let createRectangle = function(points) {
    //todo:  could we make it so that if only one point we draw a line from point[0] to mouse curser?
      //would have to update on move of mouse
    if (points.length < 2) {
        return;
    }
    var rectangle = new L.Rectangle(points, {
        color: 'blue',
        weight: 3,
        opacity: 0.5,
        smoothFactor: 1
    });
    rectangle.on('click', () => {
      map.removeLayer(rectangle);
      justDeletedLine = true;      
    });
    rectangle.addTo(map);
    clearPoints();
  }

  //handle on click event for map
  map.on('click', (e) => {
    if (!justDeletedLine) {
      points.push(e.latlng)
    } 
    justDeletedLine = false;
    
    //todo:  these work, but now we need a way to choose what we're doing.  sidebar??
    switch(mode) {
      case modeType.POINT:
        createMarker(points);
        break;
      case modeType.LINE:
        createLine(points);
        break;
      case modeType.RECTANGLE:
        createRectangle(points);
        break;
    }
  })


  //allow edit/delete of each

  //each of those three elements to have multiline text boxes
  //  assume able to edit text box after

  //finally, allow search of all those text boxes
    // can we keep the values in one array or object?
    // or maybe keep all the added objects in an array, with the text under each object


})
