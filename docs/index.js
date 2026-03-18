var currentSeason = 'spring';
var unicorn = null;
var BG_section = null;
var BG_img = null;
var BG_img_old = null;
var viewport = null;
var slider = null;
var snow_canvas = null;
var frames = [];
var _seasonTransitionId = 0;

var facingRight = true;
var left_coord = 0;
var top_coord = 0;
var isMoving = false;
var speed = 4;
var targetX = null;
var targetY = null;
var lastActiveFrame = -1;

var viewportScale = 1;
var minScale = 0.5;
var maxScale = 2;
var viewportX = 0;
var viewportY = 0;
var isDragging = false;
var dragStartX = 0;
var dragStartY = 0;
var dragInitialViewportX = 0;
var dragInitialViewportY = 0;
var lastTouchDistance = 0;

var cachedBGWidth = 0;
var cachedBGHeight = 0;
var cachedUnicornWidth = 0;
var cachedUnicornHeight = 0;

var artPreviews = [];
var artLinks = [];
var artPositions = [
    { top: 0.30, left: 0.32 },
    { top: 0.50, left: 0.05 },
    { top: 0.80, left: 0.44 },
    { top: 0.37, left: 0.54 }
];

var mapImages = {
    spring: 'images/Senior_Thesis_Map_Spring.png',
    summer: 'images/Senior_Thesis_Map_Summer.png',
    autumn: 'images/Senior_Thesis_Map_Autumn.png',
    winter: 'images/Senior_Thesis_Map_Winter.png'
};

function initDotSVGs() {
    var template = document.getElementById('dot-template');
    var ids = ['art1', 'art2', 'art3', 'art4'];
    ids.forEach(function(id) {
        var container = document.getElementById(id);
        var clone = template.content.cloneNode(true);
        container.appendChild(clone);
    });
}

function cacheLayoutDimensions() {
    cachedBGWidth = BG_section.offsetWidth;
    cachedBGHeight = BG_section.offsetHeight;
    cachedUnicornWidth = unicorn.offsetWidth;
    cachedUnicornHeight = unicorn.offsetHeight;
}

function preloadImages() {
    Object.keys(mapImages).forEach(function(key) {
        var img = new Image();
        img.src = mapImages[key];
    });
}

function setActiveFrame(index) {
    if (lastActiveFrame === index) return;
    if (lastActiveFrame >= 0 && lastActiveFrame < frames.length) {
        frames[lastActiveFrame].classList.remove('frame-active');
    }
    if (index >= 0 && index < frames.length) {
        frames[index].classList.add('frame-active');
    }
    lastActiveFrame = index;
}

function isInWater() {
    var cx = (left_coord + cachedUnicornWidth / 2) / cachedBGWidth;
    var cy = (top_coord + cachedUnicornHeight) / cachedBGHeight;

    return (
        (cx < 0.09 && cy < 0.15 && cy > 0.03)
        || (cx > 0.09 && cx < 0.22 && cy < 0.20 && cy > 0.03)
        || (cx > 0.22 && cx < 0.25 && cy < 0.15 && cy > 0.03)
        || (cx > 0.22 && cx < 0.30 && cy < 0.06 && cy >= 0.03)
        || (cx > 0.22 && cx < 0.26 && cy < 0.10 && cy >= 0.06)
        || (cx > 0.22 && cx < 0.26 && cy < 0.18 && cy >= 0.10)
        || (cx > 0.42 && cx < 0.47 && cy < 0.25 && cy > 0.15)
        || (cx > 0.44 && cx < 0.52 && cy < 0.33 && cy >= 0.25)
        || (cx > 0.44 && cx < 0.52 && cy < 0.40 && cy >= 0.33)
        || (cx > 0.43 && cx < 0.49 && cy < 0.44 && cy >= 0.40)
        || (cx > 0.42 && cx < 0.47 && cy < 0.47 && cy >= 0.44)
        || (cx > 0.41 && cx < 0.45 && cy < 0.50 && cy >= 0.47)
        || (cx > 0.39 && cx <= 0.43 && cy < 0.53 && cy >= 0.50)
        || (cx > 0.70 && cx < 0.84 && cy < 0.78 && cy > 0.55)
    );
}

function setTarget(x, y) {
    var maxX = cachedBGWidth - cachedUnicornWidth;
    var maxY = cachedBGHeight - cachedUnicornHeight;

    targetX = Math.max(0, Math.min(maxX, x - cachedUnicornWidth / 2));
    targetY = Math.max(0, Math.min(maxY, y - cachedUnicornHeight / 2));
    isMoving = true;
}

