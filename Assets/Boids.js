
//#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#

//CODED TOGETHER WITH CO-PILOT, based on the classic "Boids" flocking algorithm by Craig Reynolds (1986).
//For my own implementation of the boids algorithm, see the 3D Boids project displayed on my website.

//#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#-#



(function () {
            const boids = [];
            const numBoids = 240;
            const canvas = document.getElementById('boidsCanvas');
            const ctx = canvas.getContext('2d');
            // coordinate space: use CSS pixels for positions (backing store scaled by devicePixelRatio)
            let cssWidth = 0, cssHeight = 0;
            let prevCssWidth = 0, prevCssHeight = 0;
            // global slowdown factor (0..1) — multiplies all steering/velocity so ratios stay the same
            const speedFactor = 0.3;
            // trail history length (in frames)
            const tailLength = 15;
            // how wide the rear/base of the triangle is relative to `size`
            const tailWidthFactor = 1.5;

            function resizeCanvas() {
                // compute size from layout to match banner exactly using client size (CSS pixels)
                const cssW = canvas.clientWidth;
                const cssH = canvas.clientHeight;
                const dpr = window.devicePixelRatio || 1;
                // if not yet laid out, try next frame
                if (cssW === 0 || cssH === 0) {
                    requestAnimationFrame(resizeCanvas);
                    return;
                }
                const newW = Math.max(1, Math.floor(cssW * dpr));
                const newH = Math.max(1, Math.floor(cssH * dpr));
                // if CSS size changed, scale boid positions to keep layout (positions are in CSS pixels)
                if (prevCssWidth && (prevCssWidth !== cssW || prevCssHeight !== cssH)) {
                    const scaleX = cssW / (prevCssWidth || cssW);
                    const scaleY = cssH / (prevCssHeight || cssH);
                    for (const b of boids) {
                        b.position.x *= scaleX;
                        b.position.y *= scaleY;
                    }
                }
                // update backing store (bitmap) size only — visual size controlled by CSS
                canvas.width = newW;
                canvas.height = newH;
                prevCssWidth = cssW; prevCssHeight = cssH;
                cssWidth = cssW; cssHeight = cssH;
                // ensure canvas is positioned at top-left of parent
                canvas.style.left = '0px';
                canvas.style.top = '0px';
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }

            function vec(x = 0, y = 0) { return { x, y }; }
            function add(a, b) { a.x += b.x; a.y += b.y; }
            function sub(a, b) { return { x: a.x - b.x, y: a.y - b.y }; }
            function mult(a, v) { a.x *= v; a.y *= v; }
            function div(a, v) { a.x /= v; a.y /= v; }
            function mag(a) { return Math.sqrt(a.x * a.x + a.y * a.y); }
            function setMag(a, m) { const r = mag(a) || 1; a.x = (a.x / r) * m; a.y = (a.y / r) * m; }
            function limit(a, max) { const m = mag(a); if (m > max) setMag(a, max); }

            class Boid {
                constructor() {
                    // initialize position in CSS pixels (use current css size if available)
                    this.position = vec(Math.random() * (cssWidth || 200), Math.random() * (cssHeight || 100));
                    this.velocity = vec((Math.random() * 2 - 1) * 2 * speedFactor, (Math.random() * 2 - 1) * 2 * speedFactor);
                    this.acc = vec();
                    // uniform size for all boids
                    this.size = 3;
                    this.history = [];
                }

                applyForce(f) { add(this.acc, f); }

                separation(boids) {
                    const desiredSeparation = 20;
                    const steer = vec();
                    let count = 0;
                    for (const other of boids) {
                        if (other === this) continue;
                        const d = sub(this.position, other.position);
                        const dist = mag(d);
                        if (dist > 0 && dist < desiredSeparation) {
                            // steer away (inverse of distance)
                            d.x /= dist;
                            d.y /= dist;
                            steer.x += d.x / dist;
                            steer.y += d.y / dist;
                            count++;
                        }
                    }
                    if (count > 0) {
                        steer.x /= count; steer.y /= count;
                        setMag(steer, 3);
                        steer.x -= this.velocity.x; steer.y -= this.velocity.y;
                        limit(steer, 0.15);
                    }
                    return steer;
                }

                alignment(boids) {
                    const neighbordist = 50;
                    const sum = vec();
                    let count = 0;
                    for (const other of boids) {
                        if (other === this) continue;
                        const d = sub(this.position, other.position);
                        if (mag(d) > 0 && mag(d) < neighbordist) {
                            sum.x += other.velocity.x; sum.y += other.velocity.y; count++;
                        }
                    }
                    if (count > 0) {
                        sum.x /= count; sum.y /= count;
                        setMag(sum, 2.5);
                        const steer = sub(sum, this.velocity);
                        limit(steer, 0.05);
                        return steer;
                    }
                    return vec();
                }

                cohesion(boids) {
                    const neighbordist = 50;
                    const sum = vec();
                    let count = 0;
                    for (const other of boids) {
                        if (other === this) continue;
                        const d = sub(this.position, other.position);
                        if (mag(d) > 0 && mag(d) < neighbordist) {
                            sum.x += other.position.x; sum.y += other.position.y; count++;
                        }
                    }
                    if (count > 0) {
                        sum.x /= count; sum.y /= count;
                        // desired = steer towards average position
                        const desired = sub(sum, this.position);
                        setMag(desired, 2.2);
                        const steer = sub(desired, this.velocity);
                        limit(steer, 0.05);
                        return steer;
                    }
                    return vec();
                }

                update(boids, mouse) {
                    // behaviors
                    const sep = this.separation(boids);
                    const ali = this.alignment(boids);
                    const coh = this.cohesion(boids);

                    // mouse attraction as additional cohesion target (only when pointer is inside)
                    let toMouse = vec(0, 0);
                    if (typeof pointerInside !== 'undefined' && pointerInside) {
                        toMouse = sub(mouse, this.position);
                        const md = mag(toMouse) || 1;
                        if (md < 700) {
                            setMag(toMouse, 1.4);
                            toMouse.x -= this.velocity.x; toMouse.y -= this.velocity.y;
                            limit(toMouse, 0.12);
                        } else {
                            toMouse.x = 0; toMouse.y = 0;
                        }
                    }

                    // apply with global speed factor (preserves relative weights)
                    mult(sep, speedFactor);
                    mult(ali, speedFactor);
                    mult(coh, speedFactor);
                    mult(toMouse, speedFactor);
                    this.applyForce(sep);
                    this.applyForce(ali);
                    this.applyForce(coh);
                    this.applyForce(toMouse);

                    // integrate
                    add(this.velocity, this.acc);
                    limit(this.velocity, 4 * speedFactor);
                    add(this.position, this.velocity);
                    this.acc.x = 0; this.acc.y = 0;

                    // record CSS-pixel position and heading for trail history
                    this.history.push({ x: this.position.x, y: this.position.y, a: Math.atan2(this.velocity.y, this.velocity.x) });
                    if (this.history.length > tailLength) this.history.shift();

                    // wrap edges using modulo so wrapping follows current CSS size
                    const w = cssWidth || 1;
                    const h = cssHeight || 1;
                    if (!isFinite(this.position.x) || !isFinite(this.position.y)) {
                        this.position.x = Math.random() * w;
                        this.position.y = Math.random() * h;
                    }
                    this.position.x = ((this.position.x % w) + w) % w;
                    this.position.y = ((this.position.y % h) + h) % h;
                }

                draw() {
                    // draw triangle pointing along velocity
                    const angle = Math.atan2(this.velocity.y, this.velocity.x);
                    const s = this.size;
                    // draw history as fading, oriented triangles to match the boid tail
                    for (let i = 0; i < this.history.length; i++) {
                        const p = this.history[i];
                        const t = (i + 1) / this.history.length; // 0..1
                        ctx.save();
                        ctx.translate(p.x, p.y);
                        ctx.rotate(p.a);
                        ctx.globalAlpha = 0.16 * t; // older = lower alpha
                        ctx.fillStyle = 'rgb(80,170,255)';
                        ctx.beginPath();
                        const ss = Math.max(1, s * (0.9 * t));
                        ctx.moveTo(ss * 2.2, 0);
                        ctx.lineTo(-ss * tailWidthFactor, ss * tailWidthFactor);
                        ctx.lineTo(-ss * tailWidthFactor, -ss * tailWidthFactor);
                        ctx.closePath();
                        ctx.fill();
                        ctx.restore();
                    }
                    ctx.globalAlpha = 1;
                    // draw main boid
                    ctx.save();
                    ctx.translate(this.position.x, this.position.y);
                    ctx.rotate(angle);
                    ctx.fillStyle = 'rgba(80,170,255,0.95)';
                    ctx.beginPath();
                    ctx.moveTo(s * 2.2, 0);
                    ctx.lineTo(-s, s);
                    ctx.lineTo(-s, -s);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
            }

            function initBoids() {
                boids.length = 0;
                for (let i = 0; i < numBoids; i++) {
                    const b = new Boid();
                    // start across banner
                    b.position.x = Math.random() * (cssWidth || canvas.clientWidth || 200);
                    b.position.y = Math.random() * (cssHeight || canvas.clientHeight || 100);
                    boids.push(b);
                }
            }

            // track pointer using offset relative to the canvas (avoids scroll/position math)
            const mouse = vec(0, 0);
            let pointerMoved = false;
            let pointerInside = false;
            function handlePointerMove(e) {
                pointerMoved = true;
                const rect = canvas.getBoundingClientRect();
                // Use CSS pixels - the ctx.setTransform handles device pixel scaling
                let offX = (e.offsetX !== undefined) ? e.offsetX : (e.clientX - rect.left);
                let offY = (e.offsetY !== undefined) ? e.offsetY : (e.clientY - rect.top);
                mouse.x = offX;  // Remove dpr multiplication
                mouse.y = offY;
            }

            canvas.addEventListener('pointermove', handlePointerMove);
            canvas.addEventListener('pointerenter', () => { pointerInside = true; });
            canvas.addEventListener('pointerleave', () => { pointerInside = false; });
            canvas.addEventListener('pointercancel', () => { pointerInside = false; });
            // touch fallback for older browsers
            canvas.addEventListener('touchmove', (e) => {
                if (e.touches && e.touches[0]) {
                    const t = e.touches[0];
                    const rect = canvas.getBoundingClientRect();
                    const offX = t.clientX - rect.left;
                    const offY = t.clientY - rect.top;
                    pointerMoved = true;
                    mouse.x = offX;  // Remove dpr multiplication
                    mouse.y = offY;
                }
            }, { passive: true });
            canvas.addEventListener('touchstart', () => { pointerInside = true; });
            canvas.addEventListener('touchend', () => { pointerInside = false; });

            function animate() {
                // compute current mouse in canvas (device) pixels — handles layout/scroll/resize
                const rect = canvas.getBoundingClientRect();
                if (!pointerMoved) {
                    mouse.x = rect.width / 2;   // Remove dpr multiplication
                    mouse.y = rect.height / 2;
                }

                // draw translucent background to keep scene dark and let per-boid trails fade
                // increase alpha so accumulated color is removed faster
                ctx.fillStyle = 'rgba(26,26,31,0.8)';
                ctx.fillRect(0, 0, cssWidth || canvas.clientWidth, cssHeight || canvas.clientHeight);
                for (const b of boids) b.update(boids, mouse);
                for (const b of boids) b.draw();
                requestAnimationFrame(animate);
            }

            // initialize
            window.addEventListener('resize', () => resizeCanvas());
            // observe banner/layout changes to resize canvas reliably
            try {
                const parent = canvas.parentElement || canvas;
                const ro = new ResizeObserver(() => resizeCanvas());
                ro.observe(parent);
            } catch (e) {
                // ResizeObserver not available — fallback handled by window resize
            }
            // ensure layout computed before sizing
            requestAnimationFrame(() => {
                resizeCanvas();
                initBoids();
                const r = canvas.getBoundingClientRect();
                mouse.x = r.width / 2;   // Remove dpr multiplication
                mouse.y = r.height / 2;
                requestAnimationFrame(animate);
            });
        })();
