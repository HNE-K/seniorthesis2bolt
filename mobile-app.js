let supabase = null;

async function initSupabase() {
    try {
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
            supabase = createClient(supabaseUrl, supabaseKey);
        }
    } catch (_) {
    }
}

class EunicornWorld {
    constructor() {
        this.currentSeason = 'spring';
        this.unicorn = null;
        this.BG_section = null;
        this.BG_img = null;
        this.BG_img_old = null;
        this.viewport = null;
        this._seasonTransitionId = 0;
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

        this.cachedBGWidth = 0;
        this.cachedBGHeight = 0;
        this.cachedUnicornWidth = 0;
        this.cachedUnicornHeight = 0;
        this.lastActiveFrame = -1;
    }

    async init() {
        this.unicorn = document.getElementById('unicorn');
        this.BG_section = document.getElementById('BG');
        this.BG_img = document.getElementById('BG_img');
        this.BG_img_old = document.getElementById('BG_img_old');
        this.viewport = document.getElementById('viewport');
        this.slider = document.getElementById('slider');
        this.snow_canvas = document.getElementById('snow_canvas');
        this.frames = Array.from(this.unicorn.children);

        this.initDotSVGs();

        this.artPreviews = [
            document.getElementById('art1Preview'),
            document.getElementById('art2Preview'),
            document.getElementById('art3Preview'),
            document.getElementById('art4Preview')
        ];
        this.artLinks = [
            document.getElementById('art1Link'),
            document.getElementById('art2Link'),
            document.getElementById('art3Link'),
            document.getElementById('art4Link')
        ];
        this.artPositions = [
            { top: 0.30, left: 0.32 },
            { top: 0.50, left: 0.05 },
            { top: 0.80, left: 0.44 },
            { top: 0.37, left: 0.54 }
        ];

        await initSupabase();
        await this.initSession();
        this.preloadImages();
        this.setupEventListeners();

        await this.waitForBGLoad();
        this.cacheLayoutDimensions();
        this.startAnimationLoop();
        this.initSnowAnimation();
        this.updateCameraPosition();

        const instructions = document.getElementById('instructions');
        const openBtn = document.getElementById('open_instructions');
        const closeBtn = document.querySelector('.close-button');

        openBtn.addEventListener('click', () => {
            instructions.style.display = 'flex';
        });

        closeBtn.addEventListener('click', () => {
            instructions.style.display = 'none';
        });

        instructions.addEventListener('click', (e) => {
            if (e.target === instructions) {
                instructions.style.display = 'none';
            }
        });
    }

    initDotSVGs() {
        const template = document.getElementById('dot-template');
        const ids = ['art1', 'art2', 'art3', 'art4'];
        ids.forEach(id => {
            const container = document.getElementById(id);
            const clone = template.content.cloneNode(true);
            container.appendChild(clone);
        });
    }

    waitForBGLoad() {
        if (this.BG_img.complete && this.BG_img.naturalWidth > 0) {
            return Promise.resolve();
        }
        return new Promise(resolve => {
            this.BG_img.addEventListener('load', resolve, { once: true });
        });
    }

    cacheLayoutDimensions() {
        this.cachedBGWidth = this.BG_section.offsetWidth;
        this.cachedBGHeight = this.BG_section.offsetHeight;
        this.cachedUnicornWidth = this.unicorn.offsetWidth;
        this.cachedUnicornHeight = this.unicorn.offsetHeight;
    }

