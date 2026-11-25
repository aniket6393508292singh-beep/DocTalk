require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const db = require('./database/db');
const { User, Doctor, Appointment, Prescription, LabBooking, Order, Message, Article, FirstAidTopic } = db.models;

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required. Set it in the project environment.');
}

let databaseInitialization;

function initializeDatabase() {
  if (!databaseInitialization) {
    databaseInitialization = db.init().catch((error) => {
      databaseInitialization = null;
      throw error;
    });
  }
  return databaseInitialization;
}

app.use(cors());
app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ extended: true, limit: '6mb' }));

function normalizeDoc(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (obj._id) {
    obj.id = String(obj._id);
    delete obj._id;
  }
  if (obj.userId && typeof obj.userId === 'object' && typeof obj.userId.toHexString === 'function') {
    obj.userId = obj.userId.toHexString();
  } else if (obj.userId && typeof obj.userId === 'object' && obj.userId._id) {
    const populatedUser = obj.userId.toObject ? obj.userId.toObject() : { ...obj.userId };
    if (populatedUser._id) {
      populatedUser.id = String(populatedUser._id);
      delete populatedUser._id;
    }
    delete populatedUser.passwordHash;
    obj.userId = populatedUser;
  }
  if (obj.doctorId && typeof obj.doctorId === 'object' && obj.doctorId._id) {
    obj.doctorId = String(obj.doctorId._id);
  }
  delete obj.__v;
  return obj;
}

function normalizeUser(user) {
  if (!user) return null;
  const safeUser = normalizeDoc(user);
  if (!safeUser) return null;
  delete safeUser.passwordHash;
  return safeUser;
}

function createToken(user) {
  const id = user.id || user._id || user.userId;
  return jwt.sign(
    {
      id: String(id),
      email: user.email,
      role: user.role || 'patient'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function getAppointmentStart(date, time) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) ||
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(time || ''))) {
    return null;
  }

  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const start = new Date(year, month - 1, day, hours, minutes);
  if (start.getFullYear() !== year || start.getMonth() !== month - 1 || start.getDate() !== day) {
    return null;
  }
  return start;
}

function isChatAvailableForAppointment(appointment, now = new Date()) {
  const start = getAppointmentStart(appointment.appointmentDate, appointment.appointmentTime);
  if (!start) return false;

  const status = String(appointment.status || '').toLowerCase();
  if (!['pending', 'approved', 'confirmed'].includes(status)) return false;

  const availableUntil = new Date(start.getTime() + 60 * 60 * 1000);
  const unlockedAt = appointment.preChatUnlockedAt
    ? new Date(appointment.preChatUnlockedAt)
    : null;
  const scheduledSlotActive = ['approved', 'confirmed'].includes(status) &&
    now >= start && now <= availableUntil;
  const preChatWasStarted = unlockedAt &&
    !Number.isNaN(unlockedAt.getTime()) &&
    unlockedAt <= now &&
    now <= availableUntil;
  return scheduledSlotActive || Boolean(preChatWasStarted);
}

function serializeUser(user) {
  return normalizeUser(user);
}

function normalizeChatAttachments(attachments) {
  if (!Array.isArray(attachments)) return [];

  return attachments.slice(0, 3).map((attachment) => {
    const name = String(attachment?.name || 'attachment').trim().slice(0, 255);
    const type = String(attachment?.type || 'application/octet-stream').slice(0, 100);
    const dataUrl = String(attachment?.dataUrl || '');
    const size = Number(attachment?.size || 0);

    if (!dataUrl.startsWith('data:') || size > 2 * 1024 * 1024) {
      throw new Error('Each attachment must be 2 MB or smaller.');
    }

    return { name, type, size, dataUrl };
  });
}

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DockTalk API',
    database: 'mongodb',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', async (req, res, next) => {
  try {
    await initializeDatabase();
    next();
  } catch (error) {
    console.error('Failed to initialize the DockTalk database:', error);
    res.status(503).json({ error: 'Database is unavailable.' });
  }
});

app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find({
      $or: [
        { registrationStatus: 'approved' },
        { registrationStatus: { $exists: false } },
        { registrationStatus: null }
      ]
    }).sort({ specialty: 1, name: 1 });
    res.json(doctors.map(normalizeDoc));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load doctors.' });
  }
});

app.get('/api/doctors/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }
    res.json(normalizeDoc(doctor));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctor details.' });
  }
});

app.get('/api/specialties', async (req, res) => {
  try {
    const specialties = await Doctor.distinct('specialty');
    res.json(specialties.sort());
  } catch (error) {
    res.status(500).json({ error: 'Failed to load specialties.' });
  }
});

