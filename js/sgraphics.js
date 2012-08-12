"use strict";
/*jslint indent: 2 */
/*
 * SIMPLE GRAPHICS LIBRARY FOR CANVAS
 * written by Nicholas Steinhafel, starting on 4/15/2012
 * github.com/nsteinhafel
 *
 * Hopefully this will evolve into a game or two.
 */

// COMMON FUNCTIONS

// comparison function used for Array.sort
function comparePoints(a, b) {
  return a.x - b.x;
}


// POINT

// a simple point, takes in x/y coords
function SPoint(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

// x-coord
SPoint.prototype.x = null;

// y-coord
SPoint.prototype.y = null;

// adds a point to another, returns itself as the resultant point
SPoint.prototype.add = function (p) {
  this.x += p.x;
  this.y += p.y;
  return this;
};

// determines if two poitns are equal
SPoint.prototype.equals = function (p) {
  return this.x === p.x && this.y === p.y;
};

// add an x/y offset to a point, returns itself as the resultant point
SPoint.prototype.offset = function (x, y) {
  this.x += x;
  this.y += y;
  return this;
};

// useful for minBoundingRect
SPoint.prototype.clone = function () {
  return new SPoint(this.x, this.y);
};

SPoint.prototype.toString = function () {
  return '(' + this.x.toString() + ', ' + this.y.toString() + ')';
};


// DRAWABLE

// drawable base class for SImage and SPolygon
function SDrawable() {}

// "abstract" declaration of draw
SDrawable.prototype.draw = function (context) {
  throw '"draw" function must be implemented by child class.';
};

// "abstract" declaration of offset
SDrawable.prototype.offset = function (x, y) {
  throw '"offset" function must be implemented by child class.';
};

// "abstract" declaration of minBoundingRect - allows us to do collision checks in SDrawable
SDrawable.prototype.minBoundingRect = function (x, y) {
  throw '"minBoundingRect" function must be implemented by child class.';
};

// returns true if drawable currently collides with the other drawable
// if something else is passed in, use that function
SDrawable.prototype.collidesWith = function (drawable) {
  if (!drawable instanceof SDrawable) {
    return drawable.collidesWith(this);
  }

  var thisRect = this.minBoundingRect(),
    drawRect = drawable.minBoundingRect();

  return (thisRect.points[0].x < drawRect.points[2].x &&
          thisRect.points[2].x > drawRect.points[0].x &&
          thisRect.points[0].y < drawRect.points[2].y &&
          thisRect.points[2].y > drawRect.points[0].y);
};

// returns true if drawable will collide with other drawable after offset is applied
// if a sprite is passed in, use their function!
SDrawable.prototype.willCollideWith = function (drawable, dx, dy) {
  if (!drawable instanceof SDrawable) {
    return drawable.willCollideWith(this, dx, dy);
  }

  var thisRect = this.minBoundingRect(),
    drawRect = drawable.minBoundingRect();
  thisRect.offset(dx, dy);

  return (thisRect.points[0].x < drawRect.points[2].x &&
          thisRect.points[2].x > drawRect.points[0].x &&
          thisRect.points[0].y < drawRect.points[2].y &&
          thisRect.points[2].y > drawRect.points[0].y);
};

// returns true if drawable is fully inside the screen denoted from 0,0 to w,h
SDrawable.prototype.isInBounds = function (x1, y1, x2, y2) {
  var thisRect = this.minBoundingRect();
  return (thisRect.points[0].x > x1 && thisRect.points[0].y > y1 &&
          thisRect.points[2].x < x2 && thisRect.points[2].y < y2);
};

// returns true if drawable will be fully inside the screen denoted from 0,0 to w,h after offset is applied
SDrawable.prototype.willBeOutOfBounds = function (x1, y1, x2, y2, dx, dy) {
  var thisRect = this.minBoundingRect();
  thisRect.offset(dx, dy);

  // return offending point
  if (!(thisRect.points[0].x > x1 && thisRect.points[0].y > y1)) {
    return thisRect.points[0];
  }
  if (!(thisRect.points[2].x < x2 && thisRect.points[2].y < y2)) {
    return thisRect.points[2];
  }

  return false;
};


 // POLYGON

// a basic n-sided polygon
// takes in a list of points, a color in hex, rgb, or rgba, and if the polygon should be filled (otherwise wireframe)
function SPolygon(points, color, fill) {
  this.points = points;

  this.color = color || '#ffffff';
  this.fill = fill || false; // "wireframe" by default
}

SPolygon.prototype = new SDrawable();
SPolygon.prototype.parent = SDrawable.prototype;
SPolygon.prototype.constructor = SPolygon;

// array of points
SPolygon.prototype.points = null;

// what color should the fill/wireframe be? (white is default)
SPolygon.prototype.color = null;

// filled (true) or wireframe (false, default)
SPolygon.prototype.fill = null;

// basic drawing function that should handle all polygons except circles
SPolygon.prototype.draw = function (context) {
  context.beginPath();
  var len = this.points.length, i;
  if (len > 0) {
    context.moveTo(this.points[0].x, this.points[0].y);
    for (i = 1; i < len; i += 1) {
      context.lineTo(this.points[i].x, this.points[i].y);
    }
  }
  if (this.fill) {
    context.fillStyle = this.color;
    context.fill();
  } else {
    context.closePath();
    context.strokeStyle = this.color;
    context.stroke();
  }
};

// add an x/y offset to each point in the polygon
SPolygon.prototype.offset = function (x, y) {
  var len = this.points.length, i;
  for (i = 0; i < len; i += 1) {
    this.points[i].offset(x, y);
  }
};

// get the minimum bounding rectangle of the polygon used for basic collision detection
SPolygon.prototype.minBoundingRect = function () {
  var len = this.points.length, i,
    minX, minY, maxX, maxY;
  if (len > 0) {
    minX = this.points[0].x;
    minY = this.points[0].y;
    maxX = this.points[0].x;
    maxY = this.points[0].y;
    for (i = 1; i < len; i += 1) {
      minX = Math.min(minX, this.points[i].x);
      minY = Math.min(minY, this.points[i].y);
      maxX = Math.max(maxX, this.points[i].x);
      maxY = Math.max(maxY, this.points[i].y);
    }
    return new SRect(new SPoint(minX, minY), new SPoint(maxX, maxY));
  }
  return null;
};

// RECT

// takes two points, color, fill
function SRect(a, b, color, fill) {
  this.points = [a, new SPoint(b.x, a.y), b, new SPoint(a.x, b.y)];

  this.color = color || '#ffffff';
  this.fill = fill || false;
}

SRect.prototype = new SPolygon();
SRect.prototype.parent = SPolygon.prototype;
SRect.prototype.constructor = SRect;

// ARC

// takes center, radius, begAngle, endAngle, color, fill
function SArc(center, radius, begAngle, endAngle, color, fill) {
  this.points = [center];
  this.begAngle = begAngle || 0; // defaults to circle
  this.endAngle = endAngle || Math.PI * 2;
  this.radius = radius || 0;
  this.color = color || '#ffffff';
  this.fill = fill || false;
}

SArc.prototype = new SPolygon();
SArc.prototype.parent = SPolygon.prototype;
SArc.prototype.constructor = SArc;

// needs a separate radius variable
SArc.prototype.radius = null;

// beginning angle
SArc.prototype.begAngle = null;

// needs a separate radius variable
SArc.prototype.endAngle = null;

// needs a new draw function to take into account the fact that it is a circle
SArc.prototype.draw = function (context) {
  if (this.points !== null && this.points.length > 0) {
    context.beginPath();
    context.arc(this.points[0].x, this.points[0].y, this.radius, this.begAngle, this.endAngle, true);
    if (this.fill) {
      context.fillStyle = this.color;
      context.fill();
    } else {
      context.strokeStyle = this.color;
      context.stroke();
    }
  }
};

function toNormalizedRadians(angle) {
  angle = angle % (Math.PI * 2);
  if (angle < 0) {
    angle = Math.PI * 2 - angle;
  }

  return angle;
}

// needs a distinct minBoundingRect
SArc.prototype.minBoundingRect = function () {
  var plist, halfPi, twoPi, len, i,
    minX, minY, maxX, maxY,
    beg = toNormalizedRadians(this.begAngle),
    end = toNormalizedRadians(this.endAngle);

  halfPi = Math.PI / 2;
  twoPi = Math.PI * 2;
  plist = [];
  if (halfPi > beg && halfPi < end) {
    plist.push(this.points[0].clone().offset(0, this.radius));
  }

  if (Math.PI > beg && Math.PI < end) {
    plist.push(this.points[0].clone().offset(-this.radius, 0));
  }

  if (Math.PI + halfPi > beg && Math.PI + halfPi < end) {
    plist.push(this.points[0].clone().offset(0, -this.radius));
  }

  if (twoPi > beg && twoPi < end) {
    plist.push(this.points[0].clone().offset(-this.radius, 0));
  }

  // no need to calculate end points if equivalent to full circle for rect
  if (plist.length < 4) {
    plist.push(this.points[0].clone().offset(parseInt(Math.sin(beg) * this.radius, 10),
                                             parseInt(Math.cos(beg) * this.radius, 10)));
    plist.push(this.points[0].clone().offset(parseInt(Math.sin(end) * this.radius, 10),
                                             parseInt(Math.cos(end) * this.radius, 10)));
  }

  len = plist.length;
  if (len > 0) {
    minX = plist[0].x;
    minY = plist[0].y;
    maxX = plist[0].x;
    maxY = plist[0].y;
    for (i = 1; i < len; i += 1) {
      minX = Math.min(minX, plist[i].x);
      minY = Math.min(minY, plist[i].y);
      maxX = Math.max(maxX, plist[i].x);
      maxY = Math.max(maxY, plist[i].y);
    }
    return new SRect(new SPoint(minX, minY), new SPoint(maxX, maxY));
  }
  return null;

};

// CIRCLE

// takes center, radius, color, fill
function SCircle(center, radius, color, fill) {
  this.points = [center];
  this.begAngle = 0;
  this.endAngle = Math.PI * 2;
  this.radius = radius || 0;
  this.color = color || '#ffffff';
  this.fill = fill || false;
}

SCircle.prototype = new SArc();
SCircle.prototype.parent = SArc.prototype;
SCircle.prototype.constructor = SCircle;

// needs a new minBoundingRect for a circle (not a collection of points, just a point), pretty simple
SCircle.prototype.minBoundingRect = function () {
  return new SRect(new SPoint(this.points[0].x - this.radius, this.points[0].y - this.radius),
                  new SPoint(this.points[0].x + this.radius, this.points[0].y + this.radius));
};


// SIMAGE
// constructor for a simple image, inherites from SDrawable
function SImage(point, src) {
  this.point = point || new SPoint();

  this.img = new Image();
  this.img.src = src || '';
}

SImage.prototype = new SDrawable();
SImage.prototype.parent = SDrawable.prototype;
SImage.prototype.constructor = SImage;

// top left location point of image
SImage.prototype.point = null;

// javascript Image
SImage.prototype.img = null;

// allows a change of Image src
SImage.prototype.setImageSrc = function (src) {
  this.img.src = src;
};

// implements the draw function as required by SDrawable
SImage.prototype.draw = function (context) {
  context.drawImage(this.img, this.point.x, this.point.y);
};

// implements the offset function as required by SDrawable
SImage.prototype.offset = function (x, y) {
  this.point.offset(x, y);
};

// implements the minBoundingRect function as required by SDrawable for collision detection
SImage.prototype.minBoundingRect = function () {
  return new SRect(this.point.clone(), new SPoint(this.point.x + this.img.width, this.point.y + this.img.height));
};


// SPRITE

function SSprite(drawables, point) {
  var len, i;
  this.drawables = drawables;
  this.point = point || new SPoint();
  len = this.drawables.length;
  for (i = 0; i < len; i += 1) {
    // apply offset from base point
    this.drawables[i].offset(this.point.x, this.point.y);
  }
}

// list of drawables making up the sprite
SSprite.prototype.drawables = null;

// top left location of sprite's position
SSprite.prototype.point = null;

// you should be able to draw a sprite
SSprite.prototype.draw = function (context) {
  var len = this.drawables.length, i;
  for (i = 0; i < len; i += 1) {
    this.drawables[i].draw(context);
  }
};

// you should be able to offset a sprite
SSprite.prototype.offset = function (x, y) {
  var len = this.drawables.length, i;
  this.point.offset(x, y);
  for (i = 0; i < len; i += 1) {
    this.drawables[i].offset(x, y);
  }
};

// handles collidesWith for drawables, sprites
SSprite.prototype.collidesWith = function (drawable) {
  var tlen = this.drawables.length, dlen, i, j, minBR;
  if (drawable instanceof SDrawable) {
    minBR = drawable.minBoundingRect(); // faster for larger polygons
    for (i = 0; i < tlen; i += 1) {
      if (this.drawables[i].collidesWith(minBR)) {
        return true;
      }
    }
    return false;
  } else if (drawable instanceof SSprite) {
    // brute force for now, optimize later
    dlen = drawable.drawables.length;
    for (i = 0; i < tlen; i += 1) {
      for (j = 0; j < dlen; j += 1) {
        if (this.drawables[i].collidesWith(drawable.drawables[j])) {
          return true;
        }
      }
    }
    return false;
  }
  return null;
};

// handles willCollideWith for drawables, sprites
SSprite.prototype.willCollideWith = function (drawable, dx, dy) {
  var tlen = this.drawables.length, dlen, i, j, minBR;
  if (drawable instanceof SDrawable) {
    minBR = drawable.minBoundingRect(); // faster for larger polygons
    for (i = 0; i < tlen; i += 1) {
      if (this.drawables[i].willCollideWith(minBR, dx, dy)) {
        return true;
      }
    }
    return false;
  } else if (drawable instanceof SSprite) {
    // brute force for now, optimize later
    dlen = drawable.drawables.length;
    for (i = 0; i < tlen; i += 1) {
      for (j = 0; j < dlen; j += 1) {
        if (this.drawables[i].willCollideWith(drawable.drawables[j], dx, dy)) {
          return true;
        }
      }
    }
    return false;
  }
  return null;
};

// returns true if sprite is fully inside the screen denoted from 0,0 to w,h
SSprite.prototype.isInBounds = function (x1, y1, x2, y2, dx, dy) {
  var len = this.drawables.length, i;
  for (i = 0; i < len; i += 1) {
    if (!this.drawables[i].isInBounds(x1, y1, x2, y2, dx, dy)) {
      return false;
    }
  }
  return true;
};

// returns true if sprite will be fully inside the screen denoted from 0,0 to w,h after offset is applied
SSprite.prototype.willBeOutOfBounds = function (x1, y1, x2, y2, dx, dy) {
  var point = false,
    len = this.drawables.length,
    i;
  for (i = 0; i < len; i += 1) {
    point = this.drawables[i].willBeOutOfBounds(x1, y1, x2, y2, dx, dy);
    if (point) {
      return point;
    }
  }
  return false;
};

// sprite should have a moveTo function that animates movement
SSprite.prototype.moveTo = function (context, x, y) {
  throw '"moveTo" function must be implemented by child class.';
};
