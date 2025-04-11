// Get the bubble container and add a canvas element inside it
const bubbleContainer = document.getElementById('bubble');
const bubbleCanvas = document.createElement('canvas');
bubbleContainer.appendChild(bubbleCanvas);
const ctx = bubbleCanvas.getContext('2d');

// Function to resize the canvas dynamically
function resizeCanvas() {
  const leftSection = document.querySelector('.left-section');
  bubbleCanvas.width = leftSection.clientWidth;
  bubbleCanvas.height = leftSection.clientHeight;
}

// Call resizeCanvas to initialize the canvas size
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Detect if we're on mobile
const isMobile = window.innerWidth <= 768;

// Get the elements we want to detect collisions with
const targetElementIds = ['linkedin', 'github', 'codepen', 'luck-checker'];

// Bubble properties
const bubbles = [];
const totalBubbles = isMobile ? 20 : 80; // Even fewer bubbles on mobile
const shatterPieces = []; // Array to store shatter effect pieces

// Set speed and fill rate based on device
const mobileSpeedFactor = 0.4; // Mobile devices get 40% of desktop speed
const mobileFillFactor = 0.6; // Mobile devices get 60% of desktop fill rate

// Initialize bubbles with some already in the scene
for (let i = 0; i < totalBubbles; i++) {
  const baseSpeedY = Math.random() * 0.5 + 0.2; // Base slower speed
  
  bubbles.push({
    x: Math.random() * bubbleCanvas.width,
    y: Math.random() * bubbleCanvas.height * 2 - bubbleCanvas.height, // Some above, some below
    radius: Math.random() * 4 + 2, // Slightly smaller bubbles
    speedX: (Math.random() - 0.5) * 0.2 * (isMobile ? mobileSpeedFactor : 1), // Even slower on mobile
    speedY: baseSpeedY * (isMobile ? mobileSpeedFactor : 1), // MUCH slower on mobile
    opacity: Math.random() * 0.5 + 0.3,
    isBouncing: false,
    bounceSpeed: 0,
    color: `rgba(173, 216, 230, ${Math.random() * 0.3 + 0.3})`, // Varying blue shades
    isShattered: false, // Flag to track if the bubble has already created a shatter effect
  });
}

// Constants - adjusted for slower falling
const GRAVITY = isMobile ? 0.012 : 0.03; // Ultra-low gravity on mobile
const BOUNCE_VELOCITY_LOSS = 0.6;
const MAX_SPEED = isMobile ? 2 : 5; // Even lower max speed on mobile
const BASE_WATER_FILL_RATE = 0.0006; // Base fill rate (slower than before)
const WATER_FILL_RATE = BASE_WATER_FILL_RATE * (isMobile ? mobileFillFactor : 1); // Slower on mobile
const MAX_WATER_LEVEL = 0.95; // Fill almost the entire container
const RIPPLE_DURATION = 40; // How long ripples last in frames
const SHATTER_DURATION = 50; // How long shatter pieces last in frames
const SHATTER_PIECE_COUNT = isMobile ? 5 : 7; // How many pieces to create when shattering

// Water properties
let waterLevel = 0;
let lastBubbleFillTime = 0;
const ripples = []; // Array to store ripple effects

// Water wave effect variables
let waveAmplitude = isMobile ? 2 : 3; // Even smaller waves on mobile
let waveFrequency = 0.05; // Frequency of waves
let wavePhase = 0; // Used to animate waves

// Store element dimensions
let elementRects = {};
let luckCheckerCanvasWidth = 0;

// Function to update element dimensions
function updateElementRects() {
  for (const elementId of targetElementIds) {
    const element = document.getElementById(elementId);
    if (element) {
      const rect = element.getBoundingClientRect();
      const canvasRect = bubbleCanvas.getBoundingClientRect();
      
      // Adjust coordinates to be relative to canvas
      elementRects[elementId] = {
        left: rect.left - canvasRect.left,
        top: rect.top - canvasRect.top,
        right: rect.left - canvasRect.left + rect.width,
        bottom: rect.top - canvasRect.top + rect.height,
        width: rect.width,
        height: rect.height
      };
      
      // Special handling for luck-checker to get its canvas width
      if (elementId === 'luck-checker') {
        const luckCanvas = element.querySelector('canvas');
        if (luckCanvas) {
          luckCheckerCanvasWidth = luckCanvas.width;
        } else {
          // If the canvas isn't available yet, use a default
          luckCheckerCanvasWidth = 300; // Default from your code
        }
      }
    }
  }
}

// Update element positions on resize and initially
window.addEventListener('resize', updateElementRects);
// Delay the initial update slightly to ensure all elements are rendered
setTimeout(updateElementRects, 500);

