


let mapBrushTypeToShapeName = {
  0: "Circle",
  1: "Square",
  2: "Triangle"
};

let mapBrushFillMode = {
  0: "Fill",
  1: "Outline",
};

const MAX_BRUSH_SIZE = 150; // the maximum brush size

let brushType = 0;      // Circle as default
let brushFillMode = 0;  // Fill as default
let brushSize = 50;     // Initial brush size
let brushX = 0;         // Current brush x location (in pixel coordinates)
let brushY = 0;         // Current brush y location (in pixel coordinates)
let brushColor;         // Current brush color
 
let lastBrushX = 0;     // Last brush y position (similar to pmouseX but for the brush)
let lastBrushY = 0;     // Last brush y position (similar to pmouseY but for the brush)

let showInstructions = true; // If true, shows the app instructions on the screen

// We will paint to an offscreen graphics buffer
// See: https://p5js.org/reference/#/p5/createGraphics
let offscreenGfxBuffer;






let pHtmlMsg;
let serialOptions = { baudRate: 115200  };
let serial;

function setup() {
  createCanvas(screen.width, screen.height);

  // Setup Web Serial using serial.js
  serial = new Serial();
  serial.on(SerialEvents.CONNECTION_OPENED, onSerialConnectionOpened);
  serial.on(SerialEvents.CONNECTION_CLOSED, onSerialConnectionClosed);
  serial.on(SerialEvents.DATA_RECEIVED, onSerialDataReceived);
  serial.on(SerialEvents.ERROR_OCCURRED, onSerialErrorOccurred);

  // If we have previously approved ports, attempt to connect with them
  // serial.autoConnectAndOpenPreviouslyApprovedPort(serialOptions);


  // Initialize the brush color to a ~white with a ~20% opacity (50/255 is 19.6%)
  brushColor = color(250, 250, 250, 50);
  // Rather than storing individual paint strokes + paint properties in a
  // data structure, we simply draw immediately to an offscreen buffer
  // and then show this offscreen buffer on each draw call
  // See: https://p5js.org/reference/#/p5/createGraphics
  offscreenGfxBuffer = createGraphics(width, height);
  offscreenGfxBuffer.background(100);

  // Add in a lil <p> element to provide messages. This is optional
  pHtmlMsg = createP("Click anywhere on this page to open the serial connection dialog");
}



function drawBrushStroke(xBrush, yBrush){
  // set the fill and outline brush settings
  if (brushFillMode == 0) { // brushFillMode 0 is fill
    offscreenGfxBuffer.fill(brushColor);
    offscreenGfxBuffer.noStroke();
  } else { // brushFillMode 0 is outline
    offscreenGfxBuffer.stroke(brushColor);
    offscreenGfxBuffer.noFill();
  }

  // draw the specific brush shape depending on brushType
  let xCenter = xBrush;
  let yCenter = yBrush;
  let halfShapeSize = brushSize / 2;
  switch (brushType) {
    case 0: // draw circle
      offscreenGfxBuffer.circle(xCenter, yCenter, brushSize);
      break;
    case 1: // draw square
      // Draw rectangle based on center coordinates
      offscreenGfxBuffer.rectMode(CENTER);
      offscreenGfxBuffer.square(xCenter, yCenter, brushSize);
      break;
    case 2: // draw triangle
      let x1 = xCenter - halfShapeSize;
      let y1 = yCenter + halfShapeSize;

      let x2 = xCenter;
      let y2 = yCenter - halfShapeSize;

      let x3 = xCenter + halfShapeSize;
      let y3 = y1;

      offscreenGfxBuffer.triangle(x1, y1, x2, y2, x3, y3)
  }
}


function draw() {
   // Draw the current brush stroke at the given x, y position
  // But we don't draw to canvas, we draw to the offscreenGfxBuffer
  drawBrushStroke(mouseX, mouseY);
  
  // Draw the offscreen buffer to the screen
  image(offscreenGfxBuffer, 0, 0);

  // Check to see if we are supposed to draw our instructions
  if(showInstructions){
    drawInstructions();
  }
}


function drawInstructions(){
  // Some instructions to the user
  noStroke();
  fill(255);
  let tSize = 10;

  textSize(tSize);
  let yText = 2;
  let yBuffer = 1;
  let xText = 3;
  text("KEYBOARD COMMANDS", xText, yText + tSize);
  yText += tSize + yBuffer;
  text("'i' : Show/hide instructions", xText, yText + tSize);
  
  yText += tSize + yBuffer;
  text("'l' : Clear the screen", xText, yText + tSize);
  
  yText += tSize + yBuffer;
  let strBrushType = "'b' : Set brush type (" + mapBrushTypeToShapeName[brushType] + ")";
  text(strBrushType, xText, yText + tSize);
  
  yText += tSize + yBuffer;
  let strToggleFillMode = "'f' : Toggle fill mode (" + mapBrushFillMode[brushFillMode] + ")";
  text(strToggleFillMode, xText, yText + tSize);

  yText += tSize + yBuffer;
  let strConnectToSerial = "'o' : Open serial (";
  if(serial.isOpen()){
    strConnectToSerial += "connected";
  }else{
    strConnectToSerial += "not connected";
  }
  strConnectToSerial += ")";
  text(strConnectToSerial, xText, yText + tSize);
}

function keyPressed() {
  let lastFillMode = brushFillMode;
  let lastBrushType = brushType;
  print("keyPressed", key);
  if(key == 'f'){
    brushFillMode++;
    if (brushFillMode >= Object.keys(mapBrushFillMode).length) {
      brushFillMode = 0;
    }
  }else if(key == 'b'){
    brushType++;
    if (brushType >= Object.keys(mapBrushTypeToShapeName).length) {
      brushType = 0;
    }
  }else if(key == 'i'){
    showInstructions = !showInstructions;
  }else if(key == 'l'){
    // To clear the screen, simply "draw" over the existing
    // graphics buffer with an empty background
    offscreenGfxBuffer.background(100);
  }else if(key == 'o'){
    if (!serial.isOpen()) {
      serial.connectAndOpen(null, serialOptions);
    }
  }
}

/**
 * Callback function by serial.js when there is an error on web serial
 * 
 * @param {} eventSender 
 */
 function onSerialErrorOccurred(eventSender, error) {
  console.log("onSerialErrorOccurred", error);
  pHtmlMsg.html(error);
}

/**
 * Callback function by serial.js when web serial connection is opened
 * 
 * @param {} eventSender 
 */
function onSerialConnectionOpened(eventSender) {
  console.log("onSerialConnectionOpened");
  pHtmlMsg.html("Serial connection opened successfully");
}

/**
 * Callback function by serial.js when web serial connection is closed
 * 
 * @param {} eventSender 
 */
function onSerialConnectionClosed(eventSender) {
  console.log("onSerialConnectionClosed");
  pHtmlMsg.html("onSerialConnectionClosed");
}

/**
 * Callback function serial.js when new web serial data is received
 * 
 * @param {*} eventSender 
 * @param {String} newData new data received over serial
 */
function onSerialDataReceived(eventSender, newData) {
  console.log("onSerialDataReceived", newData);
  pHtmlMsg.html("onSerialDataReceived: " + newData);
}

/**
 * Called automatically by the browser through p5.js when mouse clicked
 */
// function mouseClicked() {
//   if (!serial.isOpen()) {
//     serial.connectAndOpen(null, serialOptions);
//   }
// }

//we wull use the arduino controller, no the mouse
