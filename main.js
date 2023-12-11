// Title and description of the game
title = "Gravefall";
description = `Click to dodge`;

// Game design variables
const G = {
    WIDTH: 100,
    HEIGHT: 150,
	BRICK_WIDTH: 100 / 10, 
    BRICK_HEIGHT: 5,       // Height of each brick
    GRAVE_SPEED: 1.0, // Speed of falling graves
    PLAYER_SPEED: 2.0, // Player's movement speed
    GRAVITY: 0.1, // Gravity effect on the player
    // ... other game variables ...
};

// Game runtime options
options = {
    viewSize: { x: G.WIDTH, y: G.HEIGHT },
    isPlayingBgm: true,
};

// Player state
let player = {
    pos: vec(G.WIDTH * 0.5, G.HEIGHT - 10), // Player's position
    arrowAngle: 0,                         // Current angle of the arrow
    arrowRotationSpeed: 0.05,              // Speed at which the arrow rotates
    vel: vec(0, 0),                        // Player's velocity, useful for movement physics
    isJumping: false,                      // Flag to indicate if the player is jumping
    jumpPower: 5,                          // Power or height of the player's jump
};

// Array to store falling graves
let graves = [];

// Initialize the game
// Array to store bricks
let bricks = [];

// Initialize the game
function init() {
    player.pos = vec(G.WIDTH * 0.5, G.HEIGHT - G.BRICK_HEIGHT * 2 - 10);
    player.arrowAngle = 0;
    player.vel = vec(0, 0);
    player.isJumping = false;
    graves = [];

    // Clear the existing bricks and reinitialize them
    bricks = []; // Clear the bricks array
    initBricks(); // Reinitialize bricks
}


function initBricks() {
    const pyramidHeight = 5; // Height of the pyramid in rows
    const maxRowWidth = 10; // Maximum width of a row in bricks

    for (let row = 0; row < pyramidHeight; row++) {
        // Calculate the number of bricks in the current row
        let numBricksInRow = maxRowWidth - row;

        // Calculate the starting position for the first brick in the row
        let startX = row * G.BRICK_WIDTH / 2;

        for (let i = 0; i < numBricksInRow; i++) {
            bricks.push({
                pos: vec(startX + i * G.BRICK_WIDTH, G.HEIGHT - G.BRICK_HEIGHT - row * G.BRICK_HEIGHT)
            });
        }
    }
}






// Function to update and render bricks
function updateBricks() {
    bricks.forEach(brick => {
        color("blue");
        box(brick.pos, G.BRICK_WIDTH, G.BRICK_HEIGHT);
    });
}



// The game loop function
function update() {
    if (!ticks) {
        init(); // Initialize the game
    }

    // Update player
    updatePlayer();

    // Spawn and update graves
    updateGraves();

    // Check for collisions and game over conditions
    checkCollisions();

	updateBricks(); 

	if (bricks.length === 0) {
        end(); // End the game
    }
}

// Function to update the player's position and actions
function updatePlayer() {
    color("black");
    box(player.pos, 10, 10); // Adjust size as needed

    // Update the arrow's angle
    player.arrowAngle += player.arrowRotationSpeed;

    // Check for player input
    if (input.isJustPressed && !player.isJumping) {
        player.vel = vec(G.PLAYER_SPEED).rotate(player.arrowAngle);
        player.isJumping = true;
    }

    // Apply gravity to the player's velocity
    player.vel.y += G.GRAVITY;
    player.pos.add(player.vel);

    // Check for collision with bricks
    let onBrick = false;
    bricks.forEach(brick => {
        if (player.pos.x >= brick.pos.x && player.pos.x < brick.pos.x + G.BRICK_WIDTH &&
            player.pos.y >= brick.pos.y - 10 && player.pos.y < brick.pos.y) {
            player.pos.y = brick.pos.y - 10; // Adjust to stand on the brick
            player.vel.y = 0;
            player.isJumping = false;
            onBrick = true;
        }
    });

    // Check if the player lands on the ground
    if (!onBrick && player.pos.y >= G.HEIGHT - G.BRICK_HEIGHT * 2 - 10 && player.vel.y > 0) {
        player.pos.y = G.HEIGHT - G.BRICK_HEIGHT * 2 - 10;
        player.vel.y = 0;
        player.isJumping = false;
    }

    // Keep the player within the game boundaries
    player.pos.clamp(0, G.WIDTH, 0, G.HEIGHT);

    // Draw the player and the arrow
    color("black");
    char("a", player.pos);
    line(player.pos, vec(player.pos).add(vec(10).rotate(player.arrowAngle)));
}