app.get('/api/articles', async (req, res) => {
  try {
    const articles = await Article.find().sort({ created_at: -1 });
    res.json(articles.map(normalizeDoc));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load health articles.' });
  }
});

app.get('/api/first-aid', async (req, res) => {
  try {
    const topics = await FirstAidTopic.find().sort({ created_at: 1 });
    res.json(topics.map(normalizeDoc));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load first aid topics.' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    role = 'patient',
    specialty,
    degree,
    experience,
    fee,
    availability,
    location,
    bio,
    licenseNumber,
    consultationModes = ['video']
  } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  if (!['patient', 'doctor'].includes(role)) {
    return res.status(400).json({ error: 'Invalid account role.' });
  }
  if (role === 'doctor' && (!specialty || !degree || !licenseNumber)) {
    return res.status(400).json({
      error: 'Doctor registration requires specialty, degree, and license number.'
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  try {
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      passwordHash,
      phone: phone || null,
      role
    });

    if (role === 'doctor') {
      await Doctor.create({
        userId: user._id,
        name: String(name).trim(),
        specialty: String(specialty).trim(),
        degree: String(degree).trim(),
        experience_years: Math.max(0, Number(experience || 0)),
        availability: String(availability || 'Available by appointment').trim(),
        location: location ? String(location).trim() : '',
        phone: phone ? String(phone).trim() : '',
        licenseNumber: String(licenseNumber).trim(),
        fee: Math.max(0, Number(fee || 0)),
        rating: 0,
        bio: bio ? String(bio).trim() : '',
        image_url: '',
        consultationModes: Array.isArray(consultationModes) ? consultationModes : ['video'],
        registrationStatus: 'approved'
      });
    }

    const token = createToken(user.toObject ? user.toObject() : user);
    res.status(201).json({
      message: 'Registration successful.',
      token,
      user: serializeUser(user)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(String(password), user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = createToken(user.toObject ? user.toObject() : user);
    res.json({
      message: 'Login successful.',
      token,
      user: serializeUser(user)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log in.' });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: serializeUser(user) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load account details.' });
  }
});

app.get('/api/doctor/profile', authMiddleware, async (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Doctor access required.' });
  }

  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found.' });
    }
    res.json({ doctor: normalizeDoc(doctor) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load doctor profile.' });
  }
});

app.get('/api/doctor/appointments', authMiddleware, async (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Doctor access required.' });
  }

  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found.' });
    }

    const appointments = await Appointment.find({
      $or: [{ doctorId: doctor._id }, { doctorName: doctor.name }]
    })
      .populate('userId', 'name email phone')
      .sort({ created_at: -1 });

    res.json(appointments.map(normalizeDoc));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load patient appointments.' });
  }
});

app.get('/api/doctor/patients/:patientId/history', authMiddleware, async (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Doctor access required.' });
  }

  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found.' });
    }

    const patient = await User.findOne({ _id: req.params.patientId, role: 'patient' });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    const appointments = await Appointment.find({
      userId: patient._id,
      $or: [{ doctorId: doctor._id }, { doctorName: doctor.name }]
    }).sort({ appointmentDate: -1, appointmentTime: -1 });
    if (!appointments.length) {
      return res.status(403).json({ error: 'You do not have appointment history with this patient.' });
    }

    const prescriptions = await Prescription.find({
      patientId: patient._id,
      doctorId: doctor._id
    }).sort({ created_at: -1 });

    res.json({
      patient: normalizeUser(patient),
      appointments: appointments.map(normalizeDoc),
      prescriptions: prescriptions.map(normalizeDoc)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load patient history.' });
  }
});

app.post('/api/doctor/prescriptions', authMiddleware, async (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Doctor access required.' });
  }

  const { appointmentId, medicines, notes = '' } = req.body || {};
  if (!appointmentId || !Array.isArray(medicines) || !medicines.length || medicines.length > 20) {
    return res.status(400).json({ error: 'Choose a completed appointment and add at least one medicine.' });
  }

  const normalizedMedicines = medicines.map((medicine) => ({
    name: String(medicine?.name || '').trim().slice(0, 200),
    dosage: String(medicine?.dosage || '').trim().slice(0, 120),
    frequency: String(medicine?.frequency || '').trim().slice(0, 120),
    duration: String(medicine?.duration || '').trim().slice(0, 120),
    instructions: String(medicine?.instructions || '').trim().slice(0, 500)
  }));
  if (normalizedMedicines.some((medicine) =>
    !medicine.name || !medicine.dosage || !medicine.frequency || !medicine.duration
  )) {
    return res.status(400).json({ error: 'Each medicine needs a name, dosage, frequency, and duration.' });
  }

  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found.' });
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      status: 'completed',
      $or: [{ doctorId: doctor._id }, { doctorName: doctor.name }]
    });
    if (!appointment) {
      return res.status(404).json({ error: 'Completed appointment not found for this doctor.' });
    }

    const prescription = await Prescription.create({
      appointmentId: appointment._id,
      patientId: appointment.userId,
      doctorId: doctor._id,
      doctorName: doctor.name,
      medicines: normalizedMedicines,
      notes: String(notes).trim().slice(0, 2000)
    });
    res.status(201).json({ message: 'Prescription saved.', prescription: normalizeDoc(prescription) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save prescription.' });
  }
});