function moveToTarget() {
    if (!isMoving || targetX === null || targetY === null) {
        return;
    }

    var dx = targetX - left_coord;
    var dy = targetY - top_coord;
    var distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < speed) {
        left_coord = targetX;
        top_coord = targetY;
        isMoving = false;
        targetX = null;
        targetY = null;
    } else {
        var angle = Math.atan2(dy, dx);
        left_coord += Math.cos(angle) * speed;
        top_coord += Math.sin(angle) * speed;

        if (dx > 0 && !facingRight) {
            unicorn.style.transform = 'scaleX(-1)';
            facingRight = true;
        } else if (dx < 0 && facingRight) {
            unicorn.style.transform = 'scaleX(1)';
            facingRight = false;
        }
    }

    unicorn.style.left = left_coord + 'px';
    unicorn.style.top = top_coord + 'px';

    checkArtProximity();
    updateCameraPosition();
}

function updateCameraPosition() {
    var viewportWidth = viewport.clientWidth;
    var viewportHeight = viewport.clientHeight;

    var unicornCenterX = left_coord + cachedUnicornWidth / 2;
    var unicornCenterY = top_coord + cachedUnicornHeight / 2;

    viewportX = unicornCenterX - viewportWidth / 2 / viewportScale;
    viewportY = unicornCenterY - viewportHeight / 2 / viewportScale;

    var maxViewportX = cachedBGWidth - viewportWidth / viewportScale;
    var maxViewportY = cachedBGHeight - viewportHeight / viewportScale;

    viewportX = Math.max(0, Math.min(maxViewportX, viewportX));
    viewportY = Math.max(0, Math.min(maxViewportY, viewportY));

    applyViewportTransform();
}

function applyViewportTransform() {
    BG_section.style.transform = 'translate(' + (-viewportX) + 'px, ' + (-viewportY) + 'px) scale(' + viewportScale + ')';
}

function checkArtProximity() {
    var ux = left_coord / cachedBGWidth;
    var uy = top_coord / cachedBGHeight;
    var threshold = 0.06;

    for (var i = 0; i < artPositions.length; i++) {
        var dx = ux - artPositions[i].left;
        var dy = uy - artPositions[i].top;
        var dist = Math.sqrt(dx * dx + dy * dy);
        artPreviews[i].style.visibility = dist < threshold ? 'visible' : 'hidden';
    }
}

function updateSeason() {
    var value = slider.value;
    var newSeason, newSrc, snowVisible, labels;

    if (value >= 1 && value <= 25) {
        newSeason = 'spring';
        newSrc = mapImages.spring;
        snowVisible = false;
        labels = ['Mt. Creativity', "The First Fairy's Shrine", 'Forest of Guardians', 'Passage to Paradise'];
    } else if (value >= 26 && value <= 50) {
        newSeason = 'summer';
        newSrc = mapImages.summer;
        snowVisible = false;
        labels = ["Magmanimous Dragon's Soup Kitchen", 'Toasty Refuge', 'Charcoal Woods', "Cliff Dragon's Diving Board"];
    } else if (value >= 51 && value <= 75) {
        newSeason = 'autumn';
        newSrc = mapImages.autumn;
        snowVisible = false;
        labels = ['Rebirth Recycling, Inc.', 'Phoenix Airlines Landing Pad', 'Goldenbell Woods', 'Silverscissor Gates'];
    } else {
        newSeason = 'winter';
        newSrc = mapImages.winter;
        snowVisible = true;
        labels = ['Mt. Vein', 'Snowfox Den', 'Nightlight Forest', 'Fortress Cliffs'];
    }

    for (var i = 0; i < labels.length; i++) {
        artLinks[i].innerHTML = labels[i];
    }
    snow_canvas.style.display = snowVisible ? 'inline-block' : 'none';

    if (newSeason !== currentSeason) {
        currentSeason = newSeason;
        _seasonTransitionId++;
        var transitionId = _seasonTransitionId;

        BG_img_old.src = BG_img.src;
        BG_img_old.classList.add('fading');
        BG_img.src = newSrc;

        BG_img_old.addEventListener('transitionend', function onEnd() {
            if (transitionId !== _seasonTransitionId) return;
            BG_img_old.classList.remove('fading');
            BG_img_old.removeEventListener('transitionend', onEnd);
        });
    }
}

