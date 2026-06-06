// ==UserScript==
// @name         VibeSail Pro Racing Autopilot
// @namespace    http://tampermonkey.net/
// @version      17.0
// @match        *://*.vibesail.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // UI Control Panel & Graphics Overlay Container
    const uiBox = document.createElement('div');
    uiBox.style.position = 'fixed';
    uiBox.style.bottom = '10%';
    uiBox.style.left = '10px';
    uiBox.style.zIndex = '99999';
    uiBox.style.background = 'rgba(0, 0, 0, 0.95)';
    uiBox.style.color = '#fff';
    uiBox.style.padding = '14px';
    uiBox.style.fontFamily = 'monospace';
    uiBox.style.borderRadius = '6px';
    uiBox.style.border = '1px solid #a855f7';
    uiBox.style.fontSize = '12px';
    uiBox.style.boxShadow = '0px 4px 15px rgba(0,0,0,0.5)';
    uiBox.style.width = '280px';
    uiBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:4px;">
            <div style="font-weight:bold; color:#00ffcc;">⛵ VibeSail Toolbox</div>
            <button id="ap-collapse-toggle" style="background:#222; color:#ddd; border:1px solid #555; border-radius:3px; font-family:monospace; font-size:10px; padding:2px 6px; cursor:pointer;">+</button>
        </div>
        <div id="ap-panel-body">
        <div style="margin-bottom:4px;">[1] Helm Control: <span id="ap-helm-status" style="color:#ff4444; font-weight:bold;">OFF</span></div>
        <div style="margin-bottom:4px;">[2] Sail Control: <span id="ap-sail-status" style="color:#ff4444; font-weight:bold;">OFF</span></div>
        <div style="margin-bottom:8px; text-align: center;">
            <button id="ap-btn-export" style="background:#a855f7; border:none; color:white; padding:4px 10px; cursor:pointer; font-family:monospace; font-size:11px; border-radius:3px; width:100%;">💾 Export VPP Table to JSON</button>
        </div>
        <div style="margin-bottom:8px;">
            <div style="font-size:10px; color:#aaa; margin-bottom:4px;">SPEED OVERRIDE</div>
            <div style="display:flex; gap:6px; align-items:center;">
                <input id="ap-speed-value" type="number" min="0" step="1" value="50" style="flex:1; background:#111; color:#fff; border:1px solid #444; font-family:monospace; font-size:10px; padding:3px;">
                <button id="ap-speed-toggle" style="background:#333; border:1px solid #555; color:#fff; padding:3px 8px; cursor:pointer; font-family:monospace; font-size:10px; border-radius:3px;">OFF</button>
            </div>
            <div id="ap-speed-status" style="font-size:10px; color:#888; margin-top:3px;">inactive</div>
        </div>
        <div style="margin-bottom:8px;">
            <div style="font-size:10px; color:#aaa; margin-bottom:4px;">MONEY</div>
            <div style="display:flex; gap:6px; align-items:center;">
                <input id="ap-money-value" type="number" min="0" step="1" value="10000" style="flex:1; background:#111; color:#fff; border:1px solid #444; font-family:monospace; font-size:10px; padding:3px;">
                <button id="ap-money-set" style="background:#1e3a8a; border:1px solid #3b82f6; color:#fff; padding:3px 8px; cursor:pointer; font-family:monospace; font-size:10px; border-radius:3px;">SET</button>
            </div>
            <div style="font-size:10px; color:#ffbb00; margin-top:3px;">Warning: SET reloads the page.</div>
            <div id="ap-money-status" style="font-size:10px; color:#888; margin-top:3px;">idle</div>
        </div>
        <hr style="border-color:#333; margin:8px 0;">
        <div style="display: flex; justify-content: space-between;">
            <div>HDG/TRG: <span id="ap-nav-readout" style="color:#fff;">0°/--°</span></div>
            <div>AWA: <span id="ap-wind-readout" style="color:#ff66ff;">0°</span></div>
        </div>
        <div>Sail/Target: <span id="ap-trim-readout" style="color:#00f0ff;">0°/0°</span></div>
        <div style="font-weight:bold; color:#33ff99; margin-top:4px;">Thrust (Avg): <span id="hud-fwd-thrust">---</span></div>

        <div style="display: flex; justify-content: space-between; margin-top:10px; border-top:1px solid #333; padding-top:10px;">
            <div>
                <div style="text-align:center; font-size:10px; color:#aaa; margin-bottom:4px;">HEADING-UP COMPASS</div>
                <canvas id="ap-compass-canvas" width="130" height="130" style="background:#111; border-radius:50%; border:1px solid #444;"></canvas>
            </div>
            <div>
                <div style="text-align:center; font-size:10px; color:#aaa; margin-bottom:4px;">THRUST HISTORY</div>
                <canvas id="ap-graph-canvas" width="130" height="130" style="background:#111; border:1px solid #444;"></canvas>
            </div>
        </div>

        <div style="margin-top:8px;">
            <div style="text-align:center; font-size:10px; color:#aaa; margin-bottom:4px;">HEADING TRACK (T/H)</div>
            <canvas id="ap-angle-canvas" width="262" height="70" style="background:#111; border:1px solid #444;"></canvas>
        </div>

        <hr style="border-color:#333; margin:8px 0;">
        <div style="font-size:11px; color:#aaa; white-space:nowrap; overflow:hidden;">Helm: <span id="ap-helm-action" style="color:#fff;">None</span></div>
        <div style="font-size:11px; color:#aaa; white-space:nowrap; overflow:hidden;">Trim: <span id="ap-trim-action" style="color:#fff;">None</span></div>

        <hr style="border-color:#333; margin:8px 0;">
        </div>
    `;
    document.body.appendChild(uiBox);

    // Frequently used HUD element handles
    const elHelmStatus = document.getElementById('ap-helm-status');
    const elSailStatus = document.getElementById('ap-sail-status');
    const elNavReadout = document.getElementById('ap-nav-readout');
    const elWindReadout = document.getElementById('ap-wind-readout');
    const elTrimReadout = document.getElementById('ap-trim-readout');
    const elThrustReadout = document.getElementById('hud-fwd-thrust');
    const elHelmAction = document.getElementById('ap-helm-action');
    const elTrimAction = document.getElementById('ap-trim-action');
    const elExportBtn = document.getElementById('ap-btn-export');
    const elSpeedValue = document.getElementById('ap-speed-value');
    const elSpeedToggle = document.getElementById('ap-speed-toggle');
    const elSpeedStatus = document.getElementById('ap-speed-status');
    const elMoneyValue = document.getElementById('ap-money-value');
    const elMoneySet = document.getElementById('ap-money-set');
    const elMoneyStatus = document.getElementById('ap-money-status');
    const elCollapseToggle = document.getElementById('ap-collapse-toggle');
    const elPanelBody = document.getElementById('ap-panel-body');

    let panelCollapsed = true;

    function updatePanelCollapsedUi() {
        elPanelBody.style.display = panelCollapsed ? 'none' : 'block';
        elCollapseToggle.innerText = panelCollapsed ? '+' : '-';
        elCollapseToggle.title = panelCollapsed ? 'Expand panel' : 'Collapse panel';
    }

    elCollapseToggle.addEventListener('click', () => {
        panelCollapsed = !panelCollapsed;
        updatePanelCollapsedUi();
    });
    updatePanelCollapsedUi();

    // Canvas Context Handles
    const compassCtx = document.getElementById('ap-compass-canvas').getContext('2d');
    const graphCtx = document.getElementById('ap-graph-canvas').getContext('2d');
    const angleCtx = document.getElementById('ap-angle-canvas').getContext('2d');

    function wrapSignedAngleDegrees(value) {
        let wrapped = ((value + 180) % 360);
        if (wrapped < 0) wrapped += 360;
        return wrapped - 180;
    }

    function parseNumericDegrees(text) {
        if (!text) return undefined;
        const match = String(text).match(/-?\d+(?:\.\d+)?/);
        return match ? parseFloat(match[0]) : undefined;
    }

    function readTelemetryFromSpeedometer(speedometerElement) {
        let currentHeading;
        let relativeWind;
        let targetHeading;

        const allSpans = speedometerElement.querySelectorAll('span');
        allSpans.forEach(span => {
            const ownText = span.innerText.trim();
            const parentText = span.parentElement ? span.parentElement.innerText : '';

            if (currentHeading === undefined && /heading:/i.test(parentText)) {
                const headingVal = parseNumericDegrees(parentText);
                if (headingVal !== undefined) currentHeading = headingVal;
            }

            if (relativeWind === undefined && /wind:/i.test(parentText)) {
                const windVal = parseNumericDegrees(parentText);
                if (windVal !== undefined) relativeWind = windVal;
            }

            if (ownText === 'Target:') {
                const valueSibling = span.nextElementSibling;
                if (valueSibling) {
                    const targetVal = parseNumericDegrees(valueSibling.innerText);
                    if (targetVal !== undefined) targetHeading = targetVal;
                }
            }
        });

        return { currentHeading, relativeWind, targetHeading };
    }

    function readCurrentSailAngle(svgElement) {
        const gameSailPath = svgElement.querySelector('path[transform-origin="50 45"]');
        if (!gameSailPath) return undefined;

        const transformAttr = gameSailPath.getAttribute('transform') || '';
        const rotateMatch = transformAttr.match(/rotate\(([^)]+)\)/);
        return rotateMatch ? parseFloat(rotateMatch[1]) : undefined;
    }

    // Automation System States
    let helmActive = false;
    let sailActive = false;
    let isTrimPulsing = false;
    let isHelmPulsing = false;
    let isGybing = false;

    // Control State Memory
    let lastTrimDirection = null;
    let lastDirectionFlipTime = 0;
    let helmLastHeadingUnwrapped = null;
    let helmLastSampleTimeMs = 0;
    let helmTurnRateDps = 0;

    // Noise Filtering & Plotting Buffers
    let thrustHistory = [];
    const FILTER_WINDOW_SIZE = 6;
    let filteredThrust = 0;
    let graphPoints = [];
    let headingTracePoints = [];
    let targetTracePoints = [];
    let lastHeadingUnwrapped = null;
    let lastTargetUnwrapped = null;
    const MAX_GRAPH_POINTS = 65;

    // Real-Time Optimization Parameters & Rate Limits
    let baselineThrust = 0;
    let optState = 'IDLE';
    let optTimer = 0;
    const STEP_SIZE = 0.2;
    const OPT_TICK_DELAY = 10;
    let lastOptFlipTime = 0;
    const FLIP_COOLDOWN_MS = 600;
    const OPT_IMPROVEMENT_THRESHOLD = 0.02;
    let HELM_P_GAIN = 0.9;
    const HELM_P_OUTPUT_FOR_MAX = 18;
    let HELM_MAX_PULSE_MS = 32;
    let HELM_MIN_PULSE_MS = 4;
    const HELM_NEAR_TARGET_DEADBAND_DEG = 0.9;
    const HELM_TURN_RATE_FILTER_ALPHA = 0.35;
    const HELM_TURN_LOOKAHEAD_SEC = 0.45;

    // Manual speed override controls
    let speedOverrideEnabled = false;
    let speedOverrideValue = 50.0;
    let speedOverrideDynRef = null;
    let speedOverrideOriginalDescriptor = null;
    let moneySetValue = 10000;

    // Adaptive VPP Profile Table
    const vppProfile = [
        {
            "awa": 0,
            "trim": 0
        },
        {
            "awa": 30,
            "trim": 0
        },
        {
            "awa": 60,
            "trim": 10
        },
        {
            "awa": 90,
            "trim": 20
        },
        {
            "awa": 120,
            "trim": 33.3333
        },
        {
            "awa": 150,
            "trim": 66.6666
        },
        {
            "awa": 180,
            "trim": 90
        }
    ];

    function getVppTargetTrim(currentAwa) {
        if (currentAwa <= 0) return vppProfile[0].trim;
        if (currentAwa >= 180) return vppProfile[vppProfile.length - 1].trim;

        for (let i = 0; i < vppProfile.length - 1; i++) {
            let p1 = vppProfile[i];
            let p2 = vppProfile[i + 1];

            if (currentAwa >= p1.awa && currentAwa <= p2.awa) {
                let fraction = (currentAwa - p1.awa) / (p2.awa - p1.awa);
                return p1.trim + fraction * (p2.trim - p1.trim);
            }
        }
        return 0;
    }

    function updateVppTable(currentAwa, offsetAdjustment) {
        if (currentAwa <= 0) {
            vppProfile[0].trim = Math.max(0, Math.min(90, vppProfile[0].trim + offsetAdjustment));
            return;
        }
        if (currentAwa >= 180) {
            vppProfile[vppProfile.length - 1].trim = Math.max(0, Math.min(90, vppProfile[vppProfile.length - 1].trim + offsetAdjustment));
            return;
        }

        for (let i = 0; i < vppProfile.length - 1; i++) {
            let p1 = vppProfile[i];
            let p2 = vppProfile[i + 1];

            if (currentAwa >= p1.awa && currentAwa <= p2.awa) {
                let span = p2.awa - p1.awa;
                let fraction2 = (currentAwa - p1.awa) / span;
                let fraction1 = 1 - fraction2;

                p1.trim = Math.max(0, Math.min(90, p1.trim + (offsetAdjustment * fraction1)));
                p2.trim = Math.max(0, Math.min(90, p2.trim + (offsetAdjustment * fraction2)));
                break;
            }
        }
    }

    // JSON Downloader Implementation
    function exportVppToJson() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vppProfile, null, 4));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `vibesail_vpp_profile_${Math.floor(Date.now() / 1000)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }

    elExportBtn.addEventListener('click', exportVppToJson);

    function parseSpeedOverrideInput() {
        const parsed = Number(elSpeedValue.value);
        if (Number.isFinite(parsed)) {
            speedOverrideValue = Math.max(0, Math.round(parsed));
        }
        elSpeedValue.value = speedOverrideValue.toFixed(0);
    }

    function updateSpeedOverrideUi() {
        if (speedOverrideEnabled) {
            elSpeedToggle.innerText = 'ON';
            elSpeedToggle.style.background = '#0b6b2e';
            elSpeedToggle.style.borderColor = '#1aa34a';
            elSpeedStatus.innerText = `active @ ${speedOverrideValue.toFixed(0)}`;
            elSpeedStatus.style.color = '#7dff9b';
        } else {
            elSpeedToggle.innerText = 'OFF';
            elSpeedToggle.style.background = '#333';
            elSpeedToggle.style.borderColor = '#555';
            elSpeedStatus.innerText = 'inactive';
            elSpeedStatus.style.color = '#888';
        }
    }

    function applySpeedOverride() {
        const dyn = window.sail?.boat?.dynamics;
        if (!dyn) return false;

        if (speedOverrideDynRef !== dyn) {
            speedOverrideDynRef = dyn;
            speedOverrideOriginalDescriptor = Object.getOwnPropertyDescriptor(dyn, 'speed') || null;
        }

        Object.defineProperty(dyn, 'speed', {
            get() {
                return speedOverrideValue;
            },
            set(_) {
                return true;
            },
            configurable: true,
            enumerable: true,
        });
        return true;
    }

    function removeSpeedOverride() {
        if (!speedOverrideDynRef) return true;
        try {
            if (speedOverrideOriginalDescriptor) {
                Object.defineProperty(speedOverrideDynRef, 'speed', speedOverrideOriginalDescriptor);
            } else {
                delete speedOverrideDynRef.speed;
            }
        } catch (err) {
            console.debug('Unable to restore original speed descriptor:', err);
            return false;
        }
        return true;
    }

    elSpeedValue.addEventListener('change', parseSpeedOverrideInput);
    elSpeedValue.addEventListener('input', parseSpeedOverrideInput);
    elSpeedToggle.addEventListener('click', () => {
        parseSpeedOverrideInput();
        if (speedOverrideEnabled) {
            speedOverrideEnabled = false;
            removeSpeedOverride();
        } else {
            speedOverrideEnabled = true;
            applySpeedOverride();
        }
        updateSpeedOverrideUi();
    });
    updateSpeedOverrideUi();

    function parseMoneyInput() {
        const parsed = Number(elMoneyValue.value);
        if (Number.isFinite(parsed)) {
            moneySetValue = Math.max(0, Math.round(parsed));
        }
        elMoneyValue.value = moneySetValue.toFixed(0);
    }

    function setMoneyAndReload() {
        parseMoneyInput();
        localStorage.setItem('sail_balance_v2', JSON.stringify({
            value: moneySetValue,
            expiresAt: 1812283581908,
        }));
        elMoneyStatus.innerText = `saved ${moneySetValue}, reloading...`;
        elMoneyStatus.style.color = '#7db8ff';
        setTimeout(() => {
            location.reload();
        }, 80);
    }

    elMoneyValue.addEventListener('change', parseMoneyInput);
    elMoneyValue.addEventListener('input', parseMoneyInput);
    elMoneySet.addEventListener('click', setMoneyAndReload);

    // Key Listeners
    window.addEventListener('keydown', (e) => {
        if (e.key === '1') {
            helmActive = !helmActive;
            elHelmStatus.innerText = helmActive ? 'ACTIVE' : 'OFF';
            elHelmStatus.style.color = helmActive ? '#00ff00' : '#ff4444';
            if (!helmActive) {
                sendKey('ArrowLeft', 'keyup');
                sendKey('ArrowRight', 'keyup');
            }
        }
        if (e.key === '2') {
            sailActive = !sailActive;
            elSailStatus.innerText = sailActive ? 'ACTIVE' : 'OFF';
            elSailStatus.style.color = sailActive ? '#00ff00' : '#ff4444';
            if (!sailActive) {
                sendKey('ArrowUp', 'keyup');
                sendKey('ArrowDown', 'keyup');
                isGybing = false;
            }
        }
    });

    function sendKey(keyName, type) {
        let code = 0;
        if (keyName === 'ArrowUp') code = 38;
        else if (keyName === 'ArrowDown') code = 40;
        else if (keyName === 'ArrowLeft') code = 37;
        else if (keyName === 'ArrowRight') code = 39;

        const event = new KeyboardEvent(type, {
            key: keyName, keyCode: code, which: code, code: keyName, bubbles: true, cancelable: true, view: window
        });
        document.dispatchEvent(event);
        const canvas = document.querySelector('canvas');
        if (canvas) canvas.dispatchEvent(event);
    }

    function pulseTrim(keyName, duration) {
        isTrimPulsing = true;
        sendKey(keyName, 'keydown');
        setTimeout(() => {
            sendKey(keyName, 'keyup');
            setTimeout(() => { isTrimPulsing = false; }, 80);
        }, duration);
    }

    function pulseHelm(keyName, duration) {
        isHelmPulsing = true;
        sendKey(keyName, 'keydown');
        setTimeout(() => {
            sendKey(keyName, 'keyup');
            setTimeout(() => { isHelmPulsing = false; }, 30);
        }, duration);
    }

    function drawVisualTarget(svgElement, targetRotation) {
        let targetPath = document.getElementById('ap-visual-target');
        if (!targetPath) {
            targetPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            targetPath.setAttribute('id', 'ap-visual-target');
            targetPath.setAttribute('d', 'M 50 15 L 52 45 L 48 45 Z');
            targetPath.setAttribute('fill', 'rgba(0, 240, 255, 0.4)');
            targetPath.setAttribute('stroke', '#00f0ff');
            targetPath.setAttribute('stroke-width', '0.5');
            targetPath.setAttribute('transform-origin', '50 45');
            svgElement.appendChild(targetPath);
        }
        targetPath.setAttribute('transform', `rotate(${targetRotation})`);
    }

    const getVectorMagnitude = (vec) => {
        if (!vec) return 0;
        if (typeof vec.length === 'function') return vec.length();
        const x = vec.x || 0;
        const y = vec.y || 0;
        const z = vec.z || 0;
        return Math.sqrt(x * x + y * y + z * z);
    };

    function unwrapAngle(previousUnwrapped, currentWrapped) {
        if (previousUnwrapped === null || previousUnwrapped === undefined) return currentWrapped;
        const prevWrapped = ((previousUnwrapped % 360) + 360) % 360;
        let delta = currentWrapped - prevWrapped;
        if (delta > 180) delta -= 360;
        if (delta < -180) delta += 360;
        return previousUnwrapped + delta;
    }

    function renderTacticalCompass(hdg, trg, awa, sail, trgSail) {
        const cx = 65, cy = 65, r = 55;
        compassCtx.clearRect(0, 0, 130, 130);

        compassCtx.save();
        compassCtx.translate(cx, cy);
        compassCtx.beginPath();
        compassCtx.moveTo(0, -22);
        compassCtx.quadraticCurveTo(9, -10, 9, 8);
        compassCtx.lineTo(6, 22);
        compassCtx.lineTo(-6, 22);
        compassCtx.lineTo(-9, 8);
        compassCtx.quadraticCurveTo(-9, -10, 0, -22);
        compassCtx.closePath();
        compassCtx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        compassCtx.fill();
        compassCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        compassCtx.lineWidth = 1;
        compassCtx.stroke();
        compassCtx.restore();

        compassCtx.beginPath();
        compassCtx.arc(cx, cy, r, 0, 2 * Math.PI);
        compassCtx.strokeStyle = '#333';
        compassCtx.lineWidth = 2;
        compassCtx.stroke();

        const drawNeedle = (relativeAngleDegrees, len, color, width, isArrow = false) => {
            const rad = (-relativeAngleDegrees - 90) * Math.PI / 180;
            const tx = cx + len * Math.cos(rad);
            const ty = cy + len * Math.sin(rad);

            compassCtx.beginPath();
            compassCtx.moveTo(cx, cy);
            compassCtx.lineTo(tx, ty);
            compassCtx.strokeStyle = color;
            compassCtx.lineWidth = width;
            compassCtx.lineCap = 'round';
            compassCtx.stroke();

            if (isArrow) {
                compassCtx.beginPath();
                compassCtx.arc(tx, ty, 3, 0, 2 * Math.PI);
                compassCtx.fillStyle = color;
                compassCtx.fill();
            }
        };

        let currentHdgSafe = (hdg !== undefined) ? hdg : 0;

        drawNeedle(0, r - 10, '#ffffff', 2.5);

        if (trg !== undefined) {
            let relativeTargetAngle = trg - currentHdgSafe;
            drawNeedle(relativeTargetAngle, r - 2, '#ffd166', 2);
        }

        if (awa !== undefined) {
            drawNeedle(awa, r - 5, '#ff66ff', 2, true);
        }

        if (sail !== undefined && trgSail !== undefined) {
            // Game sail rotations are already absolute around the boat axis.
            // Negate to match compass Y-axis orientation without vertical mirroring.
            let compassSailPos = -sail;
            let compassTargetSailPos = -trgSail;

            drawNeedle(compassSailPos, r - 18, '#00ffcc', 3);
            drawNeedle(compassTargetSailPos, r - 18, 'rgba(0, 240, 255, 0.5)', 1.5, true);
        }

        compassCtx.beginPath();
        compassCtx.arc(cx, cy, 3, 0, 2 * Math.PI);
        compassCtx.fillStyle = '#444';
        compassCtx.fill();
    }

    function renderThrustGraph() {
        graphCtx.clearRect(0, 0, 130, 130);
        if (graphPoints.length < 2) return;

        let min = 0;
        let max = Math.max(...graphPoints);
        const top = 4;
        const bottom = 126;

        if (max <= 1) { max = 5; }
        let padding = max * 0.05;
        max += padding;

        graphCtx.strokeStyle = '#222';
        graphCtx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
            let y = top + ((bottom - top) / 3) * i;
            graphCtx.beginPath(); graphCtx.moveTo(0, y); graphCtx.lineTo(130, y); graphCtx.stroke();
        }

        graphCtx.beginPath();
        for (let i = 0; i < graphPoints.length; i++) {
            let x = (130 / (MAX_GRAPH_POINTS - 1)) * i;
            let ratio = (graphPoints[i] - min) / (max - min);
            let y = bottom - ratio * (bottom - top);

            if (i === 0) graphCtx.moveTo(x, y);
            else graphCtx.lineTo(x, y);
        }
        graphCtx.strokeStyle = '#33ff99';
        graphCtx.lineWidth = 2;
        graphCtx.stroke();
    }

    function renderAngleGraph() {
        angleCtx.clearRect(0, 0, 262, 70);

        const angleValues = [];
        for (let i = 0; i < headingTracePoints.length; i++) {
            const h = headingTracePoints[i];
            const t = targetTracePoints[i];
            if (h !== null && h !== undefined) angleValues.push(h);
            if (t !== null && t !== undefined) angleValues.push(t);
        }
        if (angleValues.length < 2) return;

        let aMin = Math.min(...angleValues);
        let aMax = Math.max(...angleValues);
        if ((aMax - aMin) < 10) {
            const mid = (aMin + aMax) / 2;
            aMin = mid - 5;
            aMax = mid + 5;
        }

        const top = 4;
        const bottom = 66;
        angleCtx.strokeStyle = '#222';
        angleCtx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
            const y = top + ((bottom - top) / 3) * i;
            angleCtx.beginPath();
            angleCtx.moveTo(0, y);
            angleCtx.lineTo(262, y);
            angleCtx.stroke();
        }

        const drawSeries = (points, color) => {
            angleCtx.beginPath();
            let drawing = false;
            for (let i = 0; i < points.length; i++) {
                const v = points[i];
                if (v === null || v === undefined) {
                    drawing = false;
                    continue;
                }
                const x = (262 / (MAX_GRAPH_POINTS - 1)) * i;
                const ratio = (v - aMin) / (aMax - aMin);
                const y = bottom - ratio * (bottom - top);
                if (!drawing) {
                    angleCtx.moveTo(x, y);
                    drawing = true;
                } else {
                    angleCtx.lineTo(x, y);
                }
            }
            angleCtx.strokeStyle = color;
            angleCtx.lineWidth = 1.6;
            angleCtx.stroke();
        };

        drawSeries(targetTracePoints, '#00f0ff');
        drawSeries(headingTracePoints, '#ffd166');

        angleCtx.fillStyle = '#00f0ff';
        angleCtx.font = '9px monospace';
        angleCtx.fillText('T', 4, 11);
        angleCtx.fillStyle = '#ffd166';
        angleCtx.fillText('H', 14, 11);
    }

    // Master operational frame loop (Runs every 80ms)
    setInterval(() => {
        if (speedOverrideEnabled) {
            applySpeedOverride();
        }

        const speedometer = document.getElementById('speedometer');
        if (!speedometer) return;

        const svgElement = speedometer.querySelector('svg');
        if (!svgElement) return;

        const {
            currentHeading,
            relativeWind,
            targetHeading,
        } = readTelemetryFromSpeedometer(speedometer);

        const currentSailAngle = readCurrentSailAngle(svgElement);

        const dyn = window.sail?.boat?.dynamics;
        if (dyn && dyn.forces) {
            try {
                const netForces = dyn.forces.net || {};
                let instantThrust = getVectorMagnitude(netForces.forward);

                thrustHistory.push(instantThrust);
                if (thrustHistory.length > FILTER_WINDOW_SIZE) thrustHistory.shift();

                let sum = thrustHistory.reduce((a, b) => a + b, 0);
                filteredThrust = sum / thrustHistory.length;

                elThrustReadout.innerText = filteredThrust.toFixed(2) + ' N';

                graphPoints.push(filteredThrust);
                if (graphPoints.length > MAX_GRAPH_POINTS) graphPoints.shift();
                renderThrustGraph();
            } catch (err) {
                console.debug("Vector processing failure:", err);
            }
        }

        let displayTarget = (targetHeading !== undefined) ? `${targetHeading.toFixed(0)}°` : '--°';
        let displayHeading = (currentHeading !== undefined) ? `${currentHeading.toFixed(0)}°` : '--°';
        elNavReadout.innerText = `${displayHeading}/${displayTarget}`;

        if (relativeWind !== undefined) {
            elWindReadout.innerText = `${relativeWind.toFixed(0)}°`;
        }

        if (currentHeading !== undefined) {
            lastHeadingUnwrapped = unwrapAngle(lastHeadingUnwrapped, currentHeading);
            headingTracePoints.push(lastHeadingUnwrapped);
        } else {
            headingTracePoints.push(null);
        }

        if (targetHeading !== undefined) {
            lastTargetUnwrapped = unwrapAngle(lastTargetUnwrapped, targetHeading);
            targetTracePoints.push(lastTargetUnwrapped);
        } else {
            targetTracePoints.push(null);
        }

        if (headingTracePoints.length > MAX_GRAPH_POINTS) headingTracePoints.shift();
        if (targetTracePoints.length > MAX_GRAPH_POINTS) targetTracePoints.shift();
        renderAngleGraph();

        // ==========================================
        // AXIS 1: HELM STEERING (Proportional + Dead Zone)
        // ==========================================
        const helmActionEl = elHelmAction;
        const nowMs = Date.now();

        // Estimate current turn rate (deg/s) from unwrapped heading history.
        if (lastHeadingUnwrapped !== null && lastHeadingUnwrapped !== undefined) {
            if (helmLastHeadingUnwrapped !== null && helmLastSampleTimeMs > 0) {
                let rateDt = (nowMs - helmLastSampleTimeMs) / 1000;
                if (!Number.isFinite(rateDt) || rateDt <= 0) rateDt = 0.08;
                rateDt = Math.max(0.02, Math.min(0.25, rateDt));
                const rawTurnRate = (lastHeadingUnwrapped - helmLastHeadingUnwrapped) / rateDt;
                helmTurnRateDps = (1 - HELM_TURN_RATE_FILTER_ALPHA) * helmTurnRateDps + (HELM_TURN_RATE_FILTER_ALPHA * rawTurnRate);
            }
            helmLastHeadingUnwrapped = lastHeadingUnwrapped;
            helmLastSampleTimeMs = nowMs;
        }

        if (helmActive && currentHeading !== undefined && targetHeading !== undefined && !isHelmPulsing) {
            const predictedHeading = currentHeading + (helmTurnRateDps * HELM_TURN_LOOKAHEAD_SEC);
            let headingError = targetHeading - predictedHeading;
            headingError = wrapSignedAngleDegrees(headingError);

            let absHelmError = Math.abs(headingError);

            if (absHelmError < HELM_NEAR_TARGET_DEADBAND_DEG) {
                helmActionEl.innerText = "On Course";
                helmActionEl.style.color = '#00ff00';
                sendKey('ArrowLeft', 'keyup');
                sendKey('ArrowRight', 'keyup');
            } else {
                const pOutput = HELM_P_GAIN * headingError;
                const absOutput = Math.abs(pOutput);
                const outputRatio = Math.min(1, absOutput / HELM_P_OUTPUT_FOR_MAX);
                const helmPulseWidthMs = Math.max(HELM_MIN_PULSE_MS, Math.round(HELM_MIN_PULSE_MS + outputRatio * (HELM_MAX_PULSE_MS - HELM_MIN_PULSE_MS)));

                if (pOutput > 0) {
                    helmActionEl.innerText = `P Left [${helmPulseWidthMs}ms | out ${pOutput.toFixed(2)} | r ${helmTurnRateDps.toFixed(1)}]`;
                    helmActionEl.style.color = '#3399ff';
                    pulseHelm('ArrowLeft', helmPulseWidthMs);
                } else {
                    helmActionEl.innerText = `P Right [${helmPulseWidthMs}ms | out ${pOutput.toFixed(2)} | r ${helmTurnRateDps.toFixed(1)}]`;
                    helmActionEl.style.color = '#ffd166';
                    pulseHelm('ArrowRight', helmPulseWidthMs);
                }
            }
        } else if (!helmActive) {
            helmLastHeadingUnwrapped = null;
            helmLastSampleTimeMs = 0;
            helmTurnRateDps = 0;
            helmActionEl.innerText = (targetHeading === undefined) ? "Waiting for Race Target..." : "Disabled";
            helmActionEl.style.color = '#666';
        }

        // ==========================================
        // AXIS 2: SAIL TRIMMING ENGINE & REAL-TIME OPTIMIZATION
        // ==========================================
        const trimActionEl = elTrimAction;
        if (currentSailAngle !== undefined && relativeWind !== undefined) {
            let absWindFromNose = Math.abs(relativeWind);
            let currentExtension = Math.abs(180 - currentSailAngle);

            // Real-time hill-climbing algorithm updates the profile array natively
            if (sailActive && !isGybing) {
                optTimer++;
                if (optTimer >= OPT_TICK_DELAY) {
                    optTimer = 0;
                    let now = Date.now();

                    if (optState === 'IDLE') {
                        baselineThrust = filteredThrust;
                        optState = 'TESTING_UP';
                        updateVppTable(absWindFromNose, STEP_SIZE);
                    }
                    else if (optState === 'TESTING_UP') {
                        optState = 'EVALUATING_UP';
                    }
                    else if (optState === 'EVALUATING_UP') {
                        if (filteredThrust > baselineThrust + OPT_IMPROVEMENT_THRESHOLD) {
                            baselineThrust = filteredThrust;
                            updateVppTable(absWindFromNose, STEP_SIZE);
                            optState = 'TESTING_UP';
                        } else {
                            if (now - lastOptFlipTime > FLIP_COOLDOWN_MS) {
                                lastOptFlipTime = now;
                                // Revert the previous +STEP probe before trying the opposite direction.
                                updateVppTable(absWindFromNose, -STEP_SIZE);
                                updateVppTable(absWindFromNose, -STEP_SIZE);
                                optState = 'TESTING_DOWN';
                            } else {
                                optState = 'IDLE';
                            }
                        }
                    }
                    else if (optState === 'TESTING_DOWN') {
                        optState = 'EVALUATING_DOWN';
                    }
                    else if (optState === 'EVALUATING_DOWN') {
                        if (filteredThrust > baselineThrust + OPT_IMPROVEMENT_THRESHOLD) {
                            baselineThrust = filteredThrust;
                            updateVppTable(absWindFromNose, -STEP_SIZE);
                            optState = 'TESTING_DOWN';
                        } else {
                            if (now - lastOptFlipTime > FLIP_COOLDOWN_MS) {
                                lastOptFlipTime = now;
                                // Revert the previous -STEP probe and return to idle.
                                updateVppTable(absWindFromNose, STEP_SIZE);
                                optState = 'IDLE';
                            } else {
                                optState = 'IDLE';
                            }
                        }
                    }
                }
            }

            let targetExtension = getVppTargetTrim(absWindFromNose);
            let targetRotation = (relativeWind >= 0) ? (180 - targetExtension) : (180 + targetExtension);

            drawVisualTarget(svgElement, targetRotation);
            elTrimReadout.innerText = `${currentSailAngle.toFixed(1)}°/${targetRotation.toFixed(1)}°`;
            renderTacticalCompass(currentHeading, targetHeading, relativeWind, currentSailAngle, targetRotation);

            if (sailActive) {
                if (!isGybing && absWindFromNose > 90) {
                    let wrongSide = false;
                    if (relativeWind >= 0 && currentSailAngle > 180.5) wrongSide = true;
                    if (relativeWind < 0 && currentSailAngle < 179.5) wrongSide = true;

                    let deviationAmount = Math.abs(180 - currentSailAngle);
                    if (wrongSide && deviationAmount > 20.0) {
                        isGybing = true;
                        sendKey('ArrowUp', 'keyup');
                        sendKey('ArrowDown', 'keyup');
                    }
                }

                if (isGybing) {
                    let currentDeviation = Math.abs(180 - currentSailAngle);
                    if (currentDeviation > 2.0) {
                        trimActionEl.innerText = "🚨 GYBE RECOVERY: Centerline Lock";
                        trimActionEl.style.color = '#ff3333';
                        sendKey('ArrowDown', 'keydown');
                        return;
                    } else {
                        sendKey('ArrowDown', 'keyup');
                        isGybing = false;
                    }
                }

                if (!isTrimPulsing) {
                    let error = targetExtension - currentExtension;
                    let absError = Math.abs(error);

                    if (absError <= 1.2) {
                        trimActionEl.innerText = `Adapting VPP... [${optState}]`;
                        trimActionEl.style.color = '#00f0ff';
                    } else {
                        let currentDir = error > 0 ? 'Up' : 'Down';
                        let currentTime = Date.now();

                        if (lastTrimDirection && currentDir !== lastTrimDirection) {
                            let timeSinceFlip = currentTime - lastDirectionFlipTime;
                            if (timeSinceFlip < 550) {
                                trimActionEl.innerText = `⏳ Rate Limiting Chattering (${(540 - timeSinceFlip)}ms)`;
                                trimActionEl.style.color = '#ffaa00';
                                return;
                            }
                            lastDirectionFlipTime = currentTime;
                        }

                        lastTrimDirection = currentDir;

                        let duration = 15;
                        if (absError > 10.0) duration = 50;
                        else if (absError > 4.0) duration = 30;

                        if (error > 0) {
                            trimActionEl.innerText = `Releasing Smooth (ArrowUp) [${duration}ms]`;
                            trimActionEl.style.color = '#00ffcc';
                            pulseTrim('ArrowUp', duration);
                        } else {
                            trimActionEl.innerText = `Trimming Smooth (ArrowDown) [${duration}ms]`;
                            trimActionEl.style.color = '#ffaa00';
                            pulseTrim('ArrowDown', duration);
                        }
                    }
                }
            } else if (!sailActive) {
                trimActionEl.innerText = "Disabled";
                trimActionEl.style.color = '#666';
            }
        }

    }, 80);
})();