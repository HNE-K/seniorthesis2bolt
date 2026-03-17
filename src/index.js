// Global variables used as trackers later
var slider = null;
var currentSeason = "spring";
// Unicorn trackers
var BG_section = null;
var unicorn = null;
var facingRight = null;
var left_coord = 0;
var top_coord = 0;
var isMoving = null;
var speed = 8;
// dot trackers for artwork locations
var art1 = null;
var art2 = null;
var art3 = null;
// preview window trackers
var art1Preview = null;
var art2Preview = null;
var art3Preview = null;
var art4Preview = null;
// preview window's button/link text trackers
var art1Link = null;
var art2Link = null;
var art3Link = null;
var art4Link = null;

// Unicorn functions
// get initial position
function startMove() {
    if (unicorn) {
        left_coord = unicorn.offsetLeft;
        top_coord = unicorn.offsetTop;
    }
}
// insert new coordinates into unicorn's CSS
function moving(e) {
    if (unicorn) {
        updatePos(e);
        unicorn.style.left = left_coord + "px";
        unicorn.style.top = top_coord + "px";
    }
}
// change initial position into new coordinates as long as document.onkeydown
function updatePos(event) {
    left_coord = unicorn.offsetLeft;
    top_coord = unicorn.offsetTop;
    if (!event) {
        var event = window.Event;
    }
    var pressed_key = null;
    // .keyCode and .which both identify which key was pressed, but different browsers support one or the other
    if (event.keyCode) {
        pressed_key = event.keyCode;
    }
    else if (event.which) {
        pressed_key = event.which;
    }
    BG_section = document.getElementById("BG");
    var unicorn_rect = unicorn.getBoundingClientRect(); // DIFFERENT THAN offsetLeft! .left of this is the left coordinate calculated from the current view "relative" not whole webpage "absolute"
    switch (pressed_key) {
        case 65: // 37 is left arrow, 65 is A
            isMoving = true;
            if (left_coord < 0) {
                break; // don't go off-screen. Test the number in the condition! It depends on unicorn's size.
            }
            if (facingRight) {
                unicorn.style.transform = "scaleX(1)"; // flip
                facingRight = false;
            }
            // gap between left edge of unicorn and BG_section's left is less than 20%
            if (unicorn_rect.left / window.innerWidth < 0.1) {
                window.scrollBy(-speed, 0);
            }
            left_coord -= speed;
            break;
        case 87: // 38 is up arrow, 87 is W
            isMoving = true;
            if (top_coord < 0) {
                break;
            }
            if (unicorn_rect.top / window.innerHeight < 0.1) {
                window.scrollBy(0, -speed);
            }
            top_coord -= speed;
            break;
        case 68: // 39 is right arrow, 68 is D
            isMoving = true;
            if (left_coord > BG_section.clientWidth - unicorn.clientWidth) { // unicorn's top left corner cannot be same as the right edge
                break;
            }
            if (!facingRight) {
                unicorn.style.transform = "scaleX(-1)"; // flip, opposite to scaleX(-1)
                facingRight = true;
            }
            if (unicorn_rect.left / window.innerWidth > 0.8) {
                window.scrollBy(speed, 0);
            }
            left_coord += speed;
            break;
        case 83: // 40 is down arrow, 83 is S
            isMoving = true;
            if (top_coord > BG_section.clientHeight - unicorn.clientHeight) { // unicorn's top left corner cannot be same as the bottom edge
                break;
            }
            if (unicorn_rect.top / window.innerHeight > 0.6) {
                window.scrollBy(0, speed);
            }
            top_coord += speed;
            break;
        default:
            break;
    }
    // artwork previews. If using percentages to check whether the unicorn is near the dot, tune each artpreview individually bc percentages expand the further down/right the dot is.
    var art1_rect = art1.getBoundingClientRect();
    var art1_left = art1_rect.left + document.body.scrollLeft; // bc svg don't support .offsetLeft, estimation of .offsetLeft = art1's left-wise coordinate relative to the viewport + how much the page is scrolled horizontally (the part that's not visible when you've scrolled)
    var art1_top = art1_rect.top + document.body.scrollTop;
    if ((left_coord - art1_left)/art1_left >= -0.18 && (left_coord - art1_left)/art1_left < 0.1 && (top_coord - art1_top)/art1_top >= -0.4 && (top_coord - art1_top)/art1_top < 0.2) {
        art1Preview.style.visibility = "visible";
    } else {
        art1Preview.style.visibility = "hidden";
    }

    var art2_rect = art2.getBoundingClientRect();
    var art2_left = art2_rect.left + document.body.scrollLeft; // estimation of offsetLeft = art1's left-wise coordinate relative to the viewport (can see) + how much the page is scrolled horizontally (not visible when you've scrolled)
    var art2_top = art2_rect.top + document.body.scrollTop;
    // if (left_coord - art2_left >= -60 && left_coord - art2_left <= 0 && top_coord - art2_top >= -60 && top_coord - art2_top <= 0) {
    if ((left_coord - art2_left)/art2_left >= -1.5 && (left_coord - art2_left)/art2_left < 0.6 && (top_coord - art2_top)/art2_top >= -0.3 && (top_coord - art2_top)/art2_top < 0.1) {
        art2Preview.style.visibility = "visible";
    } else {
        art2Preview.style.visibility = "hidden";
    }

    var art3_rect = art3.getBoundingClientRect();
    var art3_left = art3_rect.left + document.body.scrollLeft; // estimation of offsetLeft = art1's left-wise coordinate relative to the viewport (can see) + how much the page is scrolled horizontally (not visible when you've scrolled)
    var art3_top = art3_rect.top + document.body.scrollTop;
    if ((left_coord - art3_left)/art3_left >= -0.15 && (left_coord - art3_left)/art3_left < 0.05 && (top_coord - art3_top)/art3_top >= -0.2 && (top_coord - art3_top)/art3_top < 0.2) {
        art3Preview.style.visibility = "visible";
    } else {
        art3Preview.style.visibility = "hidden";
    }

    var art4_rect = art4.getBoundingClientRect();
    var art4_left = art4_rect.left + document.body.scrollLeft; // estimation of offsetLeft = art1's left-wise coordinate relative to the viewport (can see) + how much the page is scrolled horizontally (not visible when you've scrolled)
    var art4_top = art4_rect.top + document.body.scrollTop;
    if ((left_coord - art4_left)/art4_left >= -0.14 && (left_coord - art4_left)/art4_left < 0.08 && (top_coord - art4_top)/art4_top >= -0.4 && (top_coord - art4_top)/art4_top < 0.2) {
        art4Preview.style.visibility = "visible";
    } else {
        art4Preview.style.visibility = "hidden";
    }

}

