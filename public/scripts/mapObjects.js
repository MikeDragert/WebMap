export const modeType = {
  POINT: 1,
  LINE: 2,
  RECTANGLE: 3
}

// constants that can be used to modify behaviour
const LINEWEIGHT = 4;
const LINEOPACITY = 0.75;
const POINTCLICKBOUNDS = 0.005;  //this maybe should scale with the zoom
const TOOLTIPTEXTDEFAULT = "Type here";
const EDITINGCOLOR = "#2AAD27";
const FINISHEDCOLOR = "#2A81CB";

//MapObject class tracks needed information on a mapObject and manages displaying on the map
export class MapObject {
  _type = undefined;
  _points = [];
  _tooltipContent = TOOLTIPTEXTDEFAULT;
  _editing = false;
  _moving = false;
  _mapElement = undefined;
  _callbacks = undefined;
  _mouseDownTime = undefined;

  constructor () {
    this._editing = false;
    this._moving = false;
  }

  get editingTooltip() {
    return this._editing;
  }

  get tooltipContent() {
    return this._tooltipContent;
  }

  get type() {
    return this._type;
  }
  
  get numberPoints() {
    return this._points.length
  }
  
  get editing() {
    return this._editing;
  }

  get moving() {
    return this._moving;
  }

  setPoints = function(points) {
    this._points = points;
  }

  addPoint = function(point) {
    this._points.push(point);
  }

  clearPoints = function() {
    this._points = [];
  }

  removeLastPoint = function() {
    this._points.pop();
  }

  setTooltipContent = function(tooltipContent) {
    this._tooltipContent = tooltipContent;
    this._displayCurrentTooltipText();
  }
  
  clearTooltipContent = function() {
    this._tooltipContent = '';
    this._displayCurrentTooltipText();
  }
  
  addCharToTooltipContent = function(char) {
    if (this._tooltipContent === TOOLTIPTEXTDEFAULT) {
      this._tooltipContent = "";
    }
    this._tooltipContent += char;
    this._displayCurrentTooltipText();
  }
  
  removeLastCharFromTooltipContent = function () {
    this._tooltipContent = this._tooltipContent.slice(0,-1);  
    if (this._tooltipContent === '') {
      this._tooltipContent = TOOLTIPTEXTDEFAULT;
    }
    this._displayCurrentTooltipText();
  }

  // get the centerpoint of the mapObject
  getCenterPoint = function() {
    if (this._points.length === 0) {
      return undefined;
    }
    if (this._points.length === 1) {
      return this._points[0];
    }
    let centerPoint = new L.LatLng(
      this._points[0].lat + (this._points[1].lat-this._points[0].lat)/2, 
      this._points[0].lng + (this._points[1].lng-this._points[0].lng)/2
    );
    
    return centerPoint;
  }

  // move the mapObject by the delta supplied
  move = function(L, map, delta) {
    this._points = this._points.map(point => {
      point.lat += delta.lat;
      point.lng += delta.lng;
      return point;
    })
    this.createOnMap(L, map);
  }

  // display the tooltip text
  _displayCurrentTooltipText = function() {
    this._mapElement.getTooltip().setContent(this._tooltipContent );
    this._callbacks.displayMapObjects();
  }
  
  //this displays the tooltip by binding it to the map
  _createTooltip = function (L, map) {
    if (!this._mapElement) {
      return;
    }

    this._mapElement.bindTooltip(this._tooltipContent, {
      permanent: true, 
      direction: "auto", 
      interactive: true, 
      bubblingMouseEvents: false, 
      className: this._editing? 'editingTooltipText' : 'tooltipText' 
    })
      .openTooltip()
      .on('click', (event) => {
        if (this._tooltipMatch(event)) {
          this.toggleEdit(L, map);   
        }
      });
  }
  
  // does this tooltip match the event source target
  _tooltipMatch = function(event) {
    if (!this._mapElement) {
      return false;
    }
    return this._mapElement.getTooltip() === event.sourceTarget;
  }
  
  // toggle this mapObject between editing or not editing
  toggleEdit = function(L, map) {
    if (!this._mapElement) {
      return;
    }
    this._editing = !this._editing;
    if (!this.editing) {
      this._moving = false;
    }
    
    if (!this._mapElement.getTooltip()) {
      $('#map').focus();
      map.keyboard.enable();
      return;
    }

    this.createOnMap(L, map);
  
    if (this._editing) {
      this._callbacks.clearAllEditingObjects(this);
      map.keyboard.disable(); //todo: something weird happens here.  enabling keyboard later doesn't work until we click outside the map and then back in
      return;
    } 
    map.keyboard.enable(); 
  }
 
  // are the two given points sufficiently close
  // note this may need adjusting depending on the zoom level (future)
  _pointsClose = function(point1, point2) {
    return (point1.lat - POINTCLICKBOUNDS) <= point2.lat && 
            point2.lat <= (point1.lat + POINTCLICKBOUNDS) &&
           (point1.lng - POINTCLICKBOUNDS) <= point2.lng && 
            point2.lng <= (point1.lng + POINTCLICKBOUNDS); 
  }

  // remove this drawn element from the map
  removeFromMap = function(map) {
    if (this._mapElement) {
      map.removeLayer(this._mapElement);
      this._mapElement = undefined;
    }
  }

