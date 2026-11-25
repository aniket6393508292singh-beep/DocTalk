(function () {
    let stream = null;
    let isMuted = false;
    let isCameraOff = false;
    let mode = 'audio';

    function buildModal() {
        if (document.getElementById('docktalkCallModal')) return;

        const modal = document.createElement('div');
        modal.id = 'docktalkCallModal';
        modal.className = 'call-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.innerHTML = `
            <div class="call-card">
                <header class="call-header">
                    <div>
                        <h2 id="docktalkCallTitle">Calling Doctor</h2>
                        <span id="docktalkCallStatus" class="call-status">Preparing call...</span>
                    </div>
                    <button type="button" class="call-close" id="docktalkCallClose" aria-label="Close call">✕</button>
                </header>
                <div id="docktalkCallPreview" class="call-preview audio-only">
                    <div class="call-avatar">DR</div>
                    <video id="docktalkCallVideo" autoplay muted playsinline></video>
                    <p id="docktalkCallError" class="call-error" hidden></p>
                </div>
                <div class="call-controls">
                    <button type="button" class="call-control" id="docktalkMuteButton">🎙️ Mute</button>
                    <button type="button" class="call-control" id="docktalkCameraButton" hidden>📷 Camera</button>
                    <button type="button" class="call-control end-call" id="docktalkEndCall">End Call</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function stopStream() {
        if (stream) {
            stream.getTracks().forEach((track) => track.stop());
            stream = null;
        }
    }

    async function startMedia() {
        stopStream();
        const video = document.getElementById('docktalkCallVideo');
        const preview = document.getElementById('docktalkCallPreview');
        const error = document.getElementById('docktalkCallError');

        error.hidden = true;
        preview.querySelector('.call-avatar').style.display = '';

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Media devices are not supported');
            }
            stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: mode === 'video'
            });
            video.srcObject = stream;
            const status = document.getElementById('docktalkCallStatus');
            status.textContent = mode === 'video'
                ? 'Video connected • Preview active'
                : 'Audio connected • Microphone active';
            preview.querySelector('.call-avatar').style.display = mode === 'video' ? 'none' : '';
        } catch (requestError) {
            const status = document.getElementById('docktalkCallStatus');
            status.textContent = 'Connection needs microphone or camera access';
            error.hidden = false;
            error.textContent =
                'Permission was not granted or the device is unavailable. Allow ' +
                (mode === 'video' ? 'camera and microphone' : 'microphone') +
                ' access in your browser and try again.';
        }
    }

    async function openCall(requestedMode, doctorName) {
        buildModal();
        mode = requestedMode === 'video' ? 'video' : 'audio';
        isMuted = false;
        isCameraOff = false;

        const modal = document.getElementById('docktalkCallModal');
        const preview = document.getElementById('docktalkCallPreview');
        const title = document.getElementById('docktalkCallTitle');
        const status = document.getElementById('docktalkCallStatus');
        const muteButton = document.getElementById('docktalkMuteButton');
        const cameraButton = document.getElementById('docktalkCameraButton');

        title.textContent = mode === 'video'
            ? 'Video Call' + (doctorName ? ' with ' + doctorName : '')
            : 'Audio Call' + (doctorName ? ' with ' + doctorName : '');
        status.textContent = 'Preparing call...';
        muteButton.textContent = '🎙️ Mute';
        muteButton.classList.remove('active');
        preview.classList.toggle('audio-only', mode !== 'video');
        cameraButton.hidden = mode !== 'video';

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        await startMedia();
    }

    function closeCall() {
        stopStream();
        const modal = document.getElementById('docktalkCallModal');
        if (!modal) return;
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.getElementById('docktalkCallStatus').textContent = 'Call ended';
        document.getElementById('docktalkCallVideo').srcObject = null;
    }

    document.addEventListener('DOMContentLoaded', function () {
        buildModal();

        document.addEventListener('click', function (event) {
            const trigger = event.target.closest('[data-call-mode]');
            if (trigger) {
                if (trigger.disabled || trigger.getAttribute('aria-disabled') === 'true') return;
                const callModal = trigger.closest('.modal');
                if (callModal) callModal.classList.remove('active');
                const doctorCard = trigger.closest('.card');
                const doctorItem = trigger.closest('.doctor-item');
                const doctorName =
                    doctorCard?.querySelector('h3')?.textContent?.trim() ||
                    doctorItem?.querySelector('.doctor-name')?.textContent?.trim() ||
                    trigger.dataset.doctorName ||
                    null;
                openCall(trigger.dataset.callMode, doctorName);
            }
        });

        document.addEventListener('click', function (event) {
            if (event.target.closest('#docktalkCallClose') || event.target.closest('#docktalkEndCall')) {
                closeCall();
            }
        });

        document.getElementById('docktalkCallModal').addEventListener('click', function (event) {
            if (event.target === event.currentTarget) closeCall();
        });

        document.getElementById('docktalkMuteButton').addEventListener('click', function (event) {
            if (!stream) return;
            isMuted = !isMuted;
            stream.getAudioTracks().forEach((track) => { track.enabled = !isMuted; });
            event.currentTarget.textContent = isMuted ? '🔇 Unmute' : '🎙️ Mute';
            event.currentTarget.classList.toggle('active', isMuted);
        });

        document.getElementById('docktalkCameraButton').addEventListener('click', function (event) {
            if (!stream) return;
            isCameraOff = !isCameraOff;
            stream.getVideoTracks().forEach((track) => { track.enabled = !isCameraOff; });
            event.currentTarget.textContent = isCameraOff ? '📷 Camera On' : '📷 Camera Off';
            event.currentTarget.classList.toggle('active', isCameraOff);
        });
    });

    window.DockTalkCall = { open: openCall, close: closeCall };
})();
