require('dotenv').config();

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is required. Add it to the project .env file.');
}

const doctorSeed = [
  {
    name: 'Dr. Priya Nair',
    specialty: 'Cardiology',
    degree: 'MD Cardiology',
    experience_years: 11,
    availability: 'Mon-Fri, 9:00 AM - 5:00 PM',
    fee: 599,
    rating: 4.9,
    bio: 'Cardiac specialist focused on preventive heart care and chronic condition management.',
    image_url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Dr. Rohan Mehta',
    specialty: 'Pediatrics',
    degree: 'MBBS, DCH',
    experience_years: 9,
    availability: 'Mon-Sat, 10:00 AM - 6:00 PM',
    fee: 499,
    rating: 4.8,
    bio: 'Child health specialist helping parents with growth, immunity, and pediatric care.',
    image_url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Dr. Aisha Khan',
    specialty: 'Therapy',
    degree: 'MSc Clinical Psychology',
    experience_years: 8,
    availability: 'Tue-Sun, 8:00 AM - 4:00 PM',
    fee: 450,
    rating: 4.7,
    bio: 'Mental wellness specialist helping with stress, anxiety, and behavior management.',
    image_url: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=800&q=80'
  },
  {
    name: 'Dr. Arjun Bansal',
    specialty: 'Orthopedics',
    degree: 'MS Orthopedics',
    experience_years: 13,
    availability: 'Mon-Sat, 9:00 AM - 7:00 PM',
    fee: 650,
    rating: 4.9,
    bio: 'Orthopedic specialist managing joint pain, sports injuries, and mobility issues.',
    image_url: 'https://images.unsplash.com/photo-1538108149393-fbbd81895973?auto=format&fit=crop&w=800&q=80'
  }
];

const additionalDoctorSeed = [
  ['Dr. Asha Sen', 'Cardiology'],
  ['Dr. Vikram Kapoor', 'Cardiology'],
  ['Dr. Nisha Lohia', 'Cardiology'],
  ['Dr. Seema Prakash', 'Cardiology'],
  ['Dr. Karan Desai', 'Cardiology'],
  ['Dr. Shreya Mehra', 'Cardiology'],
  ['Dr. Rishi Nair', 'Cardiology'],
  ['Dr. Anjali Shah', 'Cardiology'],
  ['Dr. Aarti Kapoor', 'Pediatrics'],
  ['Dr. Raghav Sharma', 'Pediatrics'],
  ['Dr. Priya Menon', 'Pediatrics'],
  ['Dr. Suresh Nair', 'Pediatrics'],
  ['Dr. Geeta Kulkarni', 'Pediatrics'],
  ['Dr. Leena Sood', 'Pediatrics'],
  ['Dr. Bhavya Tandon', 'Pediatrics'],
  ['Dr. Ritu Sinha', 'Therapy'],
  ['Dr. Aman Khanna', 'Therapy'],
  ['Dr. Meera Sharma', 'Therapy'],
  ['Dr. Pankaj Kumar', 'Therapy'],
  ['Dr. Neha Luthra', 'Therapy'],
  ['Dr. Vipul Rao', 'Therapy'],
  ['Dr. Rohan Joshi', 'Therapy'],
  ['Dr. Sangeeta Singh', 'Therapy'],
  ['Dr. Ritu Kapoor', 'Therapy'],
  ['Dr. Arjun Reddy', 'Orthopedics'],
  ['Dr. Kavita Rao', 'Orthopedics'],
  ['Dr. Sanjay Gupta', 'Orthopedics'],
  ['Dr. Leela Menon', 'Orthopedics'],
  ['Dr. Mohit Verma', 'Orthopedics'],
  ['Dr. Priyanka Singh', 'Orthopedics'],
  ['Dr. Karan Iyer', 'Orthopedics'],
  ['Dr. Nivedita Sharma', 'Orthopedics']
].map(([name, specialty]) => ({
  name,
  specialty,
  degree: 'Specialist Physician',
  experience_years: 7,
  availability: 'Mon-Sat, 9:00 AM - 6:00 PM',
  fee: 499,
  rating: 4.7,
  bio: `${specialty} specialist available for DockTalk consultations.`,
  image_url: ''
}));

const articleSeed = [
  {
    title: 'Seasonal flu: what to expect this year',
    excerpt: 'Precautions, symptoms, and when to seek urgent care during seasonal illness.',
    image_url: 'https://picsum.photos/seed/flu/800/400',
    url: '#',
    tags: 'Infectious,Prevention'
  },
  {
    title: 'Healthy routines for long workdays',
    excerpt: 'Small habits can reduce strain, protect posture, and support mental clarity.',
    image_url: 'https://picsum.photos/seed/workday/800/400',
    url: '#',
    tags: 'Wellness,Habits'
  },
  {
    title: 'Why hydration matters for heart health',
    excerpt: 'Water intake supports circulation, energy, and a healthy daily routine.',
    image_url: 'https://picsum.photos/seed/hydration/800/400',
    url: '#',
    tags: 'Cardio,Health'
  }
];

