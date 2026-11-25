(function () {
  const API_BASE = window.DOCKTALK_API_BASE ||
    (window.location.protocol === 'file:' ? 'http://localhost:5000/api' : '/api');

  function readStorage(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      if (value === null || value === undefined) {
        window.localStorage.removeItem(key);
        return;
      }
      window.localStorage.setItem(key, String(value));
    } catch (error) {
      // Storage may be blocked in some embedded contexts.
    }
  }

  function getToken() {
    return readStorage('docktalk_auth_token');
  }

  function setSession(user, token) {
    if (user) {
      writeStorage('docktalk_current_user', JSON.stringify(user));
    }
    if (token) {
      writeStorage('docktalk_auth_token', token);
    }
  }

  function clearSession() {
    writeStorage('docktalk_current_user', null);
    writeStorage('docktalk_auth_token', null);
  }

  function getCurrentUser() {
    const raw = readStorage('docktalk_current_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  async function request(path, options = {}) {
    const method = options.method || 'GET';
    const payload = options.body;
    const headers = Object.assign({}, options.headers || {});
    const auth = options.auth !== false;

    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const init = {
      method,
      headers
    };

    if (payload !== undefined && !isFormData) {
      if (!headers['Content-Type'] && !headers['content-type']) {
        init.headers['Content-Type'] = 'application/json';
      }
      init.body = typeof payload === 'string' ? payload : JSON.stringify(payload);
    } else if (payload !== undefined && isFormData) {
      init.body = payload;
      delete init.headers['Content-Type'];
    }

    const token = auth ? getToken() : null;
    if (token) {
      init.headers.Authorization = 'Bearer ' + token;
    }

    let response;
    try {
      response = await fetch(API_BASE + path, init);
    } catch (error) {
      const message = window.location.protocol === 'file:'
        ? 'Cannot connect to DockTalk. Start the server with "npm start" and open http://localhost:5000.'
        : 'Cannot connect to DockTalk. Check your connection and try again.';
      throw new Error(message);
    }
    const contentType = response.headers.get('content-type') || '';
    const result = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const errorMessage = typeof result === 'object' && result && result.error
        ? result.error
        : 'Request failed';
      throw new Error(errorMessage);
    }

    return result;
  }

  const api = {
    getToken,
    setSession,
    clearSession,
    getCurrentUser,
    request,
    register: function register(data) {
      return request('/auth/register', { method: 'POST', body: data, auth: false });
    },
    login: function login(data) {
      return request('/auth/login', { method: 'POST', body: data, auth: false });
    },
    me: function me() {
      return request('/auth/me');
    },
    getDoctors: function getDoctors() {
      return request('/doctors');
    },
    registerDoctor: function registerDoctor(data) {
      return request('/auth/register', { method: 'POST', body: Object.assign({}, data, { role: 'doctor' }), auth: false });
    },
    getDoctorProfile: function getDoctorProfile() {
      return request('/doctor/profile');
    },
    getDoctorAppointments: function getDoctorAppointments() {
      return request('/doctor/appointments');
    },
    getDoctorPatientHistory: function getDoctorPatientHistory(patientId) {
      return request('/doctor/patients/' + encodeURIComponent(patientId) + '/history');
    },
    createDoctorPrescription: function createDoctorPrescription(data) {
      return request('/doctor/prescriptions', { method: 'POST', body: data });
    },
    updateDoctorAppointmentStatus: function updateDoctorAppointmentStatus(id, status, appointmentSlot) {
      return request('/doctor/appointments/' + encodeURIComponent(id) + '/status', {
        method: 'PATCH',
        body: Object.assign({ status }, appointmentSlot || {})
      });
    },
    getDoctorMessages: function getDoctorMessages() {
      return request('/doctor/messages');
    },
    sendDoctorMessage: function sendDoctorMessage(patientId, appointmentId, message, attachments) {
      return request('/doctor/messages', {
        method: 'POST',
        body: { patientId, appointmentId, message, attachments: attachments || [] }
      });
    },
    getArticles: function getArticles() {
      return request('/articles');
    },
    getFirstAid: function getFirstAid() {
      return request('/first-aid');
    },
    createAppointment: function createAppointment(data) {
      return request('/appointments', { method: 'POST', body: data });
    },
    getAppointments: function getAppointments() {
      return request('/appointments');
    },
    getPatientHistory: function getPatientHistory() {
      return request('/patient/history');
    },
    getPatientChatNotifications: function getPatientChatNotifications() {
      return request('/patient/chat-notifications');
    },
    markPatientChatNotificationRead: function markPatientChatNotificationRead(id) {
      return request('/patient/chat-notifications/' + encodeURIComponent(id) + '/read', { method: 'PATCH' });
    },
    markPatientChatNotificationsReadForDoctor: function markPatientChatNotificationsReadForDoctor(doctorName) {
      return request('/patient/chat-notifications/read', { method: 'PATCH', body: { doctorName } });
    },
    cancelAppointment: function cancelAppointment(id) {
      return request('/appointments/' + encodeURIComponent(id) + '/cancel', { method: 'PATCH' });
    },
    createLabBooking: function createLabBooking(data) {
      return request('/lab-bookings', { method: 'POST', body: data });
    },
    placeOrder: function placeOrder(items) {
      return request('/orders', { method: 'POST', body: { items } });
    },
    getOrders: function getOrders() {
      return request('/orders');
    },
    loadChatMessages: function loadChatMessages(appointmentId, doctorName, notification) {
      const params = [];
      if (appointmentId) params.push('appointmentId=' + encodeURIComponent(appointmentId));
      if (doctorName) params.push('doctor=' + encodeURIComponent(doctorName));
      if (notification) params.push('notification=true');
      const query = params.length ? '?' + params.join('&') : '';
      return request('/chat/messages' + query);
    },
    sendChatMessage: function sendChatMessage(data) {
      return request('/chat/messages', { method: 'POST', body: data });
    }
  };

  window.DockTalkAPI = api;
  window.getDockTalkAuthToken = getToken;
  window.clearDockTalkAuth = clearSession;
})();
