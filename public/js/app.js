var BGL = (function(THREE){
  'use strict';

  var scene, grid, renderer, ws,
    gridOptions = {
      layers: 10,
      color: 0x0000ff
    };

  var createScene = function() {
    var scene = new THREE.Scene();
    BGL.renderer = new THREE.WebGLRenderer({ alpha: true });

    BGL.renderer.setSize(window.innerWidth - 100, window.innerHeight - 100);

    document.getElementById('canvas').appendChild(BGL.renderer.domElement);

    return scene;
  };

  return {
    createScene: createScene,
    gridOptions: gridOptions,
    grid: grid,
    renderer: renderer
  };
}(THREE));

function animate() {
  requestAnimationFrame(render);
  BGL.controls.update();
  render();
}

function render() {
  requestAnimationFrame(render);
  BGL.renderer.render(scene, BGL.controls.camera());
}

function createAGrid(opts) {
  return new THREE.Object3D();
}

function push(msg) {
  console.log('pushing', msg);
  ws.send(JSON.stringify(msg));
}

function clearScene() {
  scene.children[1].children = [];
}

function onMessage(m) {
  var data = JSON.parse(m.data);
  console.log('Recieved message', m);
  if (data.result === 'coordinates') {
    clearScene();
    var cells = BGL.cells.processCell(data.data);
    cells.forEach(function(cell) {
      BGL.grid.add(cell);
    });
    animate();
    setTimeout(function() {
      if (!isPaused()) {
        push({action: 'tick'});
      }
    }, 500);
  }
}

function isPaused() {
  return document.getElementById('pause').active;
}

function connectToSocket(openCallback) {
  ws = new WebSocket('ws://' + window.location.host + '/live');
  ws.onmessage = onMessage;
  ws.onclose = function()  { console.log('websocket closed'); };
}

function requestCells(config) {
  push({action: 'start', layers: config.layers, fillPercent: config.fillPercent});
}

function getConfig() {
  var layers = document.getElementById('layers');
  var fillPercent = document.getElementById('fill-percent');
  return {
    layers: layers.value,
    fillPercent: fillPercent.value
  };
}

function toggleLife() {
  var start = document.getElementById('start');
  var pause = document.getElementById('pause');
  if (start.active) { // .active is the previous value as button transition has not happend yet
    push({action: 'stop'});
    start.textContent = 'Start';
    start.classList.remove('red');
    start.classList.add('green');
    pause.disabled = true;
    pause.active = false;
  } else {
    var config = getConfig();
    clearScene();
    BGL.controls.positionCamera(config.layers * 2.5);
    requestCells(config);
    start.textContent = 'Stop';
    start.classList.remove('green');
    start.classList.add('red');
    pause.disabled = false;
  }
}

function togglePause() {
  var pause = document.getElementById('pause');
  if (pause.active) { // .active is the previous value as button transition has not happend yet
    push({action: 'tick'});
  }
}

document.addEventListener("DOMContentLoaded", function() {
  scene = BGL.createScene();
  BGL.controls.create();
  scene.add(BGL.cells.createCenter());
  BGL.grid = createAGrid(BGL.gridOptions);
  scene.add(BGL.grid);
  connectToSocket(requestCells);

  document.getElementById('start').addEventListener('click', toggleLife);
  document.getElementById('pause').addEventListener('click', togglePause);
});
