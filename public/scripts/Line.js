import {
  modeType,
  LINEWEIGHT,
  LINEOPACITY,
  TOOLTIPTEXTDEFAULT,
} from './mapObjects.js';

import { TwoPointObject } from './TwoPointOjbect.js'

// Line mapObject
export class Line extends TwoPointObject {
  constructor (L, map, points, callbacks, tooltipContent = TOOLTIPTEXTDEFAULT) {
    super(L, map, points, callbacks, tooltipContent);
    this._type = modeType.LINE;
  }

  // allocate one specific line object
  _allocateSpecificMapObject = function(targetPoints, objectColor){
    if (this._type === modeType.LINE) {
      return new this._L.Polyline(targetPoints, {
          color: objectColor,
          weight: LINEWEIGHT,
          opacity: LINEOPACITY,
          smoothFactor: 1
      });
    }
    return undefined;
  }

}