    async initSession() {
        if (!supabase) return;

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
            const { data } = await supabase
                .from('sessions')
                .select('*')
                .eq('session_id', this.sessionId)
                .maybeSingle();

            if (data) {
                this.left_coord = parseFloat(data.unicorn_x) || 0;
                this.top_coord = parseFloat(data.unicorn_y) || 0;
                const restoredSeason = data.current_season || 'spring';

                this.unicorn.style.left = this.left_coord + 'px';
                this.unicorn.style.top = this.top_coord + 'px';

                const seasonValue = this.getSeasonSliderValue(restoredSeason);
                this.slider.value = seasonValue;
                this.currentSeason = 'spring';
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
        if (!supabase || !this.sessionId) return;

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

        window.addEventListener('resize', () => this.cacheLayoutDimensions());
    }

    handleMapClick(e) {
        if (e.target.closest('#slider') || e.target.closest('#open_instructions') || e.target.closest('#instructions') || e.target.closest('.preview')) {
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

            if (touch.target.closest('#slider') || touch.target.closest('#open_instructions') || touch.target.closest('#instructions') || touch.target.closest('.preview')) {
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
        const maxX = this.cachedBGWidth - this.cachedUnicornWidth;
        const maxY = this.cachedBGHeight - this.cachedUnicornHeight;

        this.targetX = Math.max(0, Math.min(maxX, x - this.cachedUnicornWidth / 2));
        this.targetY = Math.max(0, Math.min(maxY, y - this.cachedUnicornHeight / 2));
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

        this.checkArtProximity();
        this.updateCameraPosition();
    }

    updateCameraPosition() {
        const viewportWidth = this.viewport.clientWidth;
        const viewportHeight = this.viewport.clientHeight;

        const unicornCenterX = this.left_coord + this.cachedUnicornWidth / 2;
        const unicornCenterY = this.top_coord + this.cachedUnicornHeight / 2;

        this.viewportX = unicornCenterX - viewportWidth / 2 / this.viewportScale;
        this.viewportY = unicornCenterY - viewportHeight / 2 / this.viewportScale;

        const maxViewportX = this.cachedBGWidth - viewportWidth / this.viewportScale;
        const maxViewportY = this.cachedBGHeight - viewportHeight / this.viewportScale;

        this.viewportX = Math.max(0, Math.min(maxViewportX, this.viewportX));
        this.viewportY = Math.max(0, Math.min(maxViewportY, this.viewportY));

        this.applyViewportTransform();
    }

    applyViewportTransform() {
        this.BG_section.style.transform = `translate(${-this.viewportX}px, ${-this.viewportY}px) scale(${this.viewportScale})`;
    }

    isInWater() {
        const cx = (this.left_coord + this.cachedUnicornWidth / 2) / this.cachedBGWidth;
        const cy = (this.top_coord + this.cachedUnicornHeight) / this.cachedBGHeight;

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

    setActiveFrame(index) {
        if (this.lastActiveFrame === index) return;
        if (this.lastActiveFrame >= 0) {
            this.frames[this.lastActiveFrame].classList.remove('frame-active');
        }
        this.frames[index].classList.add('frame-active');
        this.lastActiveFrame = index;
    }

    startAnimationLoop() {
        let frameIndex = 0;
        let lastFrameTime = 0;
        const frameDelay = 1000 / 12;

        const animate = (currentTime) => {
            this.moveToTarget();

            if (!this.prefersReducedMotion) {
                if (currentTime - lastFrameTime >= frameDelay) {
                    if (this.isInWater()) {
                        this.setActiveFrame(12 + (frameIndex % 4));
                    } else if (this.isMoving) {
                        this.setActiveFrame(frameIndex % 8);
                    } else {
                        this.setActiveFrame(8 + (frameIndex % 4));
                    }

                    frameIndex++;
                    lastFrameTime = currentTime;
                }
            } else {
                this.setActiveFrame(8);
            }

            requestAnimationFrame(animate);
        };

        animate(0);
    }

    updateSeason() {
        const value = this.slider.value;
        let newSeason, newSrc, snowVisible, labels;

        if (value >= 1 && value <= 25) {
            newSeason = 'spring';
            newSrc = this.mapImages.spring;
            snowVisible = false;
            labels = ['Mt. Creativity', "The First Fairy's Shrine", 'Forest of Guardians', 'Passage to Paradise'];
        } else if (value >= 26 && value <= 50) {
            newSeason = 'summer';
            newSrc = this.mapImages.summer;
            snowVisible = false;
            labels = ["Magmanimous Dragon's Soup Kitchen", 'Toasty Refuge', 'Charcoal Woods', "Cliff Dragon's Diving Board"];
        } else if (value >= 51 && value <= 75) {
            newSeason = 'autumn';
            newSrc = this.mapImages.autumn;
            snowVisible = false;
            labels = ['Rebirth Recycling, Inc.', 'Phoenix Airlines Landing Pad', 'Goldenbell Woods', 'Silverscissor Gates'];
        } else {
            newSeason = 'winter';
            newSrc = this.mapImages.winter;
            snowVisible = true;
            labels = ['Mt. Vein', 'Snowfox Den', 'Nightlight Forest', 'Fortress Cliffs'];
        }

        labels.forEach((text, i) => { this.artLinks[i].innerHTML = text; });
        this.snow_canvas.style.display = snowVisible ? 'inline-block' : 'none';

        if (newSeason !== this.currentSeason) {
            this.currentSeason = newSeason;
            this._seasonTransitionId++;
            const transitionId = this._seasonTransitionId;

            this.BG_img_old.src = this.BG_img.src;
            this.BG_img_old.classList.add('fading');

            this.BG_img.src = newSrc;

            const onEnd = () => {
                if (transitionId !== this._seasonTransitionId) return;
                this.BG_img_old.classList.remove('fading');
            };
            this.BG_img_old.addEventListener('transitionend', onEnd, { once: true });
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (transitionId !== this._seasonTransitionId) return;
                    this.BG_img_old.classList.remove('fading');
                });
            });
        }

        this.saveSession();
    }

    checkArtProximity() {
        const ux = this.left_coord / this.cachedBGWidth;
        const uy = this.top_coord / this.cachedBGHeight;
        const threshold = 0.06;

        for (let i = 0; i < this.artPositions.length; i++) {
            const dx = ux - this.artPositions[i].left;
            const dy = uy - this.artPositions[i].top;
            const dist = Math.sqrt(dx * dx + dy * dy);
            this.artPreviews[i].style.visibility = dist < threshold ? 'visible' : 'hidden';
        }
    }

    initSnowAnimation() {
        const snow_context = this.snow_canvas.getContext('2d');
        const h = this.cachedBGHeight;
        const w = this.cachedBGWidth;
        this.snow_canvas.height = h;
        this.snow_canvas.width = w;

        const max_flakes = 400;
        const flakes = [];

        const random = (min, max) => min + Math.random() * (max - min);

        const flakeSprites = [];

        for (let i = 0; i < max_flakes; i++) {
            const radius = random(0.5, 2.5);
            const opacity = random(0.3, 0.9);

            const size = Math.ceil(radius * 2 + 2);
            const offscreen = document.createElement('canvas');
            offscreen.width = size;
            offscreen.height = size;
            const ctx = offscreen.getContext('2d');
            const cx = size / 2;
            const cy = size / 2;
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
            gradient.addColorStop(0.5, `rgba(230, 240, 245, ${opacity * 0.7})`);
            gradient.addColorStop(1, `rgba(220, 235, 240, 0)`);
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

        let tick = 0;

        const snowfall = () => {
            snow_context.clearRect(0, 0, w, h);
            tick++;

            for (let i = 0; i < max_flakes; i++) {
                const f = flakes[i];
                const spriteSize = flakeSprites[i].width;

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

            this.snowRAF = requestAnimationFrame(snowfall);
        };

        this.snowRAF = requestAnimationFrame(snowfall);
    }
}

const game = new EunicornWorld();
game.init();