app.patch('/api/doctor/appointments/:id/status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Doctor access required.' });
  }

  const status = String(req.body?.status || '').toLowerCase();
  if (!['pending', 'approved', 'rejected', 'completed', 'cancelled', 'confirmed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid appointment status.' });
  }

  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found.' });
    }

    const appointmentFilter = {
      _id: req.params.id,
      $or: [{ doctorId: doctor._id }, { doctorName: doctor.name }]
    };
    const changes = { status };
    if (status === 'completed') {
      const appointmentToComplete = await Appointment.findOne(appointmentFilter);
      if (!appointmentToComplete) {
        return res.status(404).json({ error: 'Appointment not found.' });
      }
      if (!['approved', 'confirmed', 'completed'].includes(String(appointmentToComplete.status).toLowerCase())) {
        return res.status(409).json({ error: 'Only an approved appointment can be marked complete.' });
      }
    }

    if (status === 'approved') {
      const { date, time } = req.body || {};
      const requestedStart = getAppointmentStart(date, time);
      if (!requestedStart) {
        return res.status(400).json({ error: 'Choose a valid appointment date and time.' });
      }
      if (requestedStart <= new Date()) {
        return res.status(400).json({ error: 'The appointment slot must be in the future.' });
      }

      const appointmentToApprove = await Appointment.findOne(appointmentFilter);
      if (!appointmentToApprove) {
        return res.status(404).json({ error: 'Appointment not found.' });
      }

      const nearbyDates = [-1, 0, 1].map((offset) => {
        const nearbyDate = new Date(requestedStart);
        nearbyDate.setDate(nearbyDate.getDate() + offset);
        return [
          nearbyDate.getFullYear(),
          String(nearbyDate.getMonth() + 1).padStart(2, '0'),
          String(nearbyDate.getDate()).padStart(2, '0')
        ].join('-');
      });
      const scheduledAppointments = await Appointment.find({
        _id: { $ne: appointmentToApprove._id },
        appointmentDate: { $in: nearbyDates },
        status: { $in: ['approved', 'confirmed'] },
        $or: [{ doctorId: doctor._id }, { doctorName: doctor.name }]
      });
      const oneHour = 60 * 60 * 1000;
      const hasConflict = scheduledAppointments.some((scheduled) => {
        const scheduledStart = getAppointmentStart(scheduled.appointmentDate, scheduled.appointmentTime);
        return scheduledStart &&
          requestedStart.getTime() < scheduledStart.getTime() + oneHour &&
          scheduledStart.getTime() < requestedStart.getTime() + oneHour;
      });
      if (hasConflict) {
        return res.status(409).json({
          error: 'That time overlaps another approved appointment. Choose a different slot.'
        });
      }

      changes.appointmentDate = date;
      changes.appointmentTime = time;
    }

    const appointment = await Appointment.findOneAndUpdate(
      appointmentFilter,
      changes,
      { new: true }
    ).populate('userId', 'name email phone');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    res.json({ message: 'Appointment status updated.', appointment: normalizeDoc(appointment) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update appointment.' });
  }
});

app.get('/api/doctor/messages', authMiddleware, async (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Doctor access required.' });
  }

  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found.' });
    }

    const messages = await Message.find({ doctorName: doctor.name })
      .populate('userId', 'name email phone')
      .sort({ created_at: 1 });
    res.json(messages.map(normalizeDoc));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load patient messages.' });
  }
});