let graveSpawnTimer = 0; // Timer to control the spawning of graves

function updateGraves() {
    // Spawn graves one by one at regular intervals
    if (graveSpawnTimer <= 0) {
        const targetX = player.pos.x + rnd(-10, 10); // Randomize target position slightly
        graves.push({
            pos: vec(rnd(0, G.WIDTH), 0),
            speed: G.GRAVE_SPEED,
            targetX: targetX,
            stuck: false
        });
        graveSpawnTimer = 30; // Adjust the timer for the next grave spawn
    } else {
        graveSpawnTimer--;
    }

    graves.forEach((grave, graveIndex) => {
        grave.pos.x += (grave.targetX - grave.pos.x) * 0.05;
        grave.pos.y += grave.speed;

        // Check for collision with bricks
        bricks.forEach((brick, brickIndex) => {
            if (grave.pos.distanceTo(brick.pos) < 10) { // Collision threshold
                // Remove the brick and increase score
                bricks.splice(brickIndex, 1);
                addScore(10);

                // Mark the grave for removal
                graves.splice(graveIndex, 1);
            }
        });

        // Render the grave
        color("black");
        box(grave.pos, 3, 6);

        // Mark graves that go off-screen for removal
        if (grave.pos.y > G.HEIGHT) {
            graves.splice(graveIndex, 1);
        }
    });
}









function checkCollisions() {
	// Check for collision between player and graves
	graves.forEach((grave) => {
	  if (grave.pos.distanceTo(player.pos) < 5) { // Assuming a threshold of 5 units
		end(); // Game over due to collision with a grave
	  }
	});
  
	// Check for collision between two rectangles and the brick
	for (let i = 0; i < bricks.length; i++) {
	  const brick1 = bricks[i];
	  for (let j = i + 1; j < bricks.length; j++) {
		const brick2 = bricks[j];
		if (isColliding(brick1, brick2)) {
		  // If colliding, remove both bricks and the two rectangles
		  bricks.splice(i, 1);
		  bricks.splice(j - 1, 1);
		  // Add score for removing both rectangles
		  addScore(20);
		  break; // No need to check further if collision is found
		}
	  }
	}
  }
  
  function isColliding(brick1, brick2) {
	// Check if any corner of one brick is inside the other brick
	return (
	  brick1.pos.x < brick2.pos.x + G.BRICK_WIDTH &&
	  brick1.pos.x + G.BRICK_WIDTH > brick2.pos.x &&
	  brick1.pos.y < brick2.pos.y + G.BRICK_HEIGHT &&
	  brick1.pos.y + G.BRICK_HEIGHT > brick2.pos.y
	);
  }

// Implementing isGapBelowPlayer()
function isGapBelowPlayer(playerPosition) {
// Check if the player's position aligns with any brick
	return !bricks.some(brick => {
	return playerPosition.x >= brick.pos.x &&
	playerPosition.x < brick.pos.x + G.BRICK_WIDTH &&
	playerPosition.y >= brick.pos.y &&
	playerPosition.y < brick.pos.y + G.BRICK_HEIGHT;
	});
}


// Implementing isGapBelowPlayer()
function isGapBelowPlayer(playerPosition) {
    // Check if the player's position aligns with any brick
    return !bricks.some(brick => {
        return playerPosition.x >= brick.pos.x &&
               playerPosition.x < brick.pos.x + G.BRICK_WIDTH &&
               playerPosition.y >= brick.pos.y &&
               playerPosition.y < brick.pos.y + G.BRICK_HEIGHT;
    });
}


// Implementing isGapBelowPlayer()
function isGapBelowPlayer(playerPosition) {
    // Assuming bricks are laid out horizontally and have a set width
    const brickWidth = 10; // Example width of each brick
    const playerX = Math.floor(playerPosition.x / brickWidth); // Player's x position in terms of bricks

    // Check if there's a gap below the player
    const gapBelow = !bricks.some(brick => {
        const brickX = Math.floor(brick.pos.x / brickWidth);
        return brickX === playerX && brick.pos.y === playerPosition.y;
    });

    return gapBelow;
}

addEventListener("load", onLoad);
