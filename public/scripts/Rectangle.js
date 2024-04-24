import {
  modeType,
  LINEWEIGHT,
  LINEOPACITY,
  TOOLTIPTEXTDEFAULT
} from './mapObjects.js';

import { TwoPointObject } from './TwoPointOjbect.js'


// Rectangle mapObject
export class Rectangle extends TwoPointObject {
  constructor (L, map, points, callbacks, tooltipContent = TOOLTIPTEXTDEFAULT) {
    super(L, map, points, callbacks, tooltipContent);
    this._type = modeType.RECTANGLE;
  }

  // allocate one specific rectangle object
  _allocateSpecificMapObject = function(targetPoints, objectColor){
    if (this._type === modeType.RECTANGLE) {
      return new this._L.Rectangle(targetPoints, {
          color: objectColor,
          weight: LINEWEIGHT,
          opacity: LINEOPACITY,
          smoothFactor: 1
      });
    }
    return undefined;
  }
}