app.post('/api/doctor/messages', authMiddleware, async (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Doctor access required.' });
  }

  const { patientId, appointmentId, message, attachments = [] } = req.body || {};
  const hasAttachment = Array.isArray(attachments) && attachments.length > 0;
  if (!patientId || !appointmentId || (!String(message || '').trim() && !hasAttachment)) {
    return res.status(400).json({ error: 'Patient, appointment, and a message or attachment are required.' });
  }

  let normalizedAttachments;
  try {
    normalizedAttachments = normalizeChatAttachments(attachments);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found.' });
    }

    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found.' });
    }

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      userId: patient._id,
      $or: [{ doctorId: doctor._id }, { doctorName: doctor.name }]
    });
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found for this patient.' });
    }

    const savedMessage = await Message.create({
      userId: patient._id,
      appointmentId: appointment._id,
      doctorName: doctor.name,
      sender: 'doctor',
      message: String(message || '').trim(),
      notifyPatient: true,
      attachments: normalizedAttachments
    });

    const now = new Date();
    const appointmentStart = getAppointmentStart(appointment.appointmentDate, appointment.appointmentTime);
    const preChatUnlocked = appointmentStart &&
      appointmentStart > now &&
      ['pending', 'approved', 'confirmed'].includes(String(appointment.status).toLowerCase());
    if (preChatUnlocked && !appointment.preChatUnlockedAt) {
      await Appointment.updateOne(
        { _id: appointment._id, preChatUnlockedAt: null },
        { $set: { preChatUnlockedAt: now } }
      );
    }

    res.status(201).json({
      message: 'Reply sent.',
      data: normalizeDoc(savedMessage),
      preChatUnlocked
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send reply.' });
  }
});

app.get('/api/appointments', authMiddleware, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user.id }).sort({ created_at: -1 });
    res.json(appointments.map(normalizeDoc));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load appointments.' });
  }
});

app.get('/api/patient/history', authMiddleware, async (req, res) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({ error: 'Patient access required.' });
  }

  try {
    const [appointments, prescriptions] = await Promise.all([
      Appointment.find({ userId: req.user.id }).sort({ appointmentDate: -1, appointmentTime: -1 }),
      Prescription.find({ patientId: req.user.id }).sort({ created_at: -1 })
    ]);
    res.json({
      appointments: appointments.map(normalizeDoc),
      prescriptions: prescriptions.map(normalizeDoc)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load medical history.' });
  }
});

app.get('/api/patient/chat-notifications', authMiddleware, async (req, res) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({ error: 'Patient access required.' });
  }

  try {
    const notifications = await Message.find({
      userId: req.user.id,
      sender: 'doctor',
      notifyPatient: true,
      patientReadAt: null
    })
      .select('doctorName appointmentId message created_at')
      .sort({ created_at: -1 })
      .limit(50);
    res.json(notifications.map(normalizeDoc));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load chat notifications.' });
  }
});

app.patch('/api/patient/chat-notifications/read', authMiddleware, async (req, res) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({ error: 'Patient access required.' });
  }

  const doctorName = String(req.body?.doctorName || '').trim();
  if (!doctorName) {
    return res.status(400).json({ error: 'Doctor name is required.' });
  }

  try {
    const result = await Message.updateMany({
      userId: req.user.id,
      doctorName,
      sender: 'doctor',
      notifyPatient: true,
      patientReadAt: null
    }, { $set: { patientReadAt: new Date() } });
    res.json({ message: 'Chat notifications marked as read.', updated: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update chat notifications.' });
  }
});

app.patch('/api/patient/chat-notifications/:id/read', authMiddleware, async (req, res) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({ error: 'Patient access required.' });
  }

  try {
    const notification = await Message.findOneAndUpdate({
      _id: req.params.id,
      userId: req.user.id,
      sender: 'doctor',
      notifyPatient: true
    }, { $set: { patientReadAt: new Date() } }, { new: true });
    if (!notification) {
      return res.status(404).json({ error: 'Chat notification not found.' });
    }
    res.json({ message: 'Chat notification marked as read.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update chat notification.' });
  }
});

app.post('/api/appointments', authMiddleware, async (req, res) => {
  const { doctorId, doctorName, contactPhone, date, time, mode, notes } = req.body || {};
  const normalizedContactPhone = String(contactPhone || '').trim();

  if ((!doctorId && !doctorName) || !normalizedContactPhone || !date || !time) {
    return res.status(400).json({ error: 'Doctor, contact phone, date, and time are required.' });
  }

  try {
    let doctor = null;
    if (doctorId) {
      doctor = await Doctor.findById(doctorId);
    }
    if (!doctor && doctorName) {
      const requestedName = String(doctorName).trim();
      const nameWithoutPrefix = requestedName.replace(/^Dr\.?\s*/i, '').trim();
      doctor = await Doctor.findOne({
        $or: [
          { name: requestedName },
          { name: nameWithoutPrefix },
          { name: 'Dr. ' + nameWithoutPrefix }
        ]
      });
    }

    const appointment = await Appointment.create({
      userId: req.user.id,
      doctorId: doctor ? doctor._id : null,
      doctorName: doctor ? doctor.name : doctorName || 'Selected doctor',
      contactPhone: normalizedContactPhone,
      appointmentDate: date,
      appointmentTime: time,
      mode: mode || 'video',
      notes: notes || ''
    });

    res.status(201).json({ message: 'Appointment booked successfully.', appointment: normalizeDoc(appointment) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create appointment.' });
  }
});

app.patch('/api/appointments/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status: 'cancelled' },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    res.json({
      message: 'Appointment cancelled successfully.',
      appointment: normalizeDoc(appointment)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel appointment.' });
  }
});