// Function to create a ripple when a bubble hits the water
function createRipple(x, radius) {
  ripples.push({
    x,
    radius: radius * 2, // Starting ripple radius
    maxRadius: radius * (isMobile ? 6 : 8), // Smaller ripples on mobile
    age: 0,
    opacity: 0.5,
  });
}

// Function to create shatter effect when a bubble hits an element
function createShatterEffect(x, y, radius, elementId) {
  // Different colors for different elements
  let baseColor;
  switch(elementId) {
    case 'linkedin': baseColor = '10, 102, 194'; break; // LinkedIn blue
    case 'github': baseColor = '36, 41, 46'; break; // GitHub dark
    case 'codepen': baseColor = '47, 47, 47'; break; // CodePen dark
    case 'luck-checker': baseColor = '76, 175, 80'; break; // Green
    default: baseColor = '173, 216, 230'; // Default blue
  }

  // Create shatter pieces
  for (let i = 0; i < SHATTER_PIECE_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    const size = Math.random() * (radius / 2) + (radius / 4);
    const opacity = Math.random() * 0.3 + 0.4;
    
    shatterPieces.push({
      x,
      y,
      radius: size,
      speedX: Math.cos(angle) * speed * (isMobile ? mobileSpeedFactor : 1),
      speedY: (Math.sin(angle) * speed - 1) * (isMobile ? mobileSpeedFactor : 1), // Bias upward
      color: `rgba(${baseColor}, ${opacity})`,
      age: 0,
      elementId
    });
  }
  
  // Animate the element that was hit
  const element = document.getElementById(elementId);
  if (element) {
    element.style.transition = 'transform 0.2s ease-out';
    element.style.transform = 'scale(1.05)';
    
    setTimeout(() => {
      element.style.transition = 'transform 0.3s ease-in';
      element.style.transform = 'scale(1)';
    }, 200);
  }
}

// Collision detection with water
function checkWaterCollision(bubble) {
  const waterY = bubbleCanvas.height - waterLevel * bubbleCanvas.height;
  return bubble.y + bubble.radius >= waterY;
}

// Check if a bubble collides with any of our target elements
function checkElementCollision(bubble) {
  // First update element rects if they don't exist yet
  if (Object.keys(elementRects).length === 0) {
    updateElementRects();
  }
  
  for (const elementId of targetElementIds) {
    const rect = elementRects[elementId];
    if (!rect) continue;
    
    // Special handling for luck-checker with its canvas
    if (elementId === 'luck-checker') {
      const luckElement = document.getElementById('luck-checker');
      
      // Center of the luck checker element
      const luckCenterX = rect.left + rect.width / 2;
      
      // Get the actual width of the canvas or use default if not available
      const actualCanvasWidth = luckCheckerCanvasWidth || 300;
      
      // Calculate the effective width of the canvas relative to the screen
      const effectiveWidth = Math.min(rect.width, actualCanvasWidth);
      
      // Define the actual collision area (half of the effective width on each side)
      const halfWidth = effectiveWidth / 2;
      const actualLeft = luckCenterX - halfWidth;
      const actualRight = luckCenterX + halfWidth;
      
      // Check if bubble is within this actual width
      if (bubble.x + bubble.radius > actualLeft && 
          bubble.x - bubble.radius < actualRight && 
          bubble.y + bubble.radius > rect.top && 
          bubble.y - bubble.radius < rect.bottom) {
            
        return {
          id: elementId,
          top: rect.top,
          bottom: rect.bottom,
          left: actualLeft,
          right: actualRight,
          isLuckChecker: true
        };
      }
    } else {
      // Regular collision detection for other elements
      if (bubble.x + bubble.radius > rect.left &&
          bubble.x - bubble.radius < rect.right &&
          bubble.y + bubble.radius > rect.top &&
          bubble.y - bubble.radius < rect.bottom) {
        return {
          id: elementId,
          top: rect.top,
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right
        };
      }
    }
  }
  return null;
}

// Create new bubbles periodically to replace those that have "become water"
function replenishBubbles() {
  // Count active bubbles
  const activeBubbles = bubbles.filter(b => b.y < bubbleCanvas.height * 2).length;
  
  // If we're below our desired count, add more
  if (activeBubbles < totalBubbles) {
    const newBubbles = Math.min(isMobile ? 2 : 3, totalBubbles - activeBubbles); // Fewer at a time on mobile
    
    for (let i = 0; i < newBubbles; i++) {
      const baseSpeedY = Math.random() * 0.5 + 0.2;
      
      bubbles.push({
        x: Math.random() * bubbleCanvas.width,
        y: -Math.random() * 20 - 10, // Start just above the canvas
        radius: Math.random() * 4 + 2,
        speedX: (Math.random() - 0.5) * 0.2 * (isMobile ? mobileSpeedFactor : 1),
        speedY: baseSpeedY * (isMobile ? mobileSpeedFactor : 1), // Much slower on mobile
        opacity: Math.random() * 0.5 + 0.3,
        isBouncing: false,
        bounceSpeed: 0,
        color: `rgba(173, 216, 230, ${Math.random() * 0.3 + 0.3})`,
        isShattered: false, // Initialize with false
      });
    }
  }
}