  // create a marker mapObject on the map
  _createMarker = function(L, map) {
    if (this._points.length < 1) {
      return;
    }
    let lastMapElement = this._mapElement;

    let iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png"
    if (this._editing) {
      iconUrl = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png"
    }
    if (this._type = modeType.POINT) {

      this._mapElement = L.marker(this._points[0], { icon: new L.Icon({iconUrl: iconUrl, iconSize: [25, 41], iconAnchor: [12, 41]})});
      this._mapElement.on('mousedown', () => {
        this._mouseDownTime = new Date();
      })
      this._mapElement.on('mouseup', (e) => {
        if (this._moving) {
          this._moving = false;
        } else if (new Date() - this._mouseDownTime > 500) {
          this._moving = true;
        } else {
          if (this._mapElement === e.sourceTarget) {
            this.toggleEdit(L, map);
          }
        }
      });

      this._mapElement.addTo(map);

      if (lastMapElement) {
        map.removeLayer(lastMapElement);
      }
      this._createTooltip(L, map);
    }
  }

  // create a line or rectangle mapObject on the map
  _drawMapObject = function(L, map, targetPoint = undefined) {
    let targetPoints = [...this._points];
    if ((targetPoints.length === 1) && (targetPoint instanceof L.LatLng)) {
      targetPoints.push(targetPoint);
    }
    
    if (targetPoints.length < 2) {
      return;
    }
    let color = this._editing ? EDITINGCOLOR : FINISHEDCOLOR;
    let lastMapElement = this._mapElement;    
    if (this._type === modeType.LINE) {
      this._mapElement = new L.Polyline(targetPoints, {
          color: color,
          weight: LINEWEIGHT,
          opacity: LINEOPACITY,
          smoothFactor: 1
      });
    }

    if (this._type === modeType.RECTANGLE) {
      this._mapElement = new L.Rectangle(targetPoints, {
          color: color,
          weight: LINEWEIGHT,
          opacity: LINEOPACITY,
          smoothFactor: 1
      });
    }

    if (!this._mapElement) {
      return;
    }
    this._mapElement.on('mousedown', () => {
      this._mouseDownTime = new Date();
    })
    this._mapElement.on('mouseup', (event) => {
      if (this._mapElement === event.sourceTarget) {
        let stillDrawing = this._points.length !== 2;

        if (stillDrawing) {
          this._points.push(event.latlng);
          map.removeLayer(this._mapElement);          
          this._drawMapObject(L, map);
        } else {
          if (this._moving) {
            this._moving = false;
            this._callbacks.setIgnoreNextClick();
          } else {
            if (this._editing) {
              //did we click near a corner?
              let objectLatLngs = [];
              let totalPoints = 0;
              if (this._type === modeType.LINE) {
                objectLatLngs = this._mapElement.getLatLngs();
                totalPoints = 2;
              }
              if (this._type === modeType.RECTANGLE) {
                objectLatLngs = this._mapElement.getLatLngs()[0];
                totalPoints = 4;
              }
              
              let foundPoint = false;
              if (objectLatLngs.length > 1) {
                for(let index = 0; index < objectLatLngs.length; index++) {
                  if (this._pointsClose(event.latlng, objectLatLngs[index])) {
                    let keepPoint = totalPoints === 4? (index + 2) % totalPoints : (index + 1) % totalPoints;
                    this._points = [objectLatLngs[keepPoint]];
                    foundPoint = true;
                    break;
                  }
                }
              }

              if (foundPoint) {                
                this.createOnMap(L, map, event.latlng)
              } else if (new Date() - this._mouseDownTime > 500) {
                this._moving = true;
                this._callbacks.setIgnoreNextClick();
              } else {
                this.toggleEdit(L, map);
                this._callbacks.setIgnoreNextClick();
              }
            } else {
              this.toggleEdit(L, map);
            }
          }
        }
      }
      
    });

    if (lastMapElement) {
      map.removeLayer(lastMapElement);
    }
    this._mapElement.addTo(map);
    this._createTooltip(L, map);
  }

  // create this mapObject on the map by checking type and calling appropriate method
  createOnMap = function(L, map, targetPoint = undefined) {
    switch(this._type) {
      case modeType.POINT:
        this._createMarker(L, map);
        return;
      case modeType.LINE:
      case modeType.RECTANGLE:
        this._drawMapObject(L, map, targetPoint);
        return;
    }
  }
}

// Marker mapObject
export class Marker extends MapObject {
  constructor (points, callbacks, tooltipContent = TOOLTIPTEXTDEFAULT) {
    super();
    this._type = modeType.POINT;
    this._points = points;
    this._tooltipContent = tooltipContent;
    this._editing = true;
    this._callbacks = callbacks;
  }
}

// Line mapObject
export class Line extends MapObject {
  constructor (points, callbacks, tooltipContent = TOOLTIPTEXTDEFAULT) {
    super();
    this._type = modeType.LINE;
    this._points = points;
    this._tooltipContent = tooltipContent;
    this._callbacks = callbacks;
    this._editing = true;
  }
}

// Rectangle mapObject
export class Rectangle extends MapObject {
  constructor (points, callbacks, tooltipContent = TOOLTIPTEXTDEFAULT) {
    super();
    this._type = modeType.RECTANGLE;
    this._points = points;
    this._tooltipContent = tooltipContent;
    this._callbacks = callbacks;
    this._editing = true;
  }
}