function sliderChecker() {
    if (slider.value >= 1 && slider.value <= 25) {
        currentSeason = "spring";
        BG_img.src = "images/Senior_Thesis_Map_Spring.png";
        art1Link.innerHTML = "Mt. Creativity";
        art2Link.innerHTML = "The First Fairy's Shrine";
        art3Link.innerHTML = "Forest of Guardians";
        art4Link.innerHTML = "Passage to Paradise";
    }
    if (slider.value >= 26 && slider.value <= 50) {
        currentSeason = "summer";
        BG_img.src = "images/Senior_Thesis_Map_Summer.png";
        // leaves_container.style.display = "none";
        // leaves_canvas.style.display = "none";
        art1Link.innerHTML = "Magmanimous Dragon's Soup Kitchen";
        art2Link.innerHTML = "Toasty Refuge";
        art3Link.innerHTML = "Charcoal Woods";
        art4Link.innerHTML = "Cliff Dragon's Diving Board";
    }
    if (slider.value >= 51 && slider.value <= 75) {
        // initial batch of leaves
        // purpose: natural initial position. Looks better than without (straight line eww) but still a huge and separated batch is not ideal
        // if (currentSeason != "autumn") {
        //     var leaves = document.querySelectorAll(".leaf");
        //     for (var j = 0; j < leaves.length; j++) {
        //         leaves[j].style.top = Math.random()*window.innerHeight + "px";
        //         leaves[j].style.visibility = "hidden"; // just hide this batch. the subsequent leaves look natural enough.
        //     }
        // }
        currentSeason = "autumn";
        BG_img.src = "images/Senior_Thesis_Map_Autumn.png";
        snow_canvas.style.display = "none";
        // leaves_container.style.display = "block";
        // leaves_canvas.style.display = "block";
        art1Link.innerHTML = "Rebirth Recycling, Inc.";
        art2Link.innerHTML = "Phoenix Airlines Landing Pad";
        art3Link.innerHTML = "Goldenbell Woods";
        art4Link.innerHTML = "Silverscissor Gates";
    }
    if (slider.value >= 76 && slider.value <= 100) {
        currentSeason = "winter";
        BG_img.src = "images/Senior_Thesis_Map_Winter.png";
        // leaves_container.style.display = "none";
        // leaves_canvas.style.display = "none";
        snow_canvas.style.display = "inline-block";
        art1Link.innerHTML = "Mt. Vein";
        art2Link.innerHTML = "Snowfox Den";
        art3Link.innerHTML = "Nightlight Forest";
        art4Link.innerHTML = "Fortress Cliffs"
    }
}