const firstAidSeed = [
  {
    slug: 'cuts',
    title: 'Cuts & Wounds',
    summary: 'Clean the wound and cover it to prevent infection.',
    steps: 'Wash hands. Apply pressure with clean cloth. Rinse with clean water. Cover with sterile dressing.',
    note: 'Seek urgent care if the bleeding is heavy or the wound is deep.',
    image_url: 'https://picsum.photos/seed/cut/800/400'
  },
  {
    slug: 'burn',
    title: 'Minor Burns',
    summary: 'Cool the area and avoid breaking blisters.',
    steps: 'Run cool water over the burn for 10-20 minutes. Avoid ice. Cover lightly with a clean non-stick dressing.',
    note: 'Go to a doctor if the burn is larger than a palm or on the face, hands, or genitals.',
    image_url: 'https://picsum.photos/seed/burn/800/400'
  },
  {
    slug: 'bleeding',
    title: 'Severe Bleeding',
    summary: 'Apply direct pressure and call emergency help immediately.',
    steps: 'Use a clean cloth to apply firm pressure. Elevate the limb if safe. Keep pressure on until help arrives.',
    note: 'Call emergency services if bleeding is uncontrolled or the person is faint.',
    image_url: 'https://picsum.photos/seed/bleed/800/400'
  },
  {
    slug: 'choking',
    title: 'Choking',
    summary: 'Encourage coughing and use abdominal thrusts if the person cannot breathe.',
    steps: 'Ask the person to cough. If they cannot breathe, perform abdominal thrusts. Call emergency services.',
    note: 'If the person becomes unresponsive, begin CPR and call emergency help.',
    image_url: 'https://picsum.photos/seed/choking/800/400'
  }
];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, default: null },
  role: { type: String, enum: ['patient', 'doctor'], default: 'patient' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, sparse: true, default: null },
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  degree: String,
  experience_years: Number,
  availability: String,
  location: String,
  phone: String,
  licenseNumber: String,
  fee: Number,
  rating: Number,
  bio: String,
  image_url: String,
  consultationModes: { type: [String], default: ['video'] },
  registrationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', default: null },
  doctorName: { type: String, required: true },
  contactPhone: { type: String, required: true, trim: true },
  appointmentDate: { type: String, required: true },
  appointmentTime: { type: String, required: true },
  mode: { type: String, default: 'video' },
  notes: { type: String, default: '' },
  preChatUnlockedAt: { type: Date, default: null },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'completed', 'cancelled', 'confirmed'],
    default: 'pending'
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const prescriptionMedicineSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  dosage: { type: String, required: true, trim: true },
  frequency: { type: String, required: true, trim: true },
  duration: { type: String, required: true, trim: true },
  instructions: { type: String, default: '', trim: true }
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  doctorName: { type: String, required: true },
  medicines: { type: [prescriptionMedicineSchema], required: true, validate: (items) => items.length > 0 },
  notes: { type: String, default: '', trim: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const labBookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testName: { type: String, required: true },
  preferredDate: String,
  preferredTime: String,
  notes: String,
  status: { type: String, default: 'pending' }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  type: { type: String, default: '' }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  total: { type: Number, default: 0 },
  items: [orderItemSchema]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const messageSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  doctorName: { type: String, default: 'General' },
  sender: { type: String, enum: ['user', 'doctor'], required: true },
  message: { type: String, default: '' },
  notifyPatient: { type: Boolean, default: false },
  patientReadAt: { type: Date, default: null },
  attachments: [{
    name: { type: String, required: true },
    type: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    dataUrl: { type: String, required: true }
  }]
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  excerpt: String,
  image_url: String,
  url: String,
  tags: String
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const firstAidTopicSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  summary: String,
  steps: String,
  note: String,
  image_url: String
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const User = mongoose.model('User', userSchema);
const Doctor = mongoose.model('Doctor', doctorSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);
const Prescription = mongoose.model('Prescription', prescriptionSchema);
const LabBooking = mongoose.model('LabBooking', labBookingSchema);
const Order = mongoose.model('Order', orderSchema);
const Message = mongoose.model('Message', messageSchema);
const Article = mongoose.model('Article', articleSchema);
const FirstAidTopic = mongoose.model('FirstAidTopic', firstAidTopicSchema);

async function initializeDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    autoIndex: true
  });

  const allDoctors = [...doctorSeed, ...additionalDoctorSeed];
  await Doctor.bulkWrite(
    allDoctors.map((doctor) => ({
      updateOne: {
        filter: { name: doctor.name },
        update: { $setOnInsert: doctor },
        upsert: true
      }
    }))
  );

  if ((await Article.countDocuments()) === 0) {
    await Article.insertMany(articleSeed);
  }

  if ((await FirstAidTopic.countDocuments()) === 0) {
    await FirstAidTopic.insertMany(firstAidSeed);
  }

  return mongoose.connection;
}

module.exports = {
  mongoose,
  init: initializeDatabase,
  initializeDatabase,
  models: {
    User,
    Doctor,
    Appointment,
    Prescription,
    LabBooking,
    Order,
    Message,
    Article,
    FirstAidTopic
  }
};
