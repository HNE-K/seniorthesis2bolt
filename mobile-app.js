import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class EunicornWorld {
    constructor() {
        this.currentSeason = 'spring';
        this.unicorn = null;
        this.BG_section = null;
        this.BG_img = null;
        this.viewport = null;
        this.facingRight = true;
        this.left_coord = 0;
        this.top_coord = 0;
        this.isMoving = false;
        this.speed = 4;
        this.animationFrame = 0;
        this.targetX = null;
        this.targetY = null;
        this.sessionId = null;
        this.lastSaveTime = 0;
        this.saveDebounceMs = 2000;

        this.viewportScale = 1;
        this.minScale = 0.5;
        this.maxScale = 2;
        this.viewportX = 0;
        this.viewportY = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.lastTouchDistance = 0;

        this.mapImages = {
            spring: 'src/images/Senior_Thesis_Map_Spring.png',
            summer: 'src/images/Senior_Thesis_Map_Summer.png',
            autumn: 'src/images/Senior_Thesis_Map_Autumn.png',
            winter: 'src/images/Senior_Thesis_Map_Winter.png'
        };

        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    async init() {
        this.unicorn = document.getElementById('unicorn');
        this.BG_section = document.getElementById('BG');
        this.BG_img = document.getElementById('BG_img');
        this.viewport = document.getElementById('viewport');
        this.slider = document.getElementById('slider');
        this.snow_canvas = document.getElementById('snow_canvas');

        await this.initSession();
        this.preloadImages();
        this.setupEventListeners();
        this.startAnimationLoop();
        this.initSnowAnimation();
        this.updateCameraPosition();

        const instructions = document.getElementById('instructions');
        const openBtn = document.getElementById('open_instructions');
        const closeBtn = document.querySelector('.close-button');

        openBtn.addEventListener('click', () => {
            instructions.style.display = 'block';
        });

        closeBtn.addEventListener('click', () => {
            instructions.style.display = 'none';
        });
    }

    async initSession() {
        this.sessionId = localStorage.getItem('eunicorn_session_id');

        if (!this.sessionId) {
            this.sessionId = this.generateSessionId();
            localStorage.setItem('eunicorn_session_id', this.sessionId);

            await supabase.from('sessions').insert({
                session_id: this.sessionId,
                unicorn_x: this.left_coord,
                unicorn_y: this.top_coord,
                current_season: this.currentSeason
            });
        } else {
            const { data, error } = await supabase
                .from('sessions')
                .select('*')
                .eq('session_id', this.sessionId)
                .maybeSingle();

            if (data) {
                this.left_coord = parseFloat(data.unicorn_x) || 0;
                this.top_coord = parseFloat(data.unicorn_y) || 0;
                this.currentSeason = data.current_season || 'spring';

                this.unicorn.style.left = this.left_coord + 'px';
                this.unicorn.style.top = this.top_coord + 'px';

                const seasonValue = this.getSeasonSliderValue(this.currentSeason);
                this.slider.value = seasonValue;
                this.updateSeason();
            }
        }
    }

    generateSessionId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    getSeasonSliderValue(season) {
        const seasonValues = {
            spring: 13,
            summer: 38,
            autumn: 63,
            winter: 88
        };
        return seasonValues[season] || 13;
    }

    async saveSession() {
        const now = Date.now();
        if (now - this.lastSaveTime < this.saveDebounceMs) {
            return;
        }

        this.lastSaveTime = now;

        await supabase
            .from('sessions')
            .update({
                unicorn_x: this.left_coord,
                unicorn_y: this.top_coord,
                current_season: this.currentSeason,
                last_visited: new Date().toISOString()
            })
            .eq('session_id', this.sessionId);
    }

    preloadImages() {
        Object.values(this.mapImages).forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    setupEventListeners() {
        this.viewport.addEventListener('click', (e) => this.handleMapClick(e));

        this.viewport.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.viewport.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.viewport.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        this.slider.addEventListener('input', (e) => {
            this.slider.style.setProperty('--thumb-rotate', `${(e.target.value/100) * 2160}deg`);
            this.updateSeason();
        });
    }

    handleMapClick(e) {
        if (e.target.closest('#slider') || e.target.closest('#open_instructions') || e.target.closest('#instructions')) {
            return;
        }

        const rect = this.viewport.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const x = (clickX / this.viewportScale) + this.viewportX;
        const y = (clickY / this.viewportScale) + this.viewportY;

        this.setTarget(x, y);
    }

    handleTouchStart(e) {
        if (e.touches.length === 1) {
            const touch = e.touches[0];

            if (touch.target.closest('#slider') || touch.target.closest('#open_instructions') || touch.target.closest('#instructions')) {
                return;
            }

            this.isDragging = true;
            this.dragStartX = touch.clientX;
            this.dragStartY = touch.clientY;
            this.dragInitialViewportX = this.viewportX;
            this.dragInitialViewportY = this.viewportY;
        } else if (e.touches.length === 2) {
            e.preventDefault();
            this.isDragging = false;
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            this.lastTouchDistance = this.getTouchDistance(touch1, touch2);
        }
    }

    handleTouchMove(e) {
        if (e.touches.length === 1 && this.isDragging) {
            const touch = e.touches[0];
            const deltaX = touch.clientX - this.dragStartX;
            const deltaY = touch.clientY - this.dragStartY;

            if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
                return;
            }

            e.preventDefault();
        } else if (e.touches.length === 2) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = this.getTouchDistance(touch1, touch2);

            if (this.lastTouchDistance > 0) {
                const delta = distance - this.lastTouchDistance;
                const scaleChange = delta * 0.01;
                this.viewportScale = Math.max(this.minScale, Math.min(this.maxScale, this.viewportScale + scaleChange));
                this.applyViewportTransform();
            }

            this.lastTouchDistance = distance;
        }
    }

    handleTouchEnd(e) {
        if (e.changedTouches.length === 1 && this.isDragging) {
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - this.dragStartX;
            const deltaY = touch.clientY - this.dragStartY;

            if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
                const rect = this.viewport.getBoundingClientRect();
                const touchX = touch.clientX - rect.left;
                const touchY = touch.clientY - rect.top;

                const x = (touchX / this.viewportScale) + this.viewportX;
                const y = (touchY / this.viewportScale) + this.viewportY;
                this.setTarget(x, y);
            }
        }

        this.isDragging = false;
        this.lastTouchDistance = 0;
    }

    getTouchDistance(touch1, touch2) {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    setTarget(x, y) {
        const bgWidth = this.BG_section.offsetWidth;
        const bgHeight = this.BG_section.offsetHeight;
        const maxX = bgWidth - this.unicorn.offsetWidth;
        const maxY = bgHeight - this.unicorn.offsetHeight;

        this.targetX = Math.max(0, Math.min(maxX, x - this.unicorn.offsetWidth / 2));
        this.targetY = Math.max(0, Math.min(maxY, y - this.unicorn.offsetHeight / 2));
        this.isMoving = true;
    }

    moveToTarget() {
        if (!this.isMoving || this.targetX === null || this.targetY === null) {
            return;
        }

        const dx = this.targetX - this.left_coord;
        const dy = this.targetY - this.top_coord;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.speed) {
            this.left_coord = this.targetX;
            this.top_coord = this.targetY;
            this.isMoving = false;
            this.targetX = null;
            this.targetY = null;
            this.saveSession();
        } else {
            const angle = Math.atan2(dy, dx);
            this.left_coord += Math.cos(angle) * this.speed;
            this.top_coord += Math.sin(angle) * this.speed;

            if (dx > 0 && !this.facingRight) {
                this.unicorn.style.transform = 'scaleX(-1)';
                this.facingRight = true;
            } else if (dx < 0 && this.facingRight) {
                this.unicorn.style.transform = 'scaleX(1)';
                this.facingRight = false;
            }
        }

        this.unicorn.style.left = this.left_coord + 'px';
        this.unicorn.style.top = this.top_coord + 'px';

        this.updateCameraPosition();
    }

    updateCameraPosition() {
        const viewportWidth = this.viewport.clientWidth;
        const viewportHeight = this.viewport.clientHeight;

        const unicornCenterX = this.left_coord + this.unicorn.offsetWidth / 2;
        const unicornCenterY = this.top_coord + this.unicorn.offsetHeight / 2;

        this.viewportX = unicornCenterX - viewportWidth / 2 / this.viewportScale;
        this.viewportY = unicornCenterY - viewportHeight / 2 / this.viewportScale;

        const maxViewportX = this.BG_section.offsetWidth - viewportWidth / this.viewportScale;
        const maxViewportY = this.BG_section.offsetHeight - viewportHeight / this.viewportScale;

        this.viewportX = Math.max(0, Math.min(maxViewportX, this.viewportX));
        this.viewportY = Math.max(0, Math.min(maxViewportY, this.viewportY));

        this.applyViewportTransform();
    }

    applyViewportTransform() {
        this.BG_section.style.transform = `translate(${-this.viewportX}px, ${-this.viewportY}px) scale(${this.viewportScale})`;
    }

    isInWater() {
        const BG_width = this.BG_section.offsetWidth;
        const BG_height = this.BG_section.offsetHeight;
        const cx = (this.left_coord + this.unicorn.offsetWidth / 2) / BG_width;
        const cy = (this.top_coord + this.unicorn.offsetHeight / 2) / BG_height;

        return (
            // 1st box: left half of ocean
            (cx < 0.09 && cy < 0.15 && cy > 0.03)
            // 2nd box: right half of ocean before mountain
            || (cx > 0.09 && cx < 0.22 && cy < 0.20 && cy > 0.03)
            // 3rd box: corner next to mountaintop
            || (cx > 0.22 && cx < 0.25 && cy < 0.10 && cy > 0.03)
            // 4th box: fjord entrance
            || (cx > 0.38 && cx < 0.47 && cy < 0.25 && cy > 0.15)
            // 5th box: fjord middle
            || (cx > 0.41 && cx < 0.52 && cy < 0.33 && cy >= 0.25)
            // 6th box: fjord middle bend
            || (cx > 0.44 && cx < 0.52 && cy < 0.45 && cy >= 0.33)
            // 7th box: fjord fork
            || (cx > 0.38 && cx < 0.49 && cy < 0.55 && cy >= 0.43)
            // 8th box: flow from mountain into fjord
            || (cx > 0.30 && cx <= 0.41 && cy < 0.55 && cy >= 0.48)
            // 9th box: crater lake
            || (cx > 0.70 && cx < 0.84 && cy < 0.78 && cy > 0.55)
        );
    }

    startAnimationLoop() {
        const frames = this.unicorn.children;
        let frameIndex = 0;
        let lastFrameTime = 0;
        const frameDelay = 1000 / 12;

        const animate = (currentTime) => {
            this.moveToTarget();

            if (!this.prefersReducedMotion) {
                if (currentTime - lastFrameTime >= frameDelay) {
                    for (let i = 0; i < frames.length; i++) {
                        frames[i].style.display = 'none';
                    }

                    if (this.isInWater()) {
                        const swimStart = 12;
                        const swimFrames = 4;
                        const currentFrame = swimStart + (frameIndex % swimFrames);
                        frames[currentFrame].style.display = 'inline-block';
                    } else if (this.isMoving) {
                        const runStart = 0;
                        const runFrames = 8;
                        const currentFrame = runStart + (frameIndex % runFrames);
                        frames[currentFrame].style.display = 'inline-block';
                    } else {
                        const standStart = 8;
                        const standFrames = 4;
                        const currentFrame = standStart + (frameIndex % standFrames);
                        frames[currentFrame].style.display = 'inline-block';
                    }

                    frameIndex++;
                    lastFrameTime = currentTime;
                }
            } else {
                for (let i = 0; i < frames.length; i++) {
                    frames[i].style.display = 'none';
                }
                frames[8].style.display = 'inline-block';
            }

            requestAnimationFrame(animate);
        };

        animate(0);
    }

    updateSeason() {
        const value = this.slider.value;

        if (value >= 1 && value <= 25) {
            this.currentSeason = 'spring';
            this.BG_img.src = this.mapImages.spring;
            this.snow_canvas.style.display = 'none';
        } else if (value >= 26 && value <= 50) {
            this.currentSeason = 'summer';
            this.BG_img.src = this.mapImages.summer;
            this.snow_canvas.style.display = 'none';
        } else if (value >= 51 && value <= 75) {
            this.currentSeason = 'autumn';
            this.BG_img.src = this.mapImages.autumn;
            this.snow_canvas.style.display = 'none';
        } else if (value >= 76 && value <= 100) {
            this.currentSeason = 'winter';
            this.BG_img.src = this.mapImages.winter;
            this.snow_canvas.style.display = 'inline-block';
        }

        this.saveSession();
    }

    initSnowAnimation() {
        const snow_context = this.snow_canvas.getContext('2d');
        const h = this.BG_section.clientHeight;
        const w = this.BG_section.clientWidth;
        this.snow_canvas.height = h;
        this.snow_canvas.width = w;

        const max_flakes = 100;
        const flakes = [];

        const random = (min, max) => min + Math.random() * (max - min + 1);

        for (let i = 0; i < max_flakes; i++) {
            flakes.push({
                x: Math.random() * w,
                y: Math.random() * h,
                opacity: Math.random(),
                speedX: random(-11, 11),
                speedY: random(7, 15),
                radius: random(0.5, 2.2)
            });
        }

        const snowfall = () => {
            snow_context.clearRect(0, 0, w, h);

            for (let i = 0; i < max_flakes; i++) {
                const gradient = snow_context.createRadialGradient(
                    flakes[i].x, flakes[i].y, 0,
                    flakes[i].x, flakes[i].y, flakes[i].radius
                );
                gradient.addColorStop(0, `rgba(255, 255, 255, ${flakes[i].opacity})`);
                gradient.addColorStop(0.8, `rgba(210, 236, 242, ${flakes[i].opacity})`);
                gradient.addColorStop(1, `rgba(237, 247, 249, ${flakes[i].opacity})`);

                snow_context.beginPath();
                snow_context.arc(flakes[i].x, flakes[i].y, flakes[i].radius, 0, Math.PI * 2, false);
                snow_context.fillStyle = gradient;
                snow_context.fill();

                flakes[i].x += flakes[i].speedX;
                flakes[i].y += flakes[i].speedY;

                if (flakes[i].y > h) {
                    flakes[i].x = Math.random() * w;
                    flakes[i].y = -50;
                }
            }
        };

        setInterval(snowfall, 50);
    }
}

const game = new EunicornWorld();
game.init();