// Debug function to show element boundaries
function drawElementBoundaries() {
  // Only draw in debug mode
  const debugMode = false;
  if (!debugMode) return;
  
  for (const elementId of targetElementIds) {
    const rect = elementRects[elementId];
    if (rect) {
      // Regular element boundary
      ctx.strokeStyle = 'yellow';
      ctx.lineWidth = 2;
      ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);
      
      // For luck-checker, also show the actual collision area
      if (elementId === 'luck-checker') {
        const luckCenterX = rect.left + rect.width / 2;
        const effectiveWidth = Math.min(rect.width, luckCheckerCanvasWidth || 300);
        const halfWidth = effectiveWidth / 2;
        
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          luckCenterX - halfWidth, 
          rect.top, 
          effectiveWidth, 
          rect.height
        );
      }
      
      // Label
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.fillText(elementId, rect.left, rect.top - 5);
    }
  }
}

// Time-based fill control to make filling more consistent across devices
let lastFrameTime = 0;
const fillInterval = isMobile ? 400 : 300; // Milliseconds between fill increments

// Animation loop for the bubbles
function animateBubbles(timestamp) {
  // Calculate time delta for consistent animations across devices
  const deltaTime = timestamp - lastFrameTime;
  lastFrameTime = timestamp;
  
  ctx.clearRect(0, 0, bubbleCanvas.width, bubbleCanvas.height);
  
  // Update wave phase for water movement (slower wave movement)
  wavePhase += isMobile ? 0.015 : 0.02;
  
  // Draw the water with a wave effect
  const waterY = bubbleCanvas.height - waterLevel * bubbleCanvas.height;
  
  // Draw the water background
  ctx.fillStyle = 'rgba(173, 216, 230, 0.3)';
  ctx.fillRect(0, waterY, bubbleCanvas.width, waterLevel * bubbleCanvas.height);
  
  // Draw water surface with waves
  ctx.beginPath();
  ctx.moveTo(0, waterY);
  
  for (let x = 0; x < bubbleCanvas.width; x += 10) {
    const y = waterY + Math.sin(x * waveFrequency + wavePhase) * waveAmplitude;
    ctx.lineTo(x, y);
  }
  
  ctx.lineTo(bubbleCanvas.width, waterY);
  ctx.lineTo(bubbleCanvas.width, bubbleCanvas.height);
  ctx.lineTo(0, bubbleCanvas.height);
  ctx.closePath();
  
  // Create gradient for water
  const waterGradient = ctx.createLinearGradient(0, waterY, 0, bubbleCanvas.height);
  waterGradient.addColorStop(0, 'rgba(173, 216, 230, 0.6)');
  waterGradient.addColorStop(1, 'rgba(100, 149, 237, 0.4)');
  ctx.fillStyle = waterGradient;
  ctx.fill();
  
  // Draw ripples on water surface
  for (let i = ripples.length - 1; i >= 0; i--) {
    const ripple = ripples[i];
    ripple.age++;
    
    // Expand ripple
    ripple.radius += (ripple.maxRadius - ripple.radius) * 0.1;
    ripple.opacity = 0.5 * (1 - ripple.age / RIPPLE_DURATION);
    
    // Draw ripple
    ctx.beginPath();
    ctx.arc(ripple.x, waterY, ripple.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 255, 255, ${ripple.opacity})`;
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Remove old ripples
    if (ripple.age >= RIPPLE_DURATION) {
      ripples.splice(i, 1);
    }
  }
  
  // Update and draw shatter effect pieces
  for (let i = shatterPieces.length - 1; i >= 0; i--) {
    const piece = shatterPieces[i];
    
    // Apply gravity and movement
    piece.x += piece.speedX;
    piece.y += piece.speedY;
    piece.speedY += GRAVITY * 0.7; // Lower gravity for shatter pieces
    piece.age++;
    
    // Calculate opacity based on age
    const lifeProgress = piece.age / SHATTER_DURATION;
    const opacity = 1 - lifeProgress;
    
    // Draw the piece
    ctx.beginPath();
    ctx.arc(piece.x, piece.y, piece.radius * (1 - lifeProgress * 0.5), 0, Math.PI * 2);
    ctx.fillStyle = piece.color.replace(/[\d\.]+\)$/, opacity + ')');
    ctx.fill();
    
    // Remove old pieces
    if (piece.age >= SHATTER_DURATION) {
      shatterPieces.splice(i, 1);
    }
  }
  
  // Process each bubble
  for (let i = 0; i < bubbles.length; i++) {
    const bubble = bubbles[i];
    
    if (bubble.isBouncing) {
      // Move the bubble upwards during bounce
      bubble.y -= bubble.bounceSpeed;
      bubble.bounceSpeed -= GRAVITY;
      
      // Stop the bounce when it slows down enough
      if (bubble.bounceSpeed <= 0) {
        bubble.isBouncing = false;
        bubble.bounceSpeed = 0;
      }
    } else {
      // Add slight horizontal movement to simulate wind/drift
      bubble.x += bubble.speedX;
      
      // Check for element collisions
      const collision = checkElementCollision(bubble);
      if (collision && !bubble.isShattered) {
        // Create shatter effect
        createShatterEffect(bubble.x, bubble.y, bubble.radius, collision.id);
        
        // Mark this bubble as having shattered, but let it continue falling
        bubble.isShattered = true;
        
        // Maybe reduce opacity to simulate partial bursting
        bubble.opacity = bubble.opacity * 0.5;
        bubble.radius = bubble.radius * 0.7; // Make it smaller
      }
      
      // Check for water collision
      if (checkWaterCollision(bubble)) {
        // When bubble hits water surface
        if (!bubble.isBouncing) {
          // Create a ripple effect
          createRipple(bubble.x, bubble.radius);
          
          // Reset this bubble (move it to the top)
          bubble.y = -Math.random() * 20 - 10;
          bubble.x = Math.random() * bubbleCanvas.width;
          bubble.isShattered = false; // Reset shattered state
          bubble.opacity = Math.random() * 0.5 + 0.3; // Reset opacity
          bubble.radius = Math.random() * 4 + 2; // Reset radius
          
          // Use time-based filling rather than every bubble impact
          if (timestamp - lastBubbleFillTime > fillInterval) {
            if (waterLevel < MAX_WATER_LEVEL) {
              waterLevel += WATER_FILL_RATE;
              waveAmplitude = (isMobile ? 2 : 3) * (waterLevel < 0.5 ? waterLevel * 2 : (1 - waterLevel) * 2);
              lastBubbleFillTime = timestamp;
            }
          }
        }
      } else {
        // Bubble falls down with gravity
        bubble.y += bubble.speedY;
        bubble.speedY += GRAVITY;
        if (bubble.speedY > MAX_SPEED) bubble.speedY = MAX_SPEED;
      }
    }
    
    // Bounce off the canvas edges
    if (bubble.x + bubble.radius > bubbleCanvas.width) {
      bubble.x = bubbleCanvas.width - bubble.radius;
      bubble.speedX = -Math.abs(bubble.speedX);
    } else if (bubble.x - bubble.radius < 0) {
      bubble.x = bubble.radius;
      bubble.speedX = Math.abs(bubble.speedX);
    }
    
    // Only draw bubbles that are in the viewport
    if (bubble.y < bubbleCanvas.height * 2) {
      // Draw the bubble with gradient
      ctx.beginPath();
      ctx.ellipse(bubble.x, bubble.y, bubble.radius, bubble.radius * 1.3, 0, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(
        bubble.x - bubble.radius / 3,
        bubble.y - bubble.radius / 3,
        0,
        bubble.x,
        bubble.y,
        bubble.radius
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${bubble.isShattered ? 0.3 : 0.7})`);
      gradient.addColorStop(1, bubble.color);
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Add a subtle highlight to bubbles (smaller if shattered)
      if (!bubble.isShattered) {
        ctx.beginPath();
        ctx.arc(bubble.x - bubble.radius / 3, bubble.y - bubble.radius / 3, bubble.radius / 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fill();
      }
    }
  }
  
  // Draw element boundaries for debugging
  drawElementBoundaries();
  
  // Replenish bubbles as needed
  replenishBubbles();
  
  requestAnimationFrame(animateBubbles);
}

// Give a moment for the page to fully load, then start animation
setTimeout(() => {
  // Try to get luck canvas information first
  const luckElement = document.getElementById('luck-checker');
  if (luckElement) {
    const luckCanvas = luckElement.querySelector('canvas');
    if (luckCanvas) {
      luckCheckerCanvasWidth = luckCanvas.width;
    }
  }
  
  updateElementRects();
  requestAnimationFrame(animateBubbles);
}, 1000);