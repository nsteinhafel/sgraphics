"use strict";
/*jslint indent: 2 */

var context, WIDTH, HEIGHT, board, grid;

function draw() {
  board.draw(context);
  grid.draw(context);
}

function click(x, y) {
  alert(x + ' ' + y);
  //grid.getLocation(x, y);
}

function init() {
  var dW, dH, oW, oH, tW, tH, dlist, i;
  context = $('#canvas')[0].getContext('2d');
  WIDTH = $('#canvas').width();
  HEIGHT = $('#canvas').height();
  board = new SImage(new SPoint(), 'img/bg_desert.png');

  // create grid
  dW = 12;
  dH = 9;
  oW = 50;
  oH = 50;
  tW = (WIDTH - oW) / dW;
  tH = (HEIGHT - oH) / dH;
  dlist = [];
  for (i = 0; i <= dH; i += 1) {
    dlist.push(new SPolygon([ new SPoint(oW/2, tH * i + oH/2), 
                              new SPoint(tW * dW + oW/2, tH * i + oH/2)], '#000'));
  }
  for (i = 0; i <= dW; i += 1) {
    dlist.push(new SPolygon([ new SPoint(tW * i + oW/2, oH/2),
                              new SPoint(tW * i + oW/2, tH * dH + oH/2)], '#000'));
  }
  grid = new SSprite(dlist);

  // canvas click event
  $('#canvas').click(function(e) {
    click(Math.floor((e.pageX-$(this).offset().left)), Math.floor((e.pageY-$(this).offset().top)));
  });

  // start drawing
  setInterval(draw, 100); // just under 60 fps
}

