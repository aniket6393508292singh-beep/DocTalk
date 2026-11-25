(function () {
    const modal = document.getElementById('appointmentModal');
    const form = document.getElementById('appointmentForm');
    const doctorField = document.getElementById('appointmentDoctor');
    const dateInput = document.getElementById('appointmentDate');
    const closeButtons = document.querySelectorAll('[data-close-booking]');

    const setTodayMinimum = () => {
        if (!dateInput) return;
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    };

    const openModal = (doctorName) => {
        if (!modal) return;
        if (doctorField && doctorName) {
            doctorField.value = doctorName;
        }
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        setTodayMinimum();
    };

    const closeModal = () => {
        if (!modal) return;
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    };

    document.addEventListener('click', function (event) {
        const trigger = event.target.closest('button.btn');
        if (!trigger) return;

        const buttonText = (trigger.textContent || '').trim();
        if (!['Book', 'Book Appointment'].includes(buttonText)) return;

        event.preventDefault();

        const card = trigger.closest('.card');
        const doctorName = card?.querySelector('h3')?.textContent?.trim() || 'Selected specialist';
        openModal(doctorName);
    });

    closeButtons.forEach((button) => {
        button.addEventListener('click', closeModal);
    });

    if (modal) {
        modal.addEventListener('click', function (event) {
            if (event.target === modal) {
                closeModal();
            }
        });
    }

    if (form) {
        form.addEventListener('submit', async function (event) {
            event.preventDefault();

            const data = new FormData(this);
            const name = data.get('name') || 'Guest';
            const doctor = data.get('doctor') || 'Selected specialist';
            const contactPhone = String(data.get('contactPhone') || '').trim();
            const date = data.get('date') || 'Flexible';
            const time = data.get('time') || 'Flexible';
            const mode = data.get('mode') || 'Flexible';

            const api = window.DockTalkAPI;
            if (!api || !api.getToken()) {
                alert('Please sign in before booking an appointment.');
                return;
            }

            try {
                const result = await api.createAppointment({
                    doctorName: doctor,
                    contactPhone,
                    date,
                    time,
                    mode,
                    notes: `${name} booked via specialist page.`
                });
                if (!result || !result.appointment) {
                    throw new Error('The server did not return the saved appointment.');
                }
            } catch (error) {
                alert(`Appointment could not be saved: ${error.message}`);
                return;
            }

            alert(`Appointment request received for ${name} with ${doctor} on ${date} at ${time} (${mode}). Our care team will confirm shortly.`);
            this.reset();
            setTodayMinimum();
            closeModal();
            if (window.parent !== window && typeof window.parent.loadPatientAppointments === 'function') {
                window.parent.loadPatientAppointments();
            }
        });
    }

    setTodayMinimum();
})();
