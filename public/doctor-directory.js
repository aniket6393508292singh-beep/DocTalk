(function () {
    const category = document.body.dataset.doctorCategory;
    if (!category) return;

    const aliases = {
        Cardiology: ['Cardiology', 'Cardiologist'],
        Pediatrics: ['Pediatrics', 'Pediatric', 'Paediatrics', 'Paediatric'],
        Therapy: ['Therapy', 'Psychiatry', 'Psychology', 'Mental Health'],
        Orthopedics: ['Orthopedics', 'Orthopaedics', 'Orthopedic', 'Orthopaedic']
    };

    const acceptedSpecialties = aliases[category] || [category];
    const grid = document.querySelector('.cards-grid');
    if (!grid) return;

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function matchesCategory(specialty) {
        const normalized = String(specialty || '').trim().toLowerCase();
        return acceptedSpecialties.some((value) =>
            normalized === value.toLowerCase() ||
            normalized.includes(value.toLowerCase())
        );
    }

    function getDisplayName(name) {
        const trimmed = String(name || '').trim();
        return /^dr\.?\s/i.test(trimmed) ? trimmed : 'Dr. ' + trimmed;
    }

    function createDoctorCard(doctor) {
        const card = document.createElement('article');
        card.className = 'card registered-doctor-card';

        const initials = getDisplayName(doctor.name)
            .replace(/^Dr\.?\s*/i, '')
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('')
            .toUpperCase();

        const experience = Number(doctor.experience_years || 0);
        const specialties = Array.isArray(doctor.consultationModes) && doctor.consultationModes.length
            ? doctor.consultationModes
            : ['Video consultation'];

        card.innerHTML = `
            <div class="avatar">${escapeHtml(initials)}</div>
            <div class="card-body">
                <h3>${escapeHtml(getDisplayName(doctor.name))}</h3>
                <div class="meta">${escapeHtml(doctor.degree || 'Registered Medical Professional')}</div>
                <div class="experience">${experience ? experience + ' years experience — ' : ''}${escapeHtml(doctor.bio || 'Registered DockTalk ' + doctor.specialty + ' specialist.')}</div>
                <ul class="specialties">
                    ${specialties.map((mode) =>
                        `<li>${escapeHtml(String(mode).replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()))}</li>`
                    ).join('')}
                </ul>
                <div class="card-footer">
                    <div class="location">${escapeHtml(doctor.location || 'Location not provided')}</div>
                    <div>
                        <button type="button" class="btn">Book Appointment</button>
                        <a class="chat-btn" href="chat.html?doctor=${encodeURIComponent(getDisplayName(doctor.name))}">Chat</a>
                    </div>
                </div>
            </div>
        `;
        return card;
    }

    async function loadRegisteredDoctors() {
        if (!window.DockTalkAPI) return;

        try {
            const doctors = await window.DockTalkAPI.getDoctors();
            const existingNames = new Set(
                [...grid.querySelectorAll('.card h3')]
                    .map((heading) => heading.textContent.trim().replace(/^Dr\.?\s*/i, '').toLowerCase())
            );

            doctors
                .filter((doctor) => matchesCategory(doctor.specialty))
                .forEach((doctor) => {
                    const nameKey = String(doctor.name || '')
                        .trim()
                        .replace(/^Dr\.?\s*/i, '')
                        .toLowerCase();
                    if (!nameKey || existingNames.has(nameKey)) return;
                    existingNames.add(nameKey);
                    grid.appendChild(createDoctorCard(doctor));
                });
        } catch (error) {
            console.warn('Unable to load registered doctors.', error);
        }
    }

    loadRegisteredDoctors();
})();
