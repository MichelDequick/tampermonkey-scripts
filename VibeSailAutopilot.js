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
        <div style="margin-bottom:6px; display:flex; gap:6px; align-items:center;">
            <button id="ap-helm-toggle" style="flex:1; background:#333; border:1px solid #555; color:#fff; padding:3px 8px; cursor:pointer; font-family:monospace; font-size:10px; border-radius:3px;">Toggle Helm Control (OFF)</button>
            <button id="ap-sail-toggle" style="flex:1; background:#333; border:1px solid #555; color:#fff; padding:3px 8px; cursor:pointer; font-family:monospace; font-size:10px; border-radius:3px;">Toggle Sail Control (OFF)</button>
        </div>
        <div id="ap-panel-body">
        <div style="margin-bottom:6px; display:flex; justify-content:space-between; align-items:center; gap:6px;">
            <span style="font-size:10px; color:#aaa;">HELM MODE</span>
            <button id="ap-helm-mode-toggle" style="background:#333; border:1px solid #555; color:#fff; padding:2px 8px; cursor:pointer; font-family:monospace; font-size:10px; border-radius:3px; min-width:74px;">TARGET</button>
        </div>
        <div style="margin-bottom:6px; display:flex; gap:6px; align-items:center;">
            <input id="ap-hold-heading-value" type="number" min="0" max="359" step="1" value="0" style="flex:1; background:#111; color:#fff; border:1px solid #444; font-family:monospace; font-size:10px; padding:3px;" disabled>
            <button id="ap-hold-heading-apply" style="background:#333; border:1px solid #555; color:#fff; padding:3px 8px; cursor:pointer; font-family:monospace; font-size:10px; border-radius:3px;" disabled>Set Hold</button>
        </div>
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
            <div style="font-size:10px; color:#aaa; margin-bottom:4px;">DRAG COEFFICIENT</div>
            <div style="display:flex; gap:6px; align-items:center;">
                <input id="ap-drag-value" type="number" min="0" step="0.001" value="0.05" style="flex:1; background:#111; color:#fff; border:1px solid #444; font-family:monospace; font-size:10px; padding:3px;">
                <button id="ap-drag-toggle" style="background:#333; border:1px solid #555; color:#fff; padding:3px 8px; cursor:pointer; font-family:monospace; font-size:10px; border-radius:3px;">OFF</button>
            </div>
            <div id="ap-drag-status" style="font-size:10px; color:#888; margin-top:3px;">inactive</div>
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

        <div style="margin-top:8px; display:flex; justify-content:space-between; gap:6px;">
            <div>
                <div style="text-align:center; font-size:10px; color:#aaa; margin-bottom:4px;">HEADING TRACK (T/H)</div>
                <canvas id="ap-angle-canvas" width="128" height="70" style="background:#111; border:1px solid #444;"></canvas>
            </div>
            <div>
                <div style="text-align:center; font-size:10px; color:#aaa; margin-bottom:4px;">RUDDER TRACK (R)</div>
                <canvas id="ap-heel-rudder-canvas" width="128" height="70" style="background:#111; border:1px solid #444;"></canvas>
            </div>
        </div>

        <hr style="border-color:#333; margin:8px 0;">
        <div style="font-size:11px; color:#aaa; white-space:nowrap; overflow:hidden;">Helm: <span id="ap-helm-action" style="color:#fff;">None</span></div>
        <div style="font-size:11px; color:#aaa; white-space:nowrap; overflow:hidden;">Trim: <span id="ap-trim-action" style="color:#fff;">None</span></div>

        <hr style="border-color:#333; margin:8px 0;">
        </div>
    `;
    document.body.appendChild(uiBox);

    // Frequently used HUD element handles
    const elHelmToggle = document.getElementById('ap-helm-toggle');
    const elSailToggle = document.getElementById('ap-sail-toggle');
    const elHelmModeToggle = document.getElementById('ap-helm-mode-toggle');
    const elHoldHeadingValue = document.getElementById('ap-hold-heading-value');
    const elHoldHeadingApply = document.getElementById('ap-hold-heading-apply');
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
    const elDragValue = document.getElementById('ap-drag-value');
    const elDragToggle = document.getElementById('ap-drag-toggle');
    const elDragStatus = document.getElementById('ap-drag-status');
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
    const heelRudderCtx = document.getElementById('ap-heel-rudder-canvas').getContext('2d');

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
        let targetHeading;

        const allSpans = speedometerElement.querySelectorAll('span');
        allSpans.forEach(span => {
            const ownText = span.innerText.trim();
            const parentText = span.parentElement ? span.parentElement.innerText : '';

            if (currentHeading === undefined && /heading:/i.test(parentText)) {
                const headingVal = parseNumericDegrees(parentText);
                if (headingVal !== undefined) currentHeading = headingVal;
            }

            if (ownText === 'Target:') {
                const valueSibling = span.nextElementSibling;
                if (valueSibling) {
                    const targetVal = parseNumericDegrees(valueSibling.innerText);
                    if (targetVal !== undefined) targetHeading = targetVal;
                }
            }
        });

        return { currentHeading, targetHeading };
    }

    function toDegreesMaybeRadians(value) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return undefined;
        if (Math.abs(numeric) <= (2 * Math.PI + 0.001)) {
            return numeric * (180 / Math.PI);
        }
        return numeric;
    }

    function normalizeCompassDegrees(value) {
        const degrees = toDegreesMaybeRadians(value);
        if (degrees === undefined) return undefined;
        let normalized = degrees % 360;
        if (normalized < 0) normalized += 360;
        return normalized;
    }

    function directionVectorToCompassDegrees(vec) {
        if (!vec || typeof vec !== 'object') return undefined;
        const x = Number(vec.x);
        const z = Number(vec.z);
        if (!Number.isFinite(x) || !Number.isFinite(z)) return undefined;
        // Compass convention: 0deg at +Z, clockwise positive toward +X.
        let degrees = Math.atan2(x, z) * (180 / Math.PI);
        if (degrees < 0) degrees += 360;
        return degrees;
    }

    function readDirectionDegrees(value) {
        const scalar = normalizeCompassDegrees(value);
        if (scalar !== undefined) return scalar;
        return directionVectorToCompassDegrees(value);
    }

    function flipWindDirectionDegrees(direction) {
        if (direction === undefined) return undefined;
        return normalizeCompassDegrees(direction + 180);
    }

    function readDynamicsTelemetry(currentHeading) {
        const dyn = window.sail?.boat?.dynamics;
        const world = window.sail?.boat?.world;
        if (!dyn) {
            return {
                heelAngle: undefined,
                apparentWindDirection: undefined,
                apparentWindAngle: undefined,
                worldWindAngle: undefined,
            };
        }

        const heelAngle = toDegreesMaybeRadians(dyn.heelAngle);
        const apparentWindDirection = flipWindDirectionDegrees(readDirectionDegrees(dyn.apparentWindDirection));
        const worldWindDirection = flipWindDirectionDegrees(readDirectionDegrees(world?.windDirection));

        const apparentWindAngle = (apparentWindDirection !== undefined && currentHeading !== undefined)
            ? wrapSignedAngleDegrees(apparentWindDirection - currentHeading)
            : undefined;

        const worldWindAngle = (worldWindDirection !== undefined && currentHeading !== undefined)
            ? wrapSignedAngleDegrees(worldWindDirection - currentHeading)
            : undefined;

        return {
            heelAngle,
            apparentWindDirection,
            apparentWindAngle,
            worldWindAngle,
        };
    }

    function readCurrentSailAngle(dyn) {
        const sailAngleRad = Number(dyn?.sailAngle);
        if (!Number.isFinite(sailAngleRad)) return undefined;
        return Math.max(0, Math.min(Math.PI / 2, sailAngleRad)) * (180 / Math.PI);
    }

    function readCurrentSheetLimitAngle(dyn) {
        const sheetLimitRad = Number(dyn?.sheetLimit);
        if (!Number.isFinite(sheetLimitRad)) return undefined;
        return Math.max(0, Math.min(Math.PI / 2, sheetLimitRad)) * (180 / Math.PI);
    }

    function setSheetLimitRadians(value) {
        const dyn = window.sail?.boat?.dynamics;
        if (!dyn) return;
        const clamped = Math.max(0, Math.min(Math.PI / 2, Number(value)));
        if (!Number.isFinite(clamped)) return;
        dyn.sheetLimit = clamped;
    }

    // Automation System States
    let helmActive = false;
    let sailActive = false;
    let helmMode = 'target';
    let helmHoldHeading = undefined;

    // Control State Memory
    let helmLastHeadingUnwrapped = null;
    let helmLastSampleTimeMs = 0;
    let helmTurnRateDps = 0;

    // Noise Filtering & Plotting Buffers
    let thrustHistory = [];
    const FILTER_WINDOW_SIZE = 6;
    let graphPoints = [];
    let headingTracePoints = [];
    let targetTracePoints = [];
    let rudderTracePoints = [];
    let lastHeadingUnwrapped = null;
    let lastTargetUnwrapped = null;
    const MAX_GRAPH_POINTS = 65;

    // Helm control parameters
    const HELM_P_GAIN = 0.45;
    const HELM_P_OUTPUT_FOR_MAX = 30;
    const HELM_RUDDER_SIGN = -1;
    const HELM_RUDDER_EXPONENT = 0.65;
    const HELM_NEAR_TARGET_DEADBAND_DEG = 0.9;
    const HELM_TURN_RATE_FILTER_ALPHA = 0.35;
    const HELM_HOLD_STEP_DEG = 2;
    const RUDDER_PHYSICAL_LIMIT = 0.52;
    const RUDDER_COMMAND_LIMIT = 0.52;

    // Manual speed override controls
    let speedOverrideEnabled = false;
    let speedOverrideValue = 50.0;
    let speedOverrideDynRef = null;
    let speedOverrideOriginalDescriptor = null;
    let dragOverrideEnabled = false;
    let dragOverrideValue = 0.05;
    let dragOverrideOriginalValue = null;
    let dragOverrideHasOriginal = false;
    let dragOverrideDynRef = null;
    let moneySetValue = 10000;

    // Adaptive VPP Profile Table
    const vppProfile = [
        {
            "awa": 0,
            "trim": 0
        },
        {
            "awa": 25,
            "trim": 0
        },
        {
            "awa": 30,
            "trim": 6.66
        },
        {
            "awa": 45,
            "trim": 33.33
        },
        {
            "awa": 60,
            "trim": 36.66
        },
        {
            "awa": 90,
            "trim": 66.66
        },
        {
            "awa": 120,
            "trim": 90
        },
        {
            "awa": 150,
            "trim": 90
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
        if (!dyn) return;

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
    }

    function removeSpeedOverride() {
        if (!speedOverrideDynRef) return;
        try {
            if (speedOverrideOriginalDescriptor) {
                Object.defineProperty(speedOverrideDynRef, 'speed', speedOverrideOriginalDescriptor);
            } else {
                delete speedOverrideDynRef.speed;
            }
        } catch (err) {
            console.debug('Unable to restore original speed descriptor:', err);
        }
    }

    function parseDragOverrideInput() {
        const parsed = Number(elDragValue.value);
        if (Number.isFinite(parsed)) {
            dragOverrideValue = Math.max(0, parsed);
        }
        elDragValue.value = dragOverrideValue.toFixed(3);
    }

    function updateDragOverrideUi() {
        if (dragOverrideEnabled) {
            elDragToggle.innerText = 'ON';
            elDragToggle.style.background = '#0b6b2e';
            elDragToggle.style.borderColor = '#1aa34a';
            elDragStatus.innerText = `active @ ${dragOverrideValue.toFixed(3)}`;
            elDragStatus.style.color = '#7dff9b';
        } else {
            elDragToggle.innerText = 'OFF';
            elDragToggle.style.background = '#333';
            elDragToggle.style.borderColor = '#555';
            elDragStatus.innerText = 'inactive';
            elDragStatus.style.color = '#888';
        }
    }

    function applyDragOverride() {
        const dyn = window.sail?.boat?.dynamics;
        if (!dyn) return;

        if (dragOverrideDynRef !== dyn) {
            dragOverrideDynRef = dyn;
            dragOverrideOriginalValue = Number(dyn.dragCoefficient);
            dragOverrideHasOriginal = Number.isFinite(dragOverrideOriginalValue);
        }

        dyn.dragCoefficient = dragOverrideValue;
    }

    function removeDragOverride() {
        if (!dragOverrideDynRef || !dragOverrideHasOriginal) return;
        try {
            dragOverrideDynRef.dragCoefficient = dragOverrideOriginalValue;
        } catch (err) {
            console.debug('Unable to restore dragCoefficient:', err);
        }
    }

    function syncPassiveOverrideInputs() {
        const dyn = window.sail?.boat?.dynamics;
        if (!dyn) return;

        if (!speedOverrideEnabled) {
            const liveSpeed = Number(dyn.speed);
            if (Number.isFinite(liveSpeed)) {
                speedOverrideValue = Math.max(0, liveSpeed);
                if (document.activeElement !== elSpeedValue) {
                    elSpeedValue.value = speedOverrideValue.toFixed(0);
                }
            }
        }

        if (!dragOverrideEnabled) {
            const liveDrag = Number(dyn.dragCoefficient);
            if (Number.isFinite(liveDrag)) {
                dragOverrideValue = Math.max(0, liveDrag);
                if (document.activeElement !== elDragValue) {
                    elDragValue.value = dragOverrideValue.toFixed(3);
                }
            }
        }
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

    elDragValue.addEventListener('change', parseDragOverrideInput);
    elDragValue.addEventListener('input', parseDragOverrideInput);
    elDragToggle.addEventListener('click', () => {
        parseDragOverrideInput();
        if (dragOverrideEnabled) {
            dragOverrideEnabled = false;
            removeDragOverride();
        } else {
            dragOverrideEnabled = true;
            applyDragOverride();
        }
        updateDragOverrideUi();
    });
    updateDragOverrideUi();

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

    function readLiveCurrentHeading() {
        const speedometer = document.getElementById('speedometer');
        if (!speedometer) return undefined;
        const { currentHeading } = readTelemetryFromSpeedometer(speedometer);
        return currentHeading;
    }

    function collectFrameData(speedometerElement) {
        const {
            currentHeading,
            targetHeading,
        } = readTelemetryFromSpeedometer(speedometerElement);

        const {
            heelAngle,
            apparentWindDirection,
            apparentWindAngle,
            worldWindAngle,
        } = readDynamicsTelemetry(currentHeading);

        const dyn = window.sail?.boat?.dynamics;
        const currentSailAngle = readCurrentSailAngle(dyn);
        const currentSheetLimitAngle = readCurrentSheetLimitAngle(dyn);
        const rudderAngle = Number(dyn?.rudderAngle);

        let instantThrust;
        if (dyn?.forces) {
            try {
                const netForces = dyn.forces.net || {};
                instantThrust = getVectorMagnitude(netForces.forward);
            } catch (err) {
                console.debug('Vector processing failure:', err);
            }
        }

        return {
            currentHeading,
            targetHeading,
            heelAngle,
            apparentWindDirection,
            apparentWindAngle,
            worldWindAngle,
            dyn,
            currentSailAngle,
            currentSheetLimitAngle,
            rudderAngle,
            instantThrust,
        };
    }

    function updateThrustHistory(instantThrust) {
        if (!Number.isFinite(instantThrust)) return;

        thrustHistory.push(instantThrust);
        if (thrustHistory.length > FILTER_WINDOW_SIZE) thrustHistory.shift();

        const sum = thrustHistory.reduce((a, b) => a + b, 0);
        const avgThrust = sum / thrustHistory.length;

        elThrustReadout.innerText = `${avgThrust.toFixed(2)} N`;

        graphPoints.push(avgThrust);
        if (graphPoints.length > MAX_GRAPH_POINTS) graphPoints.shift();
        renderThrustGraph();
    }

    function pushHeadingAndTargetTraces(currentHeading, helmControlTargetHeading) {
        if (currentHeading !== undefined) {
            lastHeadingUnwrapped = unwrapAngle(lastHeadingUnwrapped, currentHeading);
            headingTracePoints.push(lastHeadingUnwrapped);
        } else {
            headingTracePoints.push(null);
        }

        if (helmControlTargetHeading !== undefined) {
            // Keep target plotted on the same angular branch as heading to avoid mirror/opposite traces.
            if (lastHeadingUnwrapped !== null && lastHeadingUnwrapped !== undefined) {
                lastTargetUnwrapped = unwrapAngleNearReference(lastHeadingUnwrapped, helmControlTargetHeading);
            } else {
                lastTargetUnwrapped = unwrapAngle(lastTargetUnwrapped, helmControlTargetHeading);
            }
            targetTracePoints.push(lastTargetUnwrapped);
        } else {
            targetTracePoints.push(null);
        }

        if (headingTracePoints.length > MAX_GRAPH_POINTS) headingTracePoints.shift();
        if (targetTracePoints.length > MAX_GRAPH_POINTS) targetTracePoints.shift();
        renderAngleGraph();
    }

    function pushRudderTrace(rudderAngle) {
        rudderTracePoints.push(Number.isFinite(rudderAngle) ? rudderAngle : null);
        if (rudderTracePoints.length > MAX_GRAPH_POINTS) rudderTracePoints.shift();
        renderHeelRudderGraph();
    }

    function updateHelmModeUi() {
        const holdModeActive = helmMode === 'hold';
        elHoldHeadingValue.disabled = !holdModeActive;
        elHoldHeadingApply.disabled = !holdModeActive;
        if (helmMode === 'hold') {
            elHelmModeToggle.innerText = 'HOLD';
            elHelmModeToggle.style.background = '#0b6b2e';
            elHelmModeToggle.style.borderColor = '#1aa34a';
            elHoldHeadingApply.style.background = '#0b6b2e';
            elHoldHeadingApply.style.borderColor = '#1aa34a';
        } else {
            elHelmModeToggle.innerText = 'TARGET';
            elHelmModeToggle.style.background = '#333';
            elHelmModeToggle.style.borderColor = '#555';
            elHoldHeadingApply.style.background = '#333';
            elHoldHeadingApply.style.borderColor = '#555';
        }
    }

    function setHoldHeadingFromValue(rawValue) {
        const parsed = Number(rawValue);
        if (!Number.isFinite(parsed)) return false;
        helmHoldHeading = normalizeCompassDegrees(parsed);
        elHoldHeadingValue.value = helmHoldHeading.toFixed(0);
        return true;
    }

    function syncHoldHeadingInput() {
        if (helmMode !== 'hold') return;
        if (!Number.isFinite(helmHoldHeading)) return;
        if (document.activeElement === elHoldHeadingValue) return;
        elHoldHeadingValue.value = helmHoldHeading.toFixed(0);
    }

    function updateHelmStatusUi() {
        elHelmToggle.innerText = helmActive ? 'Toggle Helm Control (ACTIVE)' : 'Toggle Helm Control (OFF)';
        elHelmToggle.style.background = helmActive ? '#0b6b2e' : '#333';
        elHelmToggle.style.borderColor = helmActive ? '#1aa34a' : '#555';
    }

    function updateSailStatusUi() {
        elSailToggle.innerText = sailActive ? 'Toggle Sail Control (ACTIVE)' : 'Toggle Sail Control (OFF)';
        elSailToggle.style.background = sailActive ? '#0b6b2e' : '#333';
        elSailToggle.style.borderColor = sailActive ? '#1aa34a' : '#555';
    }

    function toggleHelmControl() {
        helmActive = !helmActive;
        if (helmActive && helmMode === 'hold') {
            const liveHeading = readLiveCurrentHeading();
            if (liveHeading !== undefined) {
                helmHoldHeading = normalizeCompassDegrees(liveHeading);
            }
        }
        if (!helmActive) {
            setRudderAngle(0);
        }
        updateHelmStatusUi();
    }

    function toggleSailControl() {
        sailActive = !sailActive;
        updateSailStatusUi();
    }

    elHelmModeToggle.addEventListener('click', () => {
        helmMode = (helmMode === 'target') ? 'hold' : 'target';
        if (helmMode === 'hold') {
            const liveHeading = readLiveCurrentHeading();
            if (liveHeading !== undefined) {
                helmHoldHeading = normalizeCompassDegrees(liveHeading);
            }
            if (Number.isFinite(helmHoldHeading)) {
                elHoldHeadingValue.value = helmHoldHeading.toFixed(0);
            }
        }
        updateHelmModeUi();
    });
    updateHelmModeUi();

    elHoldHeadingApply.addEventListener('click', () => {
        setHoldHeadingFromValue(elHoldHeadingValue.value);
    });
    elHoldHeadingValue.addEventListener('change', () => {
        setHoldHeadingFromValue(elHoldHeadingValue.value);
    });
    elHoldHeadingValue.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            setHoldHeadingFromValue(elHoldHeadingValue.value);
            e.preventDefault();
        }
    });

    elHelmToggle.addEventListener('click', toggleHelmControl);
    elSailToggle.addEventListener('click', toggleSailControl);
    updateHelmStatusUi();
    updateSailStatusUi();

    // Key Listeners
    window.addEventListener('keydown', (e) => {
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && helmMode === 'hold') {
            let baseHeading = helmHoldHeading;
            if (!Number.isFinite(baseHeading)) {
                const liveHeading = readLiveCurrentHeading();
                if (liveHeading !== undefined) {
                    baseHeading = normalizeCompassDegrees(liveHeading);
                }
            }

            if (Number.isFinite(baseHeading)) {
                const signedStep = (e.key === 'ArrowLeft') ? -HELM_HOLD_STEP_DEG : HELM_HOLD_STEP_DEG;
                helmHoldHeading = normalizeCompassDegrees(baseHeading + signedStep);
                elHoldHeadingValue.value = helmHoldHeading.toFixed(0);
                e.preventDefault();
            }
        }
    });

    function setRudderAngle(value) {
        const dyn = window.sail?.boat?.dynamics;
        if (!dyn) return;
        const clamped = Math.max(-RUDDER_COMMAND_LIMIT, Math.min(RUDDER_COMMAND_LIMIT, value));
        dyn.rudderAngle = clamped;
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

    function unwrapAngleNearReference(referenceUnwrapped, currentWrapped) {
        if (referenceUnwrapped === null || referenceUnwrapped === undefined) return currentWrapped;
        let aligned = currentWrapped;
        while ((aligned - referenceUnwrapped) > 180) aligned -= 360;
        while ((aligned - referenceUnwrapped) < -180) aligned += 360;
        return aligned;
    }

    function renderTacticalCompass(hdg, trg, apparentWindAngle, worldWindAngle, apparentWindDirection, sail, trgSail) {
        const cx = 65, cy = 65;
        const outerR = 55;
        const innerR = 45;
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
        compassCtx.arc(cx, cy, outerR, 0, 2 * Math.PI);
        compassCtx.strokeStyle = '#333';
        compassCtx.lineWidth = 2;
        compassCtx.stroke();

        compassCtx.beginPath();
        compassCtx.arc(cx, cy, innerR, 0, 2 * Math.PI);
        compassCtx.strokeStyle = '#2a2a2a';
        compassCtx.lineWidth = 1;
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

        const drawRingAnnotation = (angleDeg, color, label) => {
            const rad = (-angleDeg - 90) * Math.PI / 180;
            const x1 = cx + innerR * Math.cos(rad);
            const y1 = cy + innerR * Math.sin(rad);
            const x2 = cx + outerR * Math.cos(rad);
            const y2 = cy + outerR * Math.sin(rad);

            compassCtx.beginPath();
            compassCtx.moveTo(x1, y1);
            compassCtx.lineTo(x2, y2);
            compassCtx.strokeStyle = color;
            compassCtx.lineWidth = 2;
            compassCtx.lineCap = 'round';
            compassCtx.stroke();

            const labelR = outerR + 7;
            const tx = cx + labelR * Math.cos(rad);
            const ty = cy + labelR * Math.sin(rad);
            compassCtx.font = '8px monospace';
            compassCtx.fillStyle = color;
            compassCtx.textAlign = 'center';
            compassCtx.textBaseline = 'middle';
            compassCtx.fillText(label, tx, ty);
        };

        let currentHdgSafe = (hdg !== undefined) ? hdg : 0;

        const apparentMarkerAngle = (apparentWindAngle !== undefined)
            ? apparentWindAngle
            : (apparentWindDirection !== undefined ? wrapSignedAngleDegrees(apparentWindDirection - currentHdgSafe) : undefined);

        if (apparentMarkerAngle !== undefined) {
            drawRingAnnotation(apparentMarkerAngle, '#ff66ff', 'A');
        }
        if (worldWindAngle !== undefined) {
            drawRingAnnotation(worldWindAngle, '#66b3ff', 'W');
        }

        drawNeedle(0, innerR - 2, '#ffffff', 2.5);

        if (trg !== undefined) {
            let relativeTargetAngle = trg - currentHdgSafe;
            drawNeedle(relativeTargetAngle, outerR - 2, '#ffd166', 2);
        }

        if (worldWindAngle !== undefined) {
            drawNeedle(worldWindAngle, innerR - 2, '#66b3ff', 1.6, true);
        }

        if (apparentWindAngle !== undefined) {
            drawNeedle(apparentWindAngle, innerR + 1, '#ff66ff', 2, true);
        }

        if (sail !== undefined && trgSail !== undefined) {
            // Game sail rotations are already absolute around the boat axis.
            // Negate to match compass Y-axis orientation without vertical mirroring.
            let compassSailPos = -sail;
            let compassTargetSailPos = -trgSail;

            drawNeedle(compassSailPos, innerR - 12, '#00ffcc', 3);
            drawNeedle(compassTargetSailPos, innerR - 12, 'rgba(0, 240, 255, 0.5)', 1.5, true);
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
        const width = angleCtx.canvas.width;
        const height = angleCtx.canvas.height;
        angleCtx.clearRect(0, 0, width, height);

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
        const bottom = height - 4;
        angleCtx.strokeStyle = '#222';
        angleCtx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
            const y = top + ((bottom - top) / 3) * i;
            angleCtx.beginPath();
            angleCtx.moveTo(0, y);
            angleCtx.lineTo(width, y);
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
                const x = (width / (MAX_GRAPH_POINTS - 1)) * i;
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

    function renderHeelRudderGraph() {
        const width = heelRudderCtx.canvas.width;
        const height = heelRudderCtx.canvas.height;
        heelRudderCtx.clearRect(0, 0, width, height);

        const hasRudderData = rudderTracePoints.some(v => v !== null && v !== undefined);
        if (!hasRudderData) return;

        // Keep rudder axis fixed so visual amplitude is stable over time.
        const minV = -RUDDER_PHYSICAL_LIMIT;
        const maxV = RUDDER_PHYSICAL_LIMIT;

        const top = 4;
        const bottom = height - 4;
        heelRudderCtx.strokeStyle = '#222';
        heelRudderCtx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
            const y = top + ((bottom - top) / 3) * i;
            heelRudderCtx.beginPath();
            heelRudderCtx.moveTo(0, y);
            heelRudderCtx.lineTo(width, y);
            heelRudderCtx.stroke();
        }

        const yZero = bottom - ((0 - minV) / (maxV - minV)) * (bottom - top);
        heelRudderCtx.beginPath();
        heelRudderCtx.moveTo(0, yZero);
        heelRudderCtx.lineTo(width, yZero);
        heelRudderCtx.strokeStyle = '#2f2f2f';
        heelRudderCtx.lineWidth = 1;
        heelRudderCtx.stroke();

        const drawSeries = (points, color) => {
            heelRudderCtx.beginPath();
            let drawing = false;
            for (let i = 0; i < points.length; i++) {
                const v = points[i];
                if (v === null || v === undefined) {
                    drawing = false;
                    continue;
                }
                const x = (width / (MAX_GRAPH_POINTS - 1)) * i;
                const ratio = (v - minV) / (maxV - minV);
                const y = bottom - ratio * (bottom - top);
                if (!drawing) {
                    heelRudderCtx.moveTo(x, y);
                    drawing = true;
                } else {
                    heelRudderCtx.lineTo(x, y);
                }
            }
            heelRudderCtx.strokeStyle = color;
            heelRudderCtx.lineWidth = 1.6;
            heelRudderCtx.stroke();
        };

        drawSeries(rudderTracePoints, '#66b3ff');

        let latestRudder = null;
        for (let i = rudderTracePoints.length - 1; i >= 0; i--) {
            const v = rudderTracePoints[i];
            if (v !== null && v !== undefined) {
                latestRudder = v;
                break;
            }
        }

        heelRudderCtx.fillStyle = '#66b3ff';
        heelRudderCtx.font = '9px monospace';
        heelRudderCtx.textAlign = 'left';
        heelRudderCtx.fillText('R', 14, 11);

        if (latestRudder !== null) {
            heelRudderCtx.textAlign = 'right';
            heelRudderCtx.fillText(`R ${latestRudder.toFixed(2)}`, width - 4, 11);
        }
    }

    // Master operational frame loop (Runs every 80ms)
    setInterval(() => {
        syncPassiveOverrideInputs();

        if (speedOverrideEnabled) {
            applySpeedOverride();
        }
        if (dragOverrideEnabled) {
            applyDragOverride();
        }

        const speedometer = document.getElementById('speedometer');
        if (!speedometer) return;

        const frameData = collectFrameData(speedometer);
        const {
            currentHeading,
            targetHeading,
            heelAngle,
            apparentWindDirection,
            apparentWindAngle,
            worldWindAngle,
            dyn,
            currentSailAngle,
            currentSheetLimitAngle,
            rudderAngle,
            instantThrust,
        } = frameData;

        if (helmMode === 'hold' && !Number.isFinite(helmHoldHeading) && currentHeading !== undefined) {
            helmHoldHeading = normalizeCompassDegrees(currentHeading);
            elHoldHeadingValue.value = helmHoldHeading.toFixed(0);
        }

        syncHoldHeadingInput();

        const helmControlTargetHeading = (helmMode === 'hold' && Number.isFinite(helmHoldHeading))
            ? helmHoldHeading
            : targetHeading;

        const trimReadoutCurrent = Number.isFinite(currentSheetLimitAngle) ? `${currentSheetLimitAngle.toFixed(1)}°` : '--°';
        const trimReadoutTarget = (apparentWindAngle !== undefined)
            ? `${getVppTargetTrim(Math.abs(apparentWindAngle)).toFixed(1)}°`
            : '--°';
        elTrimReadout.innerText = `${trimReadoutCurrent}/${trimReadoutTarget}`;
        updateThrustHistory(instantThrust);

        let displayTarget = (helmControlTargetHeading !== undefined) ? `${helmControlTargetHeading.toFixed(0)}°` : '--°';
        let displayHeading = (currentHeading !== undefined) ? `${currentHeading.toFixed(0)}°` : '--°';
        elNavReadout.innerText = `${displayHeading}/${displayTarget}`;

        const heelText = (heelAngle !== undefined) ? ` | H ${heelAngle.toFixed(1)}°` : '';
        if (apparentWindAngle !== undefined) {
            elWindReadout.innerText = `${apparentWindAngle.toFixed(0)}°${heelText}`;
        } else if (apparentWindDirection !== undefined) {
            elWindReadout.innerText = `Dir ${apparentWindDirection.toFixed(0)}°${heelText}`;
        } else {
            elWindReadout.innerText = `--°${heelText}`;
        }

        pushHeadingAndTargetTraces(currentHeading, helmControlTargetHeading);
        pushRudderTrace(rudderAngle);

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

        if (helmActive && currentHeading !== undefined && helmControlTargetHeading !== undefined) {
            let headingError = helmControlTargetHeading - currentHeading;
            headingError = wrapSignedAngleDegrees(headingError);

            if (Math.abs(headingError) < HELM_NEAR_TARGET_DEADBAND_DEG) {
                helmActionEl.innerText = "On Course";
                helmActionEl.style.color = '#00ff00';
                setRudderAngle(0);
            } else {
                const pOutput = HELM_P_GAIN * headingError;
                const absOutput = Math.abs(pOutput);
                const outputRatio = Math.min(1, absOutput / HELM_P_OUTPUT_FOR_MAX);
                const curvedRatio = Math.pow(outputRatio, HELM_RUDDER_EXPONENT);
                const rudderCmd = HELM_RUDDER_SIGN * Math.sign(pOutput) * curvedRatio;

                if (pOutput > 0) {
                    helmActionEl.innerText = `P Left [rudder ${rudderCmd.toFixed(2)} | out ${pOutput.toFixed(2)} | r ${helmTurnRateDps.toFixed(1)}]`;
                    helmActionEl.style.color = '#3399ff';
                } else {
                    helmActionEl.innerText = `P Right [rudder ${rudderCmd.toFixed(2)} | out ${pOutput.toFixed(2)} | r ${helmTurnRateDps.toFixed(1)}]`;
                    helmActionEl.style.color = '#ffd166';
                }
                setRudderAngle(rudderCmd);
            }
        } else if (helmActive) {
            setRudderAngle(0);
            helmActionEl.innerText = (helmMode === 'hold') ? "Waiting for Hold Heading..." : "Waiting for Race Target...";
            helmActionEl.style.color = '#666';
        } else {
            helmLastHeadingUnwrapped = null;
            helmLastSampleTimeMs = 0;
            helmTurnRateDps = 0;
            helmActionEl.innerText = (helmControlTargetHeading === undefined)
                ? ((helmMode === 'hold') ? "Waiting for Hold Heading..." : "Waiting for Race Target...")
                : "Disabled";
            helmActionEl.style.color = '#666';
        }

        // ==========================================
        // AXIS 2: SAIL TRIMMING ENGINE & REAL-TIME OPTIMIZATION
        // ==========================================
        const trimActionEl = elTrimAction;
        if (currentSailAngle !== undefined && apparentWindAngle !== undefined) {
            let absWindFromNose = Math.abs(apparentWindAngle);
            let currentExtension = currentSailAngle;

            let targetExtension = getVppTargetTrim(absWindFromNose);
            let targetRotation = (apparentWindAngle >= 0) ? (180 - targetExtension) : (180 + targetExtension);
            let currentRotation = (apparentWindAngle >= 0) ? (180 - currentExtension) : (180 + currentExtension);

            renderTacticalCompass(currentHeading, helmControlTargetHeading, apparentWindAngle, worldWindAngle, apparentWindDirection, currentRotation, targetRotation);

            if (sailActive) {
                const error = targetExtension - currentExtension;
                const absError = Math.abs(error);

                // Command the final trim target directly instead of stepping toward it.
                setSheetLimitRadians(targetExtension * (Math.PI / 180));

                if (absError <= 1.2) {
                    trimActionEl.innerText = `On Target`;
                    trimActionEl.style.color = '#00f0ff';
                } else {
                    if (error > 0) {
                        trimActionEl.innerText = `Releasing via sheetLimit -> ${targetExtension.toFixed(1)}°`;
                        trimActionEl.style.color = '#00ffcc';
                    } else {
                        trimActionEl.innerText = `Trimming via sheetLimit -> ${targetExtension.toFixed(1)}°`;
                        trimActionEl.style.color = '#ffaa00';
                    }
                }
            } else {
                trimActionEl.innerText = "Disabled";
                trimActionEl.style.color = '#666';
            }
        } else {
            // Keep compass active even when sail telemetry is temporarily unavailable.
            renderTacticalCompass(currentHeading, helmControlTargetHeading, apparentWindAngle, worldWindAngle, apparentWindDirection, currentSailAngle, undefined);

            if (!sailActive) {
                trimActionEl.innerText = "Disabled";
                trimActionEl.style.color = '#666';
            } else {
                trimActionEl.innerText = "Waiting for Wind/Sail Telemetry...";
                trimActionEl.style.color = '#888';
            }
        }

    }, 80);
})();