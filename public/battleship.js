// establish socket.io connection

let sock = io();
let player;

// user's hitcount
let hitCount = 0;

// opponent's hitcount
let hitCountO = 0;

//set default ship placement orientation
let orientation = "horizontal";

// track how many hits each ship type has received (for enemy board)
let tracker = {
  "2": [],
  "3": [],
  "4": [],
  "5": []
}

// Establish whose turn it is to attack
let turn = true;

//establish status of opponent's readiness ('true' once all opponents' ships have been placed)
let ready = false;


/* ---------------------------------------  Define functions ------------------------------------ */

// set player (i.e. either player 1 or 2)
const setPlayer = playerNumber => {
  player = playerNumber;
};

//react to messages from socket connection
const onMessage = text => {
  let top = $('#title')[0];
  let nuevo = document.createElement('div');
  nuevo.className = 'message';
  nuevo.innerHTML = text;
  top.appendChild(nuevo);
}

// receive opponent's readiness and update variables accordingly
const setBoard = board => {
  ready = true;
  gameBoard2 = board;
}

// attack opponent
const fireTorpedo = (e) => {
  if (!ready){
    alert('your opponent has not finished setting their pieces. Please be patient :)');
    return;
  }

  if (e.target !== e.currentTarget) {
    let board;

    if (e.target.id.substring(0,1) === '1'){
      board = gameBoard;
    } else if (e.target.id.substring(0,1) === '2'){
      board = gameBoard2;
    }

   if (!turn){
      alert('It\'s currently not your turn, please wait for your opponent to make a move!');
      return;
    }

    // extract row and column # from the HTML element's id
    let row = e.target.id.substring(1,2);
    let col = e.target.id.substring(2,3);
    let value = board[row][col];

    // if player clicks an empty square, change the color and change square's value
    if (value == 0) {
      $(e.target).css("background-image", "url(/miss.jpg)");
      board[row][col] = 1;
      sock.emit('moveToServer', [player, row, col, hitCount]);
      turn = !turn;
    // if player clicks a square with a ship, change the color and change square's value
    } else if (value > 1) {

      $(e.target).css("background-image", "url(/collision-symbol.png)");

      // flip the square's value
      board[row][col] = -value;
      let holder = tracker["" + value];
      holder.push(e.target);

      if (holder.length === value){
        _.each(holder, space => {
          space.style.background = "#E2081D";
          $(space).css("background-image", "url(/collision-symbol.png)");
        })
      }

      // increment hitCount each time a ship is hit
      hitCount++;
      sock.emit('moveToServer', [player, row, col, hitCount]);
      turn = !turn;

      if (hitCount == 14) {
        alert("All enemy battleships have been defeated! You win!");
      }

    // if player clicks a square that's been previously hit, let them know
    } else if (value < 0 || value == 1) {

      alert("Stop wasting your torpedos! You already fired at this location.");

    }

    e.stopPropagation();

    }
};

// when a user attempts to select a ship to place on board
const shipSelector = e => {

  if (e.target !== e.currentTarget) {

    if(e.target.tagName !== 'LI'){
      return;
    }

    let shipType = e.target;
    let numberSquares = e.target.id.substring(1,2);
    let current = document.querySelectorAll('.active');
    // console.log(current);

    if (current[0]) {
      current[0].className = 'unplaced';
      if (current[0] === shipType){
        return;
      }
    }
    shipType.className = 'active';
  }
};


// Invoked whenever opponent makes a move
const onMove = opponentMove => {
  // console.log('move working', 'row : ', opponentMove[1], 'column: ', opponentMove[2], 'hitCount: ', opponentMove[3]);
  let row = opponentMove[1];
  let col = opponentMove[2];
  let hitCountO = opponentMove[3];

  if (hitCountO == 14){
     alert("You've been destroyed!! Better luck next time!");
  }

  function incomingAttack(torpedo){

    // identify square that is attacked
    let square = $('#' + '1' + row + col)[0];

    if (gameBoard[row][col] == 0) {
      $(square).css("background-image", "url(/miss.jpg)");
      // set this square's value to 1 to indicate that they fired and missed
      gameBoard[row][col] = 1;
    // if player clicks a square with a ship, change the color and change square's value
    } else if (gameBoard[row][col] > 1) {
      $(square).css("background-image", "url(/sunk.png)");
      // set this square's value to 2 to indicate the ship has been hit
      gameBoard[row][col] = 2;
    }
  }

  turn = true;
  incomingAttack(opponentMove);
}