// Runs everything upon the webpage loading
function init() {
    // UNICORN MOVING
    unicorn = document.getElementById("unicorn");
    facingRight = true;
    art1 = document.getElementById("art1");
    art2 = document.getElementById("art2");
    art3 = document.getElementById("art3");
    art1Preview = document.getElementById("art1Preview");
    art2Preview = document.getElementById("art2Preview");
    art3Preview = document.getElementById("art3Preview");
    art4Preview = document.getElementById("art4Preview");
    document.onkeydown = startMove;
    document.onkeydown = moving; // similar to AddEventListener. Every time a key is pressed, run moving()...
    document.onkeypress = moving; // in case browser supports .onkeypress instead of .onkeydown
    // UNICORN ANIMATION
    const frames = document.getElementById("unicorn").children;
    var BG_section = document.getElementById("BG");
    let i = 0; // frame number
    isMoving = false;
    // loop through the frame's numbers. setInterval means do this stuff on loop every 100 ms = 0.1 s
    setInterval(function () {
        // if swimming, no need to care about isMoving
        if ( // 1st box: left half of ocean
            (left_coord < 0.09*BG_section.clientWidth && top_coord < 0.15*BG_section.clientHeight && top_coord > 0.03*BG_section.clientHeight)
            || // 2nd box: right half of ocean before mountain
            (left_coord > 0.09*BG_section.clientWidth && left_coord < 0.22*BG_section.clientWidth && top_coord < 0.2*BG_section.clientHeight && top_coord > 0.03*BG_section.clientHeight)
            || // 3rd box: corner next to mountaintop
            (left_coord > 0.22*BG_section.clientWidth && left_coord < 0.25*BG_section.clientWidth && top_coord < 0.1*BG_section.clientHeight && top_coord > 0.03*BG_section.clientHeight)
            || // 3.5a1 box: very top ocean strip (wide)
            (left_coord > 0.22*BG_section.clientWidth && left_coord < 0.30*BG_section.clientWidth && top_coord < 0.06*BG_section.clientHeight && top_coord >= 0.03*BG_section.clientHeight)
            || // 3.5a2 box: ocean strip below top (narrower to avoid peak)
            (left_coord > 0.22*BG_section.clientWidth && left_coord < 0.26*BG_section.clientWidth && top_coord < 0.10*BG_section.clientHeight && top_coord >= 0.06*BG_section.clientHeight)
            || // 3.5b box: lower ocean alongside mountain peak (narrower)
            (left_coord > 0.22*BG_section.clientWidth && left_coord < 0.26*BG_section.clientWidth && top_coord < 0.18*BG_section.clientHeight && top_coord >= 0.10*BG_section.clientHeight)
            || // 4th box: fjord entrance
            (left_coord > 0.38*BG_section.clientWidth && left_coord < 0.47*BG_section.clientWidth && top_coord < 0.25*BG_section.clientHeight && top_coord > 0.15*BG_section.clientHeight)
            || // 5th box: fjord middle
            (left_coord > 0.41*BG_section.clientWidth && left_coord < 0.49*BG_section.clientWidth && top_coord < 0.33*BG_section.clientHeight && top_coord >= 0.25*BG_section.clientHeight)
            || // 6th box: fjord middle bend
            (left_coord > 0.44*BG_section.clientWidth && left_coord < 0.49*BG_section.clientWidth && top_coord < 0.45*BG_section.clientHeight && top_coord >= 0.33*BG_section.clientHeight)
            || // 7th box: fjord fork
            (left_coord > 0.40*BG_section.clientWidth && left_coord < 0.47*BG_section.clientWidth && top_coord < 0.52*BG_section.clientHeight && top_coord >= 0.43*BG_section.clientHeight)
            || // 8th box: flow from mountain into fjord
            (left_coord > 0.33*BG_section.clientWidth && left_coord <= 0.40*BG_section.clientWidth && top_coord < 0.53*BG_section.clientHeight && top_coord >= 0.49*BG_section.clientHeight)
            || // 9th box: crater lake
            (left_coord > 0.69*BG_section.clientWidth && left_coord < 0.8*BG_section.clientWidth && top_coord < 0.78*BG_section.clientHeight && top_coord > 0.55*BG_section.clientHeight)
        ) { // there are 9 frames for swimming rn
            // deactivate running and standing frames. For some reason computation is faster if deactivate them separately. Don't do % 18.
            frames[i % 8].style.display = "none";
            frames[8 + i % 10].style.display = "none";
            // activate swimming frames
            frames[i % 7 + 18].style.display = "none";
            frames[++i % 7 + 18].style.display = "inline-block";
        }
        // if not swimming, need to differentiate between running and standing
        else {
            if (isMoving) { // there are 8 frames for running rn
                // deactivate standing and swimming frames
                frames[8 + i % 10].style.display = "none";
                frames[18 + i % 7].style.display = "none";
                // deactivate running frames first so that only one frame activates at a time
                frames[i % 8].style.display = "none";
                // activate the running frame. ++i returns the value after incrementing i, opposite of i++.
                frames[++i % 8].style.display = "inline-block";
            }
            else { // there are 10 frames for standing rn
                // deactivate the running and swimming frames
                frames[i % 8].style.display = "none";
                frames[18 + i % 7].style.display = "none";
                // activate the standing frames
                frames[i % 10 + 8].style.display = "none";
                frames[++i % 10 + 8].style.display = "inline-block";
            }
        }
    }, 100);


    // CHANGING SEASONS
    slider = document.getElementById("slider");
    slider.addEventListener("input", (event) => {
        slider.style.setProperty("--thumb-rotate", `${(event.target.value/100) * 2160}deg`);
    });
    var BG_img = document.getElementById("BG_img");
    var snow_canvas = document.getElementById("snow_canvas");
    // var leaves_container = document.getElementById("leaves_container");
    // var leaves_canvas = document.getElementById("leaves_canvas");
    art1Link = document.getElementById("art1Link");
    art2Link = document.getElementById("art2Link");
    art3Link = document.getElementById("art3Link");
    art4Link = document.getElementById("art4Link");
    sliderChecker(); // run once to initialize
    slider.oninput = sliderChecker; // run again upon moving the slider
    // slider.value = 1; // reset slider knob upon reloading webpage

    // WINTER SNOW ANIMATION
    // firstly set up by getting canvas and context
    // var snow_canvas = document.getElementById("snow_canvas");
    var snow_context = snow_canvas.getContext("2d");
    // snow_context.translate(0.5, 0.5);
    // set canvas's dimensions to viewport's or the parent section's
    var h = document.getElementById("BG").clientHeight;
    var w = document.getElementById("BG").clientWidth;
    // console.log(typeof(h), typeof(w));
    snow_canvas.height = h;
    snow_canvas.width = w;
    // console.log(snow_canvas.height, snow_canvas.width);
    // if user resizes the window, adjust canvas size
    // function resize_canvas(ev) {
    //     w = canvas.width = window.innerWidth;
    //     h = canvas.height = window.innerHeight;
    // };
    // window.addEventListener("resize", resize_canvas);
    // Particles/snowflakes
    var max_flakes = 100;
    var flakes = [];
    // Random number generator in range from min to max
    function random(min, max) {
        return min + Math.random() * (max - min + 1);
    };
    // Generate the values associated with each snowflake & save them into the array
    function setup_flakes() {
        for (var i = 0; i < max_flakes; i++) {
            flakes.push(
                {
                    x: Math.random() * w, // Math.random() generates a decimal between 0 & 1
                    y: Math.random() * h,
                    opacity: Math.random(),
                    speedX: random(-11, 11),
                    speedY: random(7, 15),
                    radius: random(0.5, 2.2),
                }
            )
        }
    };
    // Use the saved values to generate snowflakes
    function generate_flakes() {
        for (var i = 0; i < max_flakes; i++) {
            // Canvas has a function for creating a gradient between 2 circles. Create it on the Context
            var gradient = snow_context.createRadialGradient(
                flakes[i].x, // x-coordinate of starting circle's origin
                flakes[i].y, // y-coordinate of starting circle's origin
                0, // radius of starting circle
                flakes[i].x, // x-coordinate of ending circle's origin
                flakes[i].y, // y-coordinate of ending circle's origin
                flakes[i].radius
            );
            // Canvas's addColorStop function is like adding a marker on a gradient slider. Takes in position 0-1 along the "slider" and color's CSS value
            gradient.addColorStop(0, "rgba(255, 255, 255," + flakes[i].opacity + ")"); // white, but with the opacity saved in the array
            gradient.addColorStop(0.8, "rgba(210, 236, 242," + flakes[i].opacity + ")"); // light blue " "
            gradient.addColorStop(1, "rgba(237, 247, 249," + flakes[i].opacity + ")"); // even lighter blue " "
            // Draw the snowflake using arc function on Canvas Context
            snow_context.beginPath(); // this function starts drawing a new path
            snow_context.arc(
                flakes[i].x, // x-coordinate of arc's center/origin
                flakes[i].y, // y-coordinate of arc's center/origin
                flakes[i].radius, // radius of arc (arc just means partial or full circle)
                0, // starting angle
                Math.PI*2, // ending angle (circumference formula)
                false // counterclockwise/clockwise whatever lol
            );
            // var gradient is of variable type CanvasGradient, acceptable for fillStyle parameter.
            // the gradient and Context/snowflake have the same dimensions sourced from the array :)
            snow_context.fillStyle = gradient;
            snow_context.fill();
        }
    };
    function move_flakes() {
        for (var i = 0; i < flakes.length; i++) {
            flakes[i].x += flakes[i].speedX; // move right/left
            flakes[i].y += flakes[i].speedY; // move up/down
            // reset snowflakes that went off-canvas to anywhere along the top of canvas
            if (flakes[i].y > h) {
                flakes[i].x = Math.random() * w;
                flakes[i].y = -50; // negative value, thus actually off-screen so the reset snowflake doesn't appear suddenly
            }
        }
    };
    // A function that runs the generation and movement of snowflakes
    function snowfall() {
        // start with a clean Context
        snow_context.clearRect(0, 0, w, h); // top left coordinates of rectangle and its dimensions
        generate_flakes();
        move_flakes();
    };
    // Actually run the functions defined above!
    setInterval(snowfall, 50);
    setup_flakes();

    
    // AUTUMN LEAVES ANIMATION
    // //leaf-ified snow code
    // var leaves_context = leaves_canvas.getContext("2d");
    // // set canvas's dimensions to viewport's or the parent section's
    // var h = parseFloat(document.getElementById("BG").clientHeight);
    // var w = parseFloat(document.getElementById("BG").clientWidth);
    // leaves_canvas.clientHeight = h;
    // leaves_canvas.clientWidth = w;
    // // Leaves
    // var max_leaves = 10;
    // var leaves = [];
    // var actual_leaves = [];
    // // Random number generator in range from min to max
    // function random(min, max) {
    //     return min + Math.random() * (max - min + 1);
    // };
    // // Generate the values associated with each leaf & save them into the array
    // function setup_leaves() {
    //     for (var i = 0; i < max_leaves; i++) {
    //         leaves.push(
    //             {
    //                 x: Math.random() * w, // Math.random() generates a decimal between 0 & 1
    //                 y: Math.random() * h,
    //                 speedX: random(-11, 11),
    //                 speedY: random(7, 15),
    //                 radius: random(0.5, 4.2),
    //             }
    //         )
    //     }
    // };
    // // Use the saved values to generate leaves
    // function generate_leaves() {
    //     for (var i = 0; i < max_leaves; i++) {
    //         // var leaf = document.createElement("div");
    //         // leaf.innerHTML = '<img src="https://art.pixilart.com/sr20867d214926b.png">';
    //         // leaf.classList.add("leaf");
    //         // leaf.style.left = leaves[i].x + "px";
    //         // leaf.style.top = leaves[i].y + "px";
    //         // leaves_canvas.appendChild(leaf);
    //         // actual_leaves.push(leaf);
    //         console.log(leaves[i].x, leaves[i].y);
    //         const img = new Image(); // Create new img element
    //         img.src = "https://art.pixilart.com/sr20867d214926b.png";
    //         img.style.height = 20 + "px";
    //         img.style.width = 20 + "px";
    //         actual_leaves.push(img);
    //         leaves_context.drawImage(img, leaves[i].x, leaves[i].y);
    //     }
    // };
    // function move_leaves() {
    //     for (var i = 0; i < leaves.length; i++) {
    //         leaves[i].x += leaves[i].speedX; // move right/left
    //         actual_leaves[i].style.left = leaves[i].x + "px"; // don't forget to update the actual leaf
    //         leaves[i].y += leaves[i].speedY; // move up/down
    //         actual_leaves[i].style.top = leaves[i].y + "px";
    //         // reset leaves that went off-canvas to anywhere along the top of canvas
    //         if (leaves[i].y > h) {
    //             leaves[i].x = Math.random() * w;
    //             actual_leaves[i].style.left = leaves[i].x + "px";
    //             leaves[i].y = -50;
    //             actual_leaves[i].style.top = leaves[i].y + "px";
    //         }
    //     }
    // };
    // // A function that runs the generation and movement of snowflakes
    // function leaf_fall() {
    //     // start with a clean Context
    //     leaves_context.clearRect(0, 0, w, h); // top left coordinates of rectangle and its dimensions
    //     generate_leaves();
    //     move_leaves();
    // };
    // // Actually run the functions defined above!
    // // setInterval(leaf_fall, 50);
    // setup_leaves();
    // leaf_fall();
    
    // Copy-pasted basically word for word from old files (doesn't work at all?!)
    // var leaves_container = document.getElementById("leaves_container");
    // var leaves_range = leaves_container.clientWidth; // to expand the leaves' range to cover the whole map, which is also 2 times the initial window
    // function createLeaf() {
    //     var leaf = document.createElement("div");
    //     leaf.innerHTML = '<img src="https://art.pixilart.com/sr20867d214926b.png">';
    //     leaf.classList.add("leaf");
    //     leaf.style.left = Math.random() * leaves_range + "px";
    //     leaves_container.appendChild(leaf);
    // }
    // setInterval(createLeaf, 100);
    // var windStrength = 1;
    // var windDirection = 1;
    // function updateLeafPosition(leaf) {
    //     leaf.style.top = parseInt(leaf.style.top) + 1 + "px";
    //     leaf.style.left = parseInt(leaf.style.left) + windDirection * windStrength + "px";
    //     if (parseInt(leaf.style.top) > parseInt(document.getElementById("BG_img").clientHeight)) {
    //         leaf.remove();
    //     }
    // }
    // setInterval(function () {
    //     var leaves = document.querySelectorAll(".leaf");
    //     for (var i = 0; i < leaves.length; i++) {
    //         updateLeafPosition(leaves[i]);
    //     }
    // }, 10);
    // document.addEventListener("mousemove", (event) => {
    //     var divider = window.innerWidth / 2;
    //     var x_mouse = event.pageX;
    //     if (x_mouse > divider) {
    //         windDirection = 1;
    //     } else {
    //         windDirection = -1;
    //     }
    // });
    // document.addEventListener("mousemove", (event2) => {
    //     var divider = window.innerWidth / 2;
    //     var x_mouse2 = event2.pageX;
    //     if (x_mouse2 > divider && x_mouse2 < divider + 300) {
    //         windStrength = 1;
    //     } else if (x_mouse2 > divider + 300 && x_mouse2 < divider + 600) {
    //         windStrength = 2;
    //     } else if (x_mouse2 > divider + 600) {
    //         windStrength = 3;
    //     } else if (x_mouse2 < divider && x_mouse2 > divider - 300) {
    //         windStrength = 1;
    //     } else if (x_mouse2 < divider - 300 && x_mouse2 > divider - 600) {
    //         windStrength = 2;
    //     } else if (x_mouse2 < divider - 600) {
    //         windStrength = 3;
    //     }
    // });

    // My thorough notes on the copy-pasted from old files
    // var leaves_container = document.getElementById("leaves_container");
    // var leaves_range = document.getElementById("BG").clientWidth; // to expand the leaves' range to cover the whole map
    // function create_leaf() {
    //     var leaf = document.createElement("div");
    //     leaf.innerHTML = '<img src = "https://art.pixilart.com/sr20867d214926b.png">';
    //     leaf.classList.add("leaf"); // create leaf class
    //     leaf.style.left = Math.random() * leaves_range + "px"; // set leaf's initial x position
    //     // leaf.style.top = Math.random() * -50 + "px"; // some leaves' initial y position should be off-screen?
    //     leaf.firstChild.style.height = Math.random() * 20 + "px";
    //     leaf.firstChild.style.width = Math.random() * 20 + "px";
    //     leaves_container.appendChild(leaf); // put this div inside the container
    // }
    // setInterval(create_leaf, 100); // generate a leaf every 100ms
    // var wind_strength = 1;
    // var wind_direction = 1;
    // // make leaves follow mouse
    // document.addEventListener("mousemove", (event) => {
    //     var divider = window.innerWidth/2;
    //     var x_mouse = event.pageX; // snapshots the mouse's x position relative to the whole webpage including stuff cut out by scrolling when the mouse moved
    //     // How much is the base wind_strength? Depends on which section of the viewport mouse is in
    //     if ((x_mouse > divider && x_mouse < divider + 300) || (x_mouse < divider && x_mouse > divider - 300)) {
    //         wind_strength = 1;
    //     }
    //     else if ((x_mouse > divider + 300 && x_mouse < divider + 600) || (x_mouse < divider - 300 && x_mouse > divider - 600)) {
    //         wind_strength = 2;
    //     }
    //     else if ((x_mouse > divider + 600) || (x_mouse < divider - 600)) {
    //         wind_strength = 3;
    //     }
    // });
    // function move_leaf(leaf) {
    //     leaf.style.top = parseInt(leaf.style.top) + 1 + "px"; // CSS attributes are strings!
    //     leaf.style.left = parseInt(leaf.style.left) + wind_direction * wind_strength + "px";
    //     if (parseInt(leaf.style.top) > leaves_container.clientHeight) {
    //         leaf.remove();
    //     }
    // }
    // // move all of the leaves
    // setInterval(function(){
    //     var leaves = document.querySelectorAll(".leaf");
    //     for (var i = 0; i < leaves.length; i++) {
    //         move_leaf(leaves[i]);
    //     }
    // }, 10);
}

window.onload = init; // need this line to actually run all this code.

// senses when user is not clicking the running buttons bc doing so turns isMoving into true
// keyup means when any button is released, but isMoving limits to AWSD.
document.addEventListener('keyup', (event) => {
    if (isMoving) {
        isMoving = false;
    }
});