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
const FINISHEDICONURL = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png"
const EDITINGICONURL = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png"

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
  _L = undefined;
  _map = undefined;

  constructor (L, map) {
    this._L = L;
    this._map = map;
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
    let centerPoint = new this._L.LatLng(
      this._points[0].lat + (this._points[1].lat-this._points[0].lat)/2, 
      this._points[0].lng + (this._points[1].lng-this._points[0].lng)/2
    );
    
    return centerPoint;
  }

  // move the mapObject by the delta supplied
  move = function(delta) {
    this._points = this._points.map(point => {
      point.lat += delta.lat;
      point.lng += delta.lng;
      return point;
    })
    this.createOnMap(this._L, this._map);
  }

  // display the tooltip text
  _displayCurrentTooltipText = function() {
    this._mapElement.getTooltip().setContent(this._tooltipContent );
    this._callbacks.displayMapObjects();
  }
  
  //this displays the tooltip by binding it to the map
  _createTooltip = function () {
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
          this.toggleEdit();   
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
  toggleEdit = function() {
    if (!this._mapElement) {
      return;
    }
    this._editing = !this._editing;
    if (!this.editing) {
      this._moving = false;
    }
    this.createOnMap();
    if (this._editing) {
      this._callbacks.clearAllEditingObjects(this);
      this._map.keyboard.disable(); //todo: something weird happens here.  enabling keyboard later doesn't work until we click outside the map and then back in
      return;
    } 
    this._map.keyboard.enable(); 
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
  removeFromMap = function() {
    if (this._mapElement) {
      this._map.removeLayer(this._mapElement);
      this._mapElement = undefined;
    }
  }
  // mouse down handler
  _mouseDownHandler = function(event, self) {
    self._mouseDownTime = new Date();
  }

  _markerMouseUpHanlder = function(event, self) {
    if (self._moving) {
      self._moving = false;
    } else if (new Date() - self._mouseDownTime > 500) {
      self._moving = true;
    } else {
      if (self._mapElement === event.sourceTarget) {
        self.toggleEdit(self._L, self._map);
      }
    }
  }

  // create a marker mapObject on the map //this could be refactored more
  _createMarker = function() {
    if (this._points.length < 1) {
      return;
    }
    let lastMapElement = this._mapElement;
    if (this._type = modeType.POINT) {
      this._mapElement = this._allocateMapObject();
      this._mapElement.on('mousedown', (event) =>  this._mouseDownHandler(event, this));
      this._mapElement.on('mouseup', (event) => this._markerMouseUpHanlder(event, this));
      this._mapElement.addTo(this._map);
      if (lastMapElement) {
        this._map.removeLayer(lastMapElement);
      }
      this._createTooltip();
    }
  }

  _getTargetDrawPoints = function(targetPoint = undefined) {
    let targetPoints = [...this._points];
    if ((targetPoints.length === 1) && (targetPoint instanceof this._L.LatLng)) {
      targetPoints.push(targetPoint);
    }
    return targetPoints;
  }

  // allocate a new map object from leaflet
  _allocateMapObject = function(targetPoint = undefined) {
    if (this.type === modeType.POINT) {
      let iconUrl = this._editing? EDITINGICONURL: FINISHEDICONURL;
      return this._L.marker(this._points[0], { icon: new this._L.Icon({iconUrl: iconUrl, iconSize: [25, 41], iconAnchor: [12, 41]})});
    }

    let targetPoints = this._getTargetDrawPoints(targetPoint);
    if (targetPoints.length < 2) {
      return undefined;
    }
    let color = this._editing ? EDITINGCOLOR : FINISHEDCOLOR;

    if (this._type === modeType.LINE) {
      return new this._L.Polyline(targetPoints, {
          color: color,
          weight: LINEWEIGHT,
          opacity: LINEOPACITY,
          smoothFactor: 1
      });
    }
    if (this._type === modeType.RECTANGLE) {
      return new this._L.Rectangle(targetPoints, {
          color: color,
          weight: LINEWEIGHT,
          opacity: LINEOPACITY,
          smoothFactor: 1
      });
    }
    return undefined;
  }

  // create a line or rectangle mapObject on the map //this could be refactored more
  _drawMapObject = function(targetPoint = undefined) {
    let targetPoints = [...this._points];
    if ((targetPoints.length === 1) && (targetPoint instanceof this._L.LatLng)) {
      targetPoints.push(targetPoint);
    }
    if (targetPoints.length < 2) {
      return;
    }
    let lastMapElement = this._mapElement;    
    this._mapElement = this._allocateMapObject(targetPoint);
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
          this._map.removeLayer(this._mapElement);          
          this._drawMapObject();
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
                this.createOnMap(event.latlng)
              } else if (new Date() - this._mouseDownTime > 500) {
                this._moving = true;
                this._callbacks.setIgnoreNextClick();
              } else {
                this.toggleEdit();
                this._callbacks.setIgnoreNextClick();
              }
            } else {
              this.toggleEdit();
            }
          }
        }
      }      
    });

    if (lastMapElement) {
      this._map.removeLayer(lastMapElement);
    }
    this._mapElement.addTo(this._map);
    this._createTooltip();
  }

  // create this mapObject on the map by checking type and calling appropriate method //this could be refactored more
  createOnMap = function(targetPoint = undefined) {
    switch(this._type) {
      case modeType.POINT:
        this._createMarker();
        return;
      case modeType.LINE:
      case modeType.RECTANGLE:
        this._drawMapObject(targetPoint);
        return;
    }
  }
}

// Marker mapObject
export class Marker extends MapObject {
  constructor (L, map, points, callbacks, tooltipContent = TOOLTIPTEXTDEFAULT) {
    super(L, map);
    this._type = modeType.POINT;
    this._points = points;
    this._tooltipContent = tooltipContent;
    this._editing = true;
    this._callbacks = callbacks;
  }
}

// Line mapObject
export class Line extends MapObject {
  constructor (L, map, points, callbacks, tooltipContent = TOOLTIPTEXTDEFAULT) {
    super(L, map);
    this._type = modeType.LINE;
    this._points = points;
    this._tooltipContent = tooltipContent;
    this._callbacks = callbacks;
    this._editing = true;
  }
}

// Rectangle mapObject
export class Rectangle extends MapObject {
  constructor (L, map, points, callbacks, tooltipContent = TOOLTIPTEXTDEFAULT) {
    super(L, map);
    this._type = modeType.RECTANGLE;
    this._points = points;
    this._tooltipContent = tooltipContent;
    this._callbacks = callbacks;
    this._editing = true;
  }
}
