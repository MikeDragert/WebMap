export const modeType = {
  POINT: 1,
  LINE: 2,
  RECTANGLE: 3
}

// constants that can be used to modify behaviour
export const LONGCLICKMINTIME = 250;
export const LINEWEIGHT = 4;
export const LINEOPACITY = 0.75;
export const POINTCLICKBOUNDS = 0.005;  //this maybe should scale with the zoom
export const TOOLTIPTEXTDEFAULT = "Type here";
export const EDITINGCOLOR = "#2AAD27";
export const FINISHEDCOLOR = "#2A81CB";
export const FINISHEDICONURL = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png"
export const EDITINGICONURL = "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png"

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

  // do we have enough points for a valid object
  // to be overridden
  _hasEnoughPoints = function(targetPoints) {
    return false;
  }

  // get the centerpoint of the mapObject
  // override for more complex objects
  getCenterPoint = function() {
    if (this._points.length === 0) {
      return undefined;
    }
    if (this._points.length === 1) {
      return this._points[0];
    }
    return undefined;
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
  
  // tooltip click handler
  _tooltipClickHandler = function(event, self) {
      if (this._tooltipMatch(event)) {
        this.toggleEdit();   
      }
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
      .on('click', (event) => this._tooltipClickHandler(event, this));
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
      this._map.keyboard.disable(); //note: something weird happens here.  enabling keyboard later doesn't work until we click outside the map and then back in
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

  // create this mapObject on the map by checking type and calling appropriate method
  //to be overridden
  createOnMap = function(targetPoint = undefined) {
    return undefined;
  }

  // get the points to draw this object on the map, which may be the _points, or may be [_points[0], targetPoint] 
  _getTargetDrawPoints = function(targetPoint = undefined) {
    let targetPoints = [...this._points];
    if ((targetPoints.length === 1) && (targetPoint instanceof this._L.LatLng)) {
      targetPoints.push(targetPoint);
    }
    return targetPoints;
  }

  // allocate a new map object from leaflet
  // to be overridden
  _allocateMapObject = function(targetPoint = undefined) {
    return undefined;
  }  
}