// allows user to change ship-placement orientation (vertical or horizontal)
const changeOrientation = () => {
  let text = $("#orientation")[0].innerHTML;
  if (text === "To Vertical"){
    $("#orientation").html("To Horizontal");
    orientation = "vertical";
  } else if (text === "To Horizontal"){
    $("#orientation").html("To Vertical");
    orientation = "horizontal";
  }
};


// when user attempts to place selected ship onto board
function positioner(e) {
  let ship;
  // continue only if a ship is selected for placement
  if (ship = document.querySelectorAll('.active')[0]){
    let squares = [];
    let currSquare = e.target;
    let row = Number(currSquare.id.substring(1,2));
    let col = Number(currSquare.id.substring(2,3));
    let leng = Number(ship.id);
    let added = false;
    let last;

    if (orientation === "horizontal") {
      last = document.getElementById("1" + row + (col + leng - 1));
      for (i = col; i < col+leng; i++){
          let square = document.getElementById("1" + row + i);
          squares.push(square);
      }
    } else if (orientation === "vertical"){
      last = document.getElementById("1" + (row + leng - 1) + col);
      for (i = row; i < row+leng; i++){
          let square = document.getElementById("1" + i + col);
          squares.push(square);
      }
    }

    let clear = _.every(squares, function(sq){
      if (sq) {
      let currRow = Number(sq.id.substring(1,2));
      let currCol = Number(sq.id.substring(2,3));
      return gameBoard[currRow][currCol] === 0;
      } else return false;
    })

    // continue if enough space exists on board to fit currently selected ship
    if (last && clear) {
      // select all squares needed for currently-selected (active) ship type
      // check that all corresponding squares are vacant (i.e. have a value of 0)
      squares.forEach(sq => {
        sq.style.background = "#7D97EA";
      })

      currSquare.addEventListener('click', shipPlacer, false);

      function shipPlacer(e){
        _.each(squares, function(sq){
          let currRow = Number(sq.id.substring(1,2));
          let currCol = Number(sq.id.substring(2,3));
          gameBoard[currRow][currCol] = leng;
          sq.style.background = "#E11818";
        $(sq).css("background-image", "url(/ship.jpg)");
        })
        added = true;
        ship.className = "placed";
        if(!document.querySelectorAll('.unplaced')[0]){
          sock.emit('ready', [player, gameBoard]);
          alert('placed all!');
        }
      }

      currSquare.addEventListener('mouseout', onLeave, false);

      function onLeave(e){
        if (!added){
          squares.forEach(sq => {
            sq.style.background = "#FEFEFB";
          })
        } else {
          added = !added;
        }
        currSquare.removeEventListener('click', shipPlacer, false);
        e.target.removeEventListener(e.type, arguments.callee);
      };
    }
  }
}


// define function to create gameboards
const boardMaker = (divID, boardNumber) => {

    for (i = 0; i < cols; i++) {
      for (j = 0; j < rows; j++) {

        // create a new div element for each grid square
        let square = document.createElement("div");
        $('#' + divID).append(square);

        // give each div element a unique id based on its row and column (e.g. "100" = board 1, row 0, column 0)
        square.id = boardNumber + j + i;

        // set each grid square's coordinates: multiples of the current row or column number
        let topPosition = j * squareSize;
        let leftPosition = i * squareSize;

        // use CSS positioning to place each grid square on the page
        square.style.top = topPosition + 'px';
        square.style.left = leftPosition + 'px';
      }
    }
}

// grab the container elements
let gameBoardContainer = document.getElementById("gameboard"),
    gameBoardContainer2 = document.getElementById("gameboard2"),
    ships = document.getElementById("ship-selector");

// set grid rows and columns and the size of each square
let rows = 10,
    cols = 10,
    squareSize = 40;

// create two boards: gameboard = uer's board ; gameboard2 = opponent's board
boardMaker('gameboard', '1');
boardMaker('gameboard2', '2');


// Establish Arrays to track both boards' values

let gameBoard = [
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0]
        ],
    gameBoard2 = gameBoard.slice();

/* -------------------------------------- event listeners -----------------------------*/
$(gameBoardContainer2).click(fireTorpedo);
$(ships).click(shipSelector);
$("#orientation").click(changeOrientation);
gameBoardContainer.addEventListener('mouseover', positioner, false);


/* --------------------------------------  socket listeners ----------------------------- */

sock.on('opponentReady', setBoard);
// establish function triggers from socket connection
sock.on('msg', onMessage);
sock.on('player', setPlayer);

//whenever 'new-move' is sent from server, execute onMove function
sock.on('moveToClient', onMove);