app.get('/api/lab-bookings', authMiddleware, async (req, res) => {
  try {
    const bookings = await LabBooking.find({ userId: req.user.id }).sort({ created_at: -1 });
    res.json(bookings.map(normalizeDoc));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load lab bookings.' });
  }
});

app.post('/api/lab-bookings', authMiddleware, async (req, res) => {
  const { testName, preferredDate, preferredTime, notes } = req.body || {};

  if (!testName) {
    return res.status(400).json({ error: 'Test name is required.' });
  }

  try {
    const booking = await LabBooking.create({
      userId: req.user.id,
      testName,
      preferredDate: preferredDate || null,
      preferredTime: preferredTime || null,
      notes: notes || ''
    });

    res.status(201).json({ message: 'Lab booking created.', booking: normalizeDoc(booking) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lab booking.' });
  }
});

app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ created_at: -1 });
    res.json(orders.map((order) => ({ ...normalizeDoc(order), items: (order.items || []).map((item) => normalizeDoc(item)) })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load order history.' });
  }
});

app.post('/api/orders', authMiddleware, async (req, res) => {
  const { items = [] } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Please add at least one item to the order.' });
  }

  try {
    const normalizedItems = items.map((item) => ({
      name: item.name,
      price: Number(item.price || 0),
      type: item.type || ''
    }));

    const total = normalizedItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const order = await Order.create({
      userId: req.user.id,
      total,
      items: normalizedItems
    });

    res.status(201).json({
      message: 'Order placed successfully.',
      order: { ...normalizeDoc(order), items: order.items.map((item) => normalizeDoc(item)) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to place order.' });
  }
});

app.get('/api/chat/messages', authMiddleware, async (req, res) => {
  const appointmentId = String(req.query.appointmentId || '').trim();
  const doctorName = String(req.query.doctor || '').trim();
  if (req.user.role !== 'patient' || !appointmentId) {
    return res.status(400).json({ error: 'A patient and appointment are required to open this chat.' });
  }

  try {
    const appointment = await Appointment.findOne({ _id: appointmentId, userId: req.user.id });
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    const messages = await Message.find({ userId: req.user.id, appointmentId }).sort({ created_at: 1 });
    res.json(messages.map(normalizeDoc));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load chat messages.' });
  }
});

app.post('/api/chat/messages', authMiddleware, async (req, res) => {
  const { appointmentId, sender, message, attachments = [] } = req.body || {};
  if (req.user.role !== 'patient' || sender !== 'user') {
    return res.status(403).json({ error: 'Patient access is required to send a chat message.' });
  }
  if (!appointmentId) {
    return res.status(400).json({ error: 'An appointment is required to send a chat message.' });
  }
  if (!String(message || '').trim() && (!Array.isArray(attachments) || attachments.length === 0)) {
    return res.status(400).json({ error: 'Message content or an attachment is required.' });
  }

  let normalizedAttachments;
  try {
    normalizedAttachments = normalizeChatAttachments(attachments);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  try {
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      userId: req.user.id,
      status: { $in: ['pending', 'approved', 'confirmed'] }
    });
    if (!appointment || !isChatAvailableForAppointment(appointment)) {
      return res.status(403).json({ error: 'Chat is locked until your doctor starts a pre-chat or your appointment begins.' });
    }

    const savedMessage = await Message.create({
      userId: req.user.id,
      appointmentId: appointment._id,
      doctorName: appointment.doctorName,
      sender: 'user',
      message: String(message || '').trim(),
      attachments: normalizedAttachments
    });

    res.status(201).json({ message: 'Chat message saved.', data: normalizeDoc(savedMessage) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save chat message.' });
  }
});

app.use((req, res, next) => {
  if (
    req.path.endsWith('.html') ||
    req.path.endsWith('.js') ||
    req.path.endsWith('.css') ||
    req.path === '/'
  ) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found.' });
  }

  res.status(404).send('Page not found.');
});

async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`DockTalk API running on http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start the DockTalk server:', error);
    process.exitCode = 1;
  });
}

module.exports = app;