function handleMapClick(e) {
    if (e.target.closest('#slider') || e.target.closest('#open_instructions') || e.target.closest('#instructions') || e.target.closest('.preview')) {
        return;
    }

    var rect = viewport.getBoundingClientRect();
    var clickX = e.clientX - rect.left;
    var clickY = e.clientY - rect.top;

    var x = (clickX / viewportScale) + viewportX;
    var y = (clickY / viewportScale) + viewportY;

    setTarget(x, y);
}

function handleTouchStart(e) {
    if (e.touches.length === 1) {
        var touch = e.touches[0];

        if (touch.target.closest('#slider') || touch.target.closest('#open_instructions') || touch.target.closest('#instructions') || touch.target.closest('.preview')) {
            return;
        }

        isDragging = true;
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
        dragInitialViewportX = viewportX;
        dragInitialViewportY = viewportY;
    } else if (e.touches.length === 2) {
        e.preventDefault();
        isDragging = false;
        var touch1 = e.touches[0];
        var touch2 = e.touches[1];
        lastTouchDistance = getTouchDistance(touch1, touch2);
    }
}

function handleTouchMove(e) {
    if (e.touches.length === 1 && isDragging) {
        var touch = e.touches[0];
        var deltaX = touch.clientX - dragStartX;
        var deltaY = touch.clientY - dragStartY;

        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
            return;
        }

        e.preventDefault();
    } else if (e.touches.length === 2) {
        e.preventDefault();
        var touch1 = e.touches[0];
        var touch2 = e.touches[1];
        var distance = getTouchDistance(touch1, touch2);

        if (lastTouchDistance > 0) {
            var delta = distance - lastTouchDistance;
            var scaleChange = delta * 0.01;
            viewportScale = Math.max(minScale, Math.min(maxScale, viewportScale + scaleChange));
            applyViewportTransform();
        }

        lastTouchDistance = distance;
    }
}

function handleTouchEnd(e) {
    if (e.changedTouches.length === 1 && isDragging) {
        var touch = e.changedTouches[0];
        var deltaX = touch.clientX - dragStartX;
        var deltaY = touch.clientY - dragStartY;

        if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
            var rect = viewport.getBoundingClientRect();
            var touchX = touch.clientX - rect.left;
            var touchY = touch.clientY - rect.top;

            var x = (touchX / viewportScale) + viewportX;
            var y = (touchY / viewportScale) + viewportY;
            setTarget(x, y);
        }
    }

    isDragging = false;
    lastTouchDistance = 0;
}

function getTouchDistance(touch1, touch2) {
    var dx = touch2.clientX - touch1.clientX;
    var dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function initSnowAnimation() {
    var snow_context = snow_canvas.getContext('2d');
    var h = cachedBGHeight;
    var w = cachedBGWidth;
    snow_canvas.height = h;
    snow_canvas.width = w;

    var max_flakes = 400;
    var flakes = [];
    var flakeSprites = [];

    function random(min, max) {
        return min + Math.random() * (max - min);
    }

    for (var i = 0; i < max_flakes; i++) {
        var radius = random(0.5, 2.5);
        var opacity = random(0.3, 0.9);
        var size = Math.ceil(radius * 2 + 2);
        var offscreen = document.createElement('canvas');
        offscreen.width = size;
        offscreen.height = size;
        var ctx = offscreen.getContext('2d');
        var cx = size / 2;
        var cy = size / 2;
        var gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, ' + opacity + ')');
        gradient.addColorStop(0.5, 'rgba(230, 240, 245, ' + (opacity * 0.7) + ')');
        gradient.addColorStop(1, 'rgba(220, 235, 240, 0)');
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2, false);
        ctx.fillStyle = gradient;
        ctx.fill();

        flakes.push({
            x: Math.random() * w,
            y: Math.random() * h,
            speedY: random(0.3, 1.5),
            swayAmp: random(0.2, 1.0),
            swaySpeed: random(0.005, 0.02),
            phase: Math.random() * Math.PI * 2
        });
        flakeSprites.push(offscreen);
    }

    var tick = 0;

    function snowfall() {
        snow_context.clearRect(0, 0, w, h);
        tick++;

        for (var i = 0; i < max_flakes; i++) {
            var f = flakes[i];
            var spriteSize = flakeSprites[i].width;

            snow_context.drawImage(
                flakeSprites[i],
                f.x - spriteSize / 2,
                f.y - spriteSize / 2
            );

            f.x += Math.sin(tick * f.swaySpeed + f.phase) * f.swayAmp;
            f.y += f.speedY;

            if (f.y > h + 10) {
                f.x = Math.random() * w;
                f.y = -10;
            }
            if (f.x > w + 10) f.x = -10;
            if (f.x < -10) f.x = w + 10;
        }

        requestAnimationFrame(snowfall);
    }

    requestAnimationFrame(snowfall);
}

