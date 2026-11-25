(function () {
    function normalizeName(value) {
        return String(value || '')
            .trim()
            .replace(/^Dr\.?\s*/i, '')
            .toLowerCase()
            .replace(/\s+/g, ' ');
    }

    function isActiveAppointment(appointment, now = new Date()) {
        if (!appointment) return false;
        const status = String(appointment.status || 'pending').toLowerCase();
        if (status !== 'approved' && status !== 'confirmed') return false;

        const date = String(appointment.appointmentDate || '').trim();
        const time = String(appointment.appointmentTime || '').trim();
        if (!date || !time) return false;

        const start = new Date(date + 'T' + time + ':00');
        if (Number.isNaN(start.getTime())) return false;

        const availableFrom = start;
        const availableUntil = new Date(start.getTime() + 60 * 60 * 1000);
        return now >= availableFrom && now <= availableUntil;
    }

    function isChatAvailable(appointment, now = new Date()) {
        if (isActiveAppointment(appointment, now)) return true;
        if (!appointment || !appointment.preChatUnlockedAt) return false;

        const status = String(appointment.status || 'pending').toLowerCase();
        if (!['pending', 'approved', 'confirmed'].includes(status)) return false;

        const date = String(appointment.appointmentDate || '').trim();
        const time = String(appointment.appointmentTime || '').trim();
        if (!date || !time) return false;

        const start = new Date(date + 'T' + time + ':00');
        const unlockedAt = new Date(appointment.preChatUnlockedAt);
        if (Number.isNaN(start.getTime()) || Number.isNaN(unlockedAt.getTime()) || unlockedAt > now) return false;

        const availableUntil = new Date(start.getTime() + 60 * 60 * 1000);
        return now <= availableUntil;
    }

    async function getActiveDoctors() {
        const api = window.DockTalkAPI;
        if (!api || !api.getToken()) return new Set();

        try {
            const appointments = await api.getAppointments();
            return new Set(
                appointments
                    .filter((appointment) => isActiveAppointment(appointment))
                    .map((appointment) => normalizeName(appointment.doctorName))
            );
        } catch (error) {
            console.warn('Unable to load appointment access.', error);
            return new Set();
        }
    }

    async function getChatAvailableDoctors() {
        const api = window.DockTalkAPI;
        if (!api || !api.getToken()) return new Set();

        try {
            const appointments = await api.getAppointments();
            return new Set(
                appointments
                    .filter((appointment) => isChatAvailable(appointment))
                    .map((appointment) => normalizeName(appointment.doctorName))
            );
        } catch (error) {
            console.warn('Unable to load appointment chat access.', error);
            return new Set();
        }
    }

    async function getBookedDoctors() {
        const api = window.DockTalkAPI;
        if (!api || !api.getToken()) return new Set();

        try {
            const appointments = await api.getAppointments();
            return new Set(
                appointments
                    .filter((appointment) => {
                        const status = String(appointment.status || 'pending').toLowerCase();
                        return ['pending', 'approved', 'confirmed'].includes(status);
                    })
                    .map((appointment) => normalizeName(appointment.doctorName))
            );
        } catch (error) {
            console.warn('Unable to load booked doctors.', error);
            return new Set();
        }
    }

    async function getAppointments() {
        const api = window.DockTalkAPI;
        if (!api || !api.getToken()) return [];
        try {
            return await api.getAppointments();
        } catch (error) {
            console.warn('Unable to load appointments.', error);
            return [];
        }
    }

    function addCallControl(actions, doctorName, active) {
        if (!actions || actions.querySelector('[data-appointment-call]')) return;

        const call = document.createElement('button');
        call.type = 'button';
        call.className = 'small-btn call appointment-call';
        call.dataset.appointmentCall = 'true';
        call.dataset.doctorName = doctorName;
        call.dataset.callMode = 'video';
        call.textContent = 'Call';
        call.disabled = !active;
        if (!active) {
            call.title = 'Available during your booked appointment time slot';
        }
        actions.appendChild(call);
    }

    window.DockTalkAppointmentAccess = {
        isActiveAppointment,
        isChatAvailable,
        getActiveDoctors,
        getChatAvailableDoctors,
        getBookedDoctors,
        getAppointments,
        addCallControl,
        normalizeName
    };
})();