function startAnimationLoop() {
    var frameIndex = 0;
    var lastFrameTime = 0;
    var frameDelay = 1000 / 12;

    function animate(currentTime) {
        moveToTarget();

        if (currentTime - lastFrameTime >= frameDelay) {
            if (isInWater()) {
                setActiveFrame(12 + (frameIndex % 4));
            } else if (isMoving) {
                setActiveFrame(frameIndex % 8);
            } else {
                setActiveFrame(8 + (frameIndex % 4));
            }

            frameIndex++;
            lastFrameTime = currentTime;
        }

        requestAnimationFrame(animate);
    }

    animate(0);
}

function waitForBGLoad(callback) {
    if (BG_img.complete && BG_img.naturalWidth > 0) {
        callback();
        return;
    }
    BG_img.addEventListener('load', callback, { once: true });
}

function init() {
    unicorn = document.getElementById('unicorn');
    BG_section = document.getElementById('BG');
    BG_img = document.getElementById('BG_img');
    BG_img_old = document.getElementById('BG_img_old');
    viewport = document.getElementById('viewport');
    slider = document.getElementById('slider');
    snow_canvas = document.getElementById('snow_canvas');
    frames = Array.from(unicorn.children);

    initDotSVGs();

    artPreviews = [
        document.getElementById('art1Preview'),
        document.getElementById('art2Preview'),
        document.getElementById('art3Preview'),
        document.getElementById('art4Preview')
    ];
    artLinks = [
        document.getElementById('art1Link'),
        document.getElementById('art2Link'),
        document.getElementById('art3Link'),
        document.getElementById('art4Link')
    ];

    preloadImages();

    viewport.addEventListener('click', handleMapClick);
    viewport.addEventListener('touchstart', handleTouchStart, { passive: false });
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
    viewport.addEventListener('touchend', handleTouchEnd);

    slider.addEventListener('input', function(e) {
        slider.style.setProperty('--thumb-rotate', ((e.target.value / 100) * 2160) + 'deg');
        updateSeason();
    });

    window.addEventListener('resize', cacheLayoutDimensions);

    waitForBGLoad(function() {
        cacheLayoutDimensions();
        startAnimationLoop();
        initSnowAnimation();
        updateSeason();
        updateCameraPosition();
    });

    var instructions = document.getElementById('instructions');
    var openBtn = document.getElementById('open_instructions');
    var closeBtn = document.querySelector('.close-button');

    openBtn.addEventListener('click', function() {
        instructions.style.display = 'flex';
    });

    closeBtn.addEventListener('click', function() {
        instructions.style.display = 'none';
    });

    instructions.addEventListener('click', function(e) {
        if (e.target === instructions) {
            instructions.style.display = 'none';
        }
    });

    document.addEventListener('keydown', function(e) {
        var pressed = e.keyCode || e.which;
        var moveAmount = speed * 3;
        var bgW = cachedBGWidth;
        var bgH = cachedBGHeight;
        var uW = cachedUnicornWidth;
        var uH = cachedUnicornHeight;

        switch (pressed) {
            case 65:
            case 37:
                isMoving = true;
                targetX = null;
                targetY = null;
                if (left_coord > 0) left_coord -= moveAmount;
                if (facingRight) {
                    unicorn.style.transform = 'scaleX(1)';
                    facingRight = false;
                }
                break;
            case 87:
            case 38:
                isMoving = true;
                targetX = null;
                targetY = null;
                if (top_coord > 0) top_coord -= moveAmount;
                break;
            case 68:
            case 39:
                isMoving = true;
                targetX = null;
                targetY = null;
                if (left_coord < bgW - uW) left_coord += moveAmount;
                if (!facingRight) {
                    unicorn.style.transform = 'scaleX(-1)';
                    facingRight = true;
                }
                break;
            case 83:
            case 40:
                isMoving = true;
                targetX = null;
                targetY = null;
                if (top_coord < bgH - uH) top_coord += moveAmount;
                break;
            default:
                return;
        }

        unicorn.style.left = left_coord + 'px';
        unicorn.style.top = top_coord + 'px';
        checkArtProximity();
        updateCameraPosition();
    });

    document.addEventListener('keyup', function() {
        if (isMoving && targetX === null) {
            isMoving = false;
        }
    });
}

window.onload = init;
