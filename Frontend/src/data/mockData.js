// Mock Data Store for MediSync AI

// 1. Patients Data
export let mockPatients = [
  {
    id: 'P-101',
    name: 'Aarav Sharma',
    age: 45,
    gender: 'Male',
    email: 'aarav.sharma@example.com',
    phone: '+91 98765 43210',
    bloodGroup: 'O+',
    room: 'Ward A - Bed 3',
    status: 'Admitted',
    admissionDate: '2026-08-20',
    medicalHistory: ['Hypertension', 'Type 2 Diabetes'],
    prescriptions: [
      { medicine: 'Metformin 500mg', dosage: '1-0-1', duration: '30 days', pharmacistGiven: true },
      { medicine: 'Amlodipine 5mg', dosage: '0-0-1', duration: '30 days', pharmacistGiven: true }
    ],
    vitals: { temp: '98.6 °F', bp: '130/85 mmHg', heartRate: '72 bpm', spo2: '98%' },
    nursingNotes: 'Patient is stable. Blood sugar checked, within normal limits.'
  },
  {
    id: 'P-102',
    name: 'Ananya Iyer',
    age: 29,
    gender: 'Female',
    email: 'ananya.iyer@example.com',
    phone: '+91 91234 56789',
    bloodGroup: 'B+',
    room: 'ICU - Bed 1',
    status: 'Critical',
    admissionDate: '2026-08-25',
    medicalHistory: ['Acute Appendicitis', 'Asthma'],
    prescriptions: [
      { medicine: 'Albuterol Inhaler', dosage: 'As needed', duration: '15 days', pharmacistGiven: false },
      { medicine: 'Amoxicillin 500mg', dosage: '1-1-1', duration: '7 days', pharmacistGiven: true }
    ],
    vitals: { temp: '100.2 °F', bp: '115/75 mmHg', heartRate: '95 bpm', spo2: '94%' },
    nursingNotes: 'Post-op observation. Monitor SpO2 levels closely.'
  },
  {
    id: 'P-103',
    name: 'Vikram Malhotra',
    age: 62,
    gender: 'Male',
    email: 'vikram.m@example.com',
    phone: '+91 87654 32109',
    bloodGroup: 'A-',
    room: 'Private 104',
    status: 'Admitted',
    admissionDate: '2026-08-22',
    medicalHistory: ['Coronary Artery Disease', 'Hyperlipidemia'],
    prescriptions: [
      { medicine: 'Atorvastatin 20mg', dosage: '0-0-1', duration: '90 days', pharmacistGiven: true },
      { medicine: 'Aspirin 75mg', dosage: '1-0-0', duration: '90 days', pharmacistGiven: true }
    ],
    vitals: { temp: '98.4 °F', bp: '120/80 mmHg', heartRate: '68 bpm', spo2: '97%' },
    nursingNotes: 'Doing well. Recovery on track. Discharging tomorrow.'
  },
  {
    id: 'P-104',
    name: 'Diya Patel',
    age: 8,
    gender: 'Female',
    email: 'parent.diya@example.com',
    phone: '+91 76543 21098',
    bloodGroup: 'AB+',
    room: 'Emergency - Bed 2',
    status: 'Observation',
    admissionDate: '2026-08-27',
    medicalHistory: ['None'],
    prescriptions: [
      { medicine: 'Paracetamol Syrup 5ml', dosage: 'If fever > 100°F', duration: '3 days', pharmacistGiven: false }
    ],
    vitals: { temp: '101.5 °F', bp: '100/60 mmHg', heartRate: '110 bpm', spo2: '99%' },
    nursingNotes: 'Admitted due to high fever. Administered paracetamol.'
  },
  {
    id: 'P-105',
    name: 'Gousik Lakshmanan',
    age: 22,
    gender: 'Male',
    email: 'patient@medisync.com', // Assigned test patient login
    phone: '+91 99999 88888',
    bloodGroup: 'O-',
    room: 'Outpatient',
    status: 'Outpatient',
    admissionDate: 'N/A',
    medicalHistory: ['Allergic Rhinitis'],
    prescriptions: [
      { medicine: 'Cetirizine 10mg', dosage: '0-0-1', duration: '10 days', pharmacistGiven: true },
      { medicine: 'Montelukast 10mg', dosage: '0-0-1', duration: '10 days', pharmacistGiven: true }
    ],
    vitals: { temp: '98.6 °F', bp: '120/80 mmHg', heartRate: '72 bpm', spo2: '99%' },
    nursingNotes: 'Routine outpatient consultation.'
  }
];

// 2. Doctors Data (4 standard demo doctors with distinct departments)
export let mockDoctors = [
  {
    id: 'DOC001',
    name: 'Dr. Arun Kumar',
    department: 'Cardiology',
    specialty: 'Cardiologist',
    email: 'arun.kumar@medisync.com',
    status: 'On Duty',
    room: 'Consultation Room 1 (Floor 1)',
    appointmentsCount: 1,
    availableSlots: ['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '04:00 PM']
  },
  {
    id: 'DOC002',
    name: 'Dr. Priya Sharma',
    department: 'General Medicine',
    specialty: 'General Physician',
    email: 'priya.sharma@medisync.com',
    status: 'On Duty',
    room: 'Consultation Room 2 (Floor 1)',
    appointmentsCount: 1,
    availableSlots: ['09:30 AM', '10:30 AM', '11:30 AM', '02:30 PM', '04:30 PM']
  },
  {
    id: 'DOC003',
    name: 'Dr. Rahul Menon',
    department: 'Orthopedics',
    specialty: 'Orthopedic Specialist',
    email: 'rahul.menon@medisync.com',
    status: 'On Duty',
    room: 'Consultation Room 3 (Floor 2)',
    appointmentsCount: 1,
    availableSlots: ['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '05:00 PM']
  },
  {
    id: 'DOC004',
    name: 'Dr. Sneha Iyer',
    department: 'Dermatology',
    specialty: 'Dermatologist',
    email: 'sneha.iyer@medisync.com',
    status: 'On Duty',
    room: 'Consultation Room 4 (Floor 2)',
    appointmentsCount: 0,
    availableSlots: ['10:00 AM', '11:00 AM', '02:00 PM', '03:30 PM', '05:00 PM']
  }
];

// 3. Nurses Data (4 standard demo nurses with distinct departments and supported services)
export let mockNurses = [
  {
    id: 'NUR001',
    name: 'Nurse Anitha',
    department: 'General Nursing',
    services: ['General Checkup', 'Vital Signs'],
    email: 'anitha@medisync.com',
    shift: 'Morning',
    status: 'On Duty',
    room: 'Nursing Station A (Ward)',
    availableSlots: ['08:30 AM', '10:00 AM', '11:30 AM', '02:00 PM', '03:30 PM']
  },
  {
    id: 'NUR002',
    name: 'Nurse Meena',
    department: 'Diagnostic Services',
    services: ['Blood Pressure Check', 'Sugar Test'],
    email: 'meena@medisync.com',
    shift: 'Morning',
    status: 'On Duty',
    room: 'Diagnostics Cabin 2',
    availableSlots: ['09:00 AM', '10:30 AM', '11:00 AM', '01:30 PM', '04:00 PM']
  },
  {
    id: 'NUR003',
    name: 'Nurse Kavya',
    department: 'Health Screening',
    services: ['Basic Health Screening', 'Temperature Check', 'Oxygen Level Check'],
    email: 'kavya@medisync.com',
    shift: 'Evening',
    status: 'On Duty',
    room: 'Screening Lab 1',
    availableSlots: ['09:00 AM', '10:00 AM', '12:00 PM', '02:30 PM', '04:00 PM']
  },
  {
    id: 'NUR004',
    name: 'Nurse Divya',
    department: 'Laboratory Support',
    services: ['Blood Sample Collection', 'Basic Test Preparation'],
    email: 'divya@medisync.com',
    shift: 'Morning',
    status: 'On Duty',
    room: 'Sample Collection Unit',
    availableSlots: ['08:00 AM', '09:30 AM', '11:00 AM', '01:00 PM', '03:00 PM']
  }
];

// Master Department to Doctor Lookup
export const DEPARTMENT_DOCTORS = [
  { department: 'Cardiology', doctorId: 'DOC001', doctorName: 'Dr. Arun Kumar', specialization: 'Cardiologist' },
  { department: 'General Medicine', doctorId: 'DOC002', doctorName: 'Dr. Priya Sharma', specialization: 'General Physician' },
  { department: 'Orthopedics', doctorId: 'DOC003', doctorName: 'Dr. Rahul Menon', specialization: 'Orthopedic Specialist' },
  { department: 'Dermatology', doctorId: 'DOC004', doctorName: 'Dr. Sneha Iyer', specialization: 'Dermatologist' }
];

// Master Service to Nurse Lookup
export const NURSE_SERVICES = [
  { service: 'General Checkup', department: 'General Nursing', nurseId: 'NUR001', nurseName: 'Nurse Anitha' },
  { service: 'Vital Signs', department: 'General Nursing', nurseId: 'NUR001', nurseName: 'Nurse Anitha' },
  { service: 'Blood Pressure Check', department: 'Diagnostic Services', nurseId: 'NUR002', nurseName: 'Nurse Meena' },
  { service: 'Sugar Test', department: 'Diagnostic Services', nurseId: 'NUR002', nurseName: 'Nurse Meena' },
  { service: 'Basic Health Screening', department: 'Health Screening', nurseId: 'NUR003', nurseName: 'Nurse Kavya' },
  { service: 'Temperature Check', department: 'Health Screening', nurseId: 'NUR003', nurseName: 'Nurse Kavya' },
  { service: 'Oxygen Level Check', department: 'Health Screening', nurseId: 'NUR003', nurseName: 'Nurse Kavya' },
  { service: 'Blood Sample Collection', department: 'Laboratory Support', nurseId: 'NUR004', nurseName: 'Nurse Divya' },
  { service: 'Basic Test Preparation', department: 'Laboratory Support', nurseId: 'NUR004', nurseName: 'Nurse Divya' }
];

// 4. Appointments Data (Shared Data Model for Doctor and Nurse appointments)
export let mockAppointments = [
  {
    id: 'APT-D-1001',
    type: 'doctor',
    patientId: 'P-105',
    patientName: 'Gousik Lakshmanan',
    providerId: 'DOC001',
    providerName: 'Dr. Arun Kumar',
    department: 'Cardiology',
    service: 'Consultation',
    reason: 'Regular consultation & ECG review',
    date: '2026-09-15',
    time: '10:00 AM',
    status: 'Scheduled',
    notes: 'Patient requested morning slot',
    createdAt: '2026-09-15T09:00:00'
  },
  {
    id: 'APT-N-1001',
    type: 'nurse',
    patientId: 'P-105',
    patientName: 'Gousik Lakshmanan',
    providerId: 'NUR002',
    providerName: 'Nurse Meena',
    department: 'Diagnostic Services',
    service: 'Blood Pressure Check',
    reason: 'Routine BP checkup',
    date: '2026-09-15',
    time: '11:00 AM',
    status: 'Scheduled',
    notes: '',
    createdAt: '2026-09-15T09:10:00'
  },
  {
    id: 'APT-D-1002',
    type: 'doctor',
    patientId: 'P-101',
    patientName: 'Aarav Sharma',
    providerId: 'DOC002',
    providerName: 'Dr. Priya Sharma',
    department: 'General Medicine',
    service: 'Consultation',
    reason: 'Fever and viral follow-up',
    date: '2026-09-15',
    time: '09:30 AM',
    status: 'Confirmed',
    notes: 'Prior medical history: Hypertension',
    createdAt: '2026-09-14T14:30:00'
  },
  {
    id: 'APT-D-1003',
    type: 'doctor',
    patientId: 'P-103',
    patientName: 'Vikram Malhotra',
    providerId: 'DOC003',
    providerName: 'Dr. Rahul Menon',
    department: 'Orthopedics',
    service: 'Consultation',
    reason: 'Knee joint pain & mobility check',
    date: '2026-09-16',
    time: '11:00 AM',
    status: 'Scheduled',
    notes: '',
    createdAt: '2026-09-14T16:00:00'
  },
  {
    id: 'APT-N-1002',
    type: 'nurse',
    patientId: 'P-102',
    patientName: 'Ananya Iyer',
    providerId: 'NUR001',
    providerName: 'Nurse Anitha',
    department: 'General Nursing',
    service: 'Vital Signs',
    reason: 'Post-op vitals check',
    date: '2026-09-15',
    time: '10:00 AM',
    status: 'Confirmed',
    notes: '',
    createdAt: '2026-09-14T17:00:00'
  }
];

// 5. Rooms & Beds Data (Standardized 6 Rooms, 33 Beds Total)
export let mockRooms = [
  {
    roomNumber: 'WD-201',
    type: 'Ward A',
    totalBeds: 10,
    beds: [
      { id: 'WD-201-B01', roomId: 'WD-201', roomName: 'Ward A', bedNumber: 'Bed 01', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'WD-201-B02', roomId: 'WD-201', roomName: 'Ward A', bedNumber: 'Bed 02', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'WD-201-B03', roomId: 'WD-201', roomName: 'Ward A', bedNumber: 'Bed 03', status: 'OCCUPIED', patientId: 'P-101', patientName: 'Aarav Sharma', allocatedAt: '2026-08-20T10:00:00' },
      { id: 'WD-201-B04', roomId: 'WD-201', roomName: 'Ward A', bedNumber: 'Bed 04', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'WD-201-B05', roomId: 'WD-201', roomName: 'Ward A', bedNumber: 'Bed 05', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'WD-201-B06', roomId: 'WD-201', roomName: 'Ward A', bedNumber: 'Bed 06', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'WD-201-B07', roomId: 'WD-201', roomName: 'Ward A', bedNumber: 'Bed 07', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'WD-201-B08', roomId: 'WD-201', roomName: 'Ward A', bedNumber: 'Bed 08', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'WD-201-B09', roomId: 'WD-201', roomName: 'Ward A', bedNumber: 'Bed 09', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'WD-201-B10', roomId: 'WD-201', roomName: 'Ward A', bedNumber: 'Bed 10', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null }
    ]
  },
  {
    roomNumber: 'EMR-101',
    type: 'Emergency',
    totalBeds: 10,
    beds: [
      { id: 'EMR-101-B01', roomId: 'EMR-101', roomName: 'Emergency', bedNumber: 'Bed 01', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'EMR-101-B02', roomId: 'EMR-101', roomName: 'Emergency', bedNumber: 'Bed 02', status: 'OCCUPIED', patientId: 'P-104', patientName: 'Diya Patel', allocatedAt: '2026-08-27T08:30:00' },
      { id: 'EMR-101-B03', roomId: 'EMR-101', roomName: 'Emergency', bedNumber: 'Bed 03', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'EMR-101-B04', roomId: 'EMR-101', roomName: 'Emergency', bedNumber: 'Bed 04', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'EMR-101-B05', roomId: 'EMR-101', roomName: 'Emergency', bedNumber: 'Bed 05', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'EMR-101-B06', roomId: 'EMR-101', roomName: 'Emergency', bedNumber: 'Bed 06', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'EMR-101-B07', roomId: 'EMR-101', roomName: 'Emergency', bedNumber: 'Bed 07', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'EMR-101-B08', roomId: 'EMR-101', roomName: 'Emergency', bedNumber: 'Bed 08', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'EMR-101-B09', roomId: 'EMR-101', roomName: 'Emergency', bedNumber: 'Bed 09', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'EMR-101-B10', roomId: 'EMR-101', roomName: 'Emergency', bedNumber: 'Bed 10', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null }
    ]
  },
  {
    roomNumber: 'ICU-101',
    type: 'ICU',
    totalBeds: 10,
    beds: [
      { id: 'ICU-101-B01', roomId: 'ICU-101', roomName: 'ICU', bedNumber: 'Bed 01', status: 'OCCUPIED', patientId: 'P-102', patientName: 'Ananya Iyer', allocatedAt: '2026-08-25T14:15:00' },
      { id: 'ICU-101-B02', roomId: 'ICU-101', roomName: 'ICU', bedNumber: 'Bed 02', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'ICU-101-B03', roomId: 'ICU-101', roomName: 'ICU', bedNumber: 'Bed 03', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'ICU-101-B04', roomId: 'ICU-101', roomName: 'ICU', bedNumber: 'Bed 04', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'ICU-101-B05', roomId: 'ICU-101', roomName: 'ICU', bedNumber: 'Bed 05', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'ICU-101-B06', roomId: 'ICU-101', roomName: 'ICU', bedNumber: 'Bed 06', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'ICU-101-B07', roomId: 'ICU-101', roomName: 'ICU', bedNumber: 'Bed 07', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'ICU-101-B08', roomId: 'ICU-101', roomName: 'ICU', bedNumber: 'Bed 08', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'ICU-101-B09', roomId: 'ICU-101', roomName: 'ICU', bedNumber: 'Bed 09', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null },
      { id: 'ICU-101-B10', roomId: 'ICU-101', roomName: 'ICU', bedNumber: 'Bed 10', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null }
    ]
  },
  {
    roomNumber: 'PS-101',
    type: 'Private Suite 1',
    totalBeds: 1,
    beds: [
      { id: 'PS-101-B01', roomId: 'PS-101', roomName: 'Private Suite 1', bedNumber: 'Bed 01', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null }
    ]
  },
  {
    roomNumber: 'PS-102',
    type: 'Private Suite 2',
    totalBeds: 1,
    beds: [
      { id: 'PS-102-B01', roomId: 'PS-102', roomName: 'Private Suite 2', bedNumber: 'Bed 01', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null }
    ]
  },
  {
    roomNumber: 'PS-103',
    type: 'Private Suite 3',
    totalBeds: 1,
    beds: [
      { id: 'PS-103-B01', roomId: 'PS-103', roomName: 'Private Suite 3', bedNumber: 'Bed 01', status: 'AVAILABLE', patientId: null, patientName: null, allocatedAt: null }
    ]
  }
];

// 6. Pharmacy Inventory Data
export let mockMedicines = [
  { id: 'M-401', name: 'Metformin 500mg', type: 'Tablet', stock: 1200, threshold: 300, price: 15.00, expiryDate: '2028-02-15', status: 'IN STOCK' },
  { id: 'M-402', name: 'Amlodipine 5mg', type: 'Tablet', stock: 800, threshold: 200, price: 12.50, expiryDate: '2027-11-20', status: 'IN STOCK' },
  { id: 'M-403', name: 'Amoxicillin 500mg', type: 'Capsule', stock: 150, threshold: 250, price: 25.00, expiryDate: '2026-10-05', status: 'LOW STOCK' },
  { id: 'M-404', name: 'Paracetamol Syrup 125mg/5ml', type: 'Syrup', stock: 0, threshold: 100, price: 45.00, expiryDate: '2027-04-12', status: 'OUT OF STOCK' },
  { id: 'M-405', name: 'Insulin Glargine 100 U/ml', type: 'Injection', stock: 65, threshold: 50, price: 350.00, expiryDate: '2026-09-30', status: 'EXPIRING SOON' },
  { id: 'M-406', name: 'Albuterol Inhaler', type: 'Inhaler', stock: 250, threshold: 100, price: 180.00, expiryDate: '2027-08-18', status: 'IN STOCK' }
];

// 7. Blood Bank Data
export let mockBloodStock = [
  { group: 'A+', bags: 18, status: 'Normal' },
  { group: 'A-', bags: 4, status: 'Low Stock' },
  { group: 'B+', bags: 22, status: 'Normal' },
  { group: 'B-', bags: 6, status: 'Normal' },
  { group: 'AB+', bags: 12, status: 'Normal' },
  { group: 'AB-', bags: 2, status: 'Emergency Alert' },
  { group: 'O+', bags: 35, status: 'Normal' },
  { group: 'O-', bags: 3, status: 'Low Stock' }
];

export let mockBloodDonors = [
  { id: 'BD-01', name: 'Rajesh Kumar', bloodGroup: 'O+', lastDonated: '2026-06-12', phone: '+91 94444 11111' },
  { id: 'BD-02', name: 'Sneha Patel', bloodGroup: 'AB-', lastDonated: '2026-05-30', phone: '+91 94444 22222' }
];

// 8. Visitor Records
export let mockVisitors = [
  { id: 'V-601', visitorName: 'Ramesh Sharma', phone: '+91 98888 12345', patientName: 'Aarav Sharma', checkInTime: '2026-08-27 09:15 AM', checkOutTime: null, status: 'Checked In', passId: 'PASS-87912' },
  { id: 'V-602', visitorName: 'Kavitha Iyer', phone: '+91 98888 23456', patientName: 'Ananya Iyer', checkInTime: '2026-08-27 10:30 AM', checkOutTime: '2026-08-27 12:00 PM', status: 'Checked Out', passId: 'PASS-87913' },
  { id: 'V-603', visitorName: 'Vijay Malhotra', phone: '+91 98888 34567', patientName: 'Vikram Malhotra', checkInTime: '2026-08-27 02:30 PM', checkOutTime: null, status: 'Checked In', passId: 'PASS-87914' }
];

// 9. Billing Data
export let mockBills = [
  {
    id: 'INV-2026-001',
    patientName: 'Aarav Sharma',
    patientId: 'P-101',
    date: '2026-08-27',
    roomCharges: 3500,
    doctorCharges: 1500,
    medicineCharges: 850,
    otherCharges: 200,
    total: 6050,
    status: 'Paid'
  },
  {
    id: 'INV-2026-002',
    patientName: 'Vikram Malhotra',
    patientId: 'P-103',
    date: '2026-08-27',
    roomCharges: 8000,
    doctorCharges: 3000,
    medicineCharges: 1200,
    otherCharges: 500,
    total: 12700,
    status: 'Pending'
  },
  {
    id: 'INV-2026-003',
    patientName: 'Ananya Iyer',
    patientId: 'P-102',
    date: '2026-08-26',
    roomCharges: 15000,
    doctorCharges: 5000,
    medicineCharges: 2500,
    otherCharges: 1500,
    total: 24000,
    status: 'Paid'
  }
];

// 10. Patient Diet Plans
export let mockDietPlans = [
  {
    id: 'P-101',
    breakfast: 'Oatmeal with almonds & low-fat milk',
    lunch: 'Brown rice, grilled chicken breast or dal, spinach stir-fry',
    dinner: 'Whole wheat roti, mixed vegetable curry, cucumber salad',
    snacks: 'Apple with walnuts, green tea',
    calories: '1800 kcal',
    nutrition: 'Carbs: 50%, Protein: 25%, Fats: 25%',
    waterIntake: '2.5L / 3.0L',
    streak: 5
  },
  {
    id: 'P-105', // Gousik Lakshmanan
    breakfast: 'Idli (3 pcs) with sambar, fresh orange juice',
    lunch: 'Rotis, paneer bhurji, yellow dal, green salad',
    dinner: 'Quinoa pulao, vegetable soup, stir-fried broccoli',
    snacks: 'Roasted chana, buttermilk',
    calories: '2000 kcal',
    nutrition: 'Carbs: 55%, Protein: 20%, Fats: 25%',
    waterIntake: '1.8L / 2.5L',
    streak: 12
  }
];

// 11. Activity Log
export let mockActivities = [
  { id: 1, text: 'Patient Aarav Sharma registered', time: '10 mins ago', type: 'info' },
  { id: 2, text: 'Appointment booked for Ananya Iyer with Dr. Vikram', time: '45 mins ago', type: 'success' },
  { id: 3, text: 'Medicine stock alert: Amoxicillin 500mg is low', time: '1 hr ago', type: 'warning' },
  { id: 4, text: 'Bed ICU-101 Allocated to Patient Ananya Iyer', time: '2 hrs ago', type: 'info' },
  { id: 5, text: 'Payment received: Invoice INV-2026-001 (Aarav Sharma)', time: '3 hrs ago', type: 'success' }
];

// 12. Notifications
export let mockNotifications = [
  { id: 'N-01', title: 'Emergency Blood Request', description: 'Immediate requirement of 2 bags of AB- blood in OT-2.', time: 'Just now', type: 'Emergency', unread: true },
  { id: 'N-02', title: 'Low Inventory Alert', description: 'Metformin 500mg is approaching the minimum threshold.', time: '25 mins ago', type: 'Pharmacy', unread: true },
  { id: 'N-03', title: 'Appointment Booking', description: 'Gousik Lakshmanan has scheduled an appointment with Dr. Amit Patel.', time: '1 hr ago', type: 'Appointment', unread: false },
  { id: 'N-04', title: 'Vitals Alert', description: 'Patient Ananya Iyer\'s blood pressure is slightly elevated.', time: '2 hrs ago', type: 'System', unread: false }
];

// Data Modifiers for Mocking API Calls (local CRUD operations)
export const patientService = {
  getAll: () => mockPatients,
  getById: (id) => mockPatients.find(p => p.id === id),
  create: (patient) => {
    const newId = `P-${100 + mockPatients.length + 1}`;
    const newPatient = { id: newId, ...patient, status: 'Admitted', vitals: { temp: '98.6 °F', bp: '120/80 mmHg', heartRate: '72 bpm', spo2: '99%' } };
    mockPatients.unshift(newPatient);
    
    // Log Activity
    mockActivities.unshift({ id: Date.now(), text: `Patient ${patient.name} registered`, time: 'Just now', type: 'info' });
    return newPatient;
  },
  updateVitals: (id, vitals) => {
    const idx = mockPatients.findIndex(p => p.id === id);
    if (idx !== -1) {
      mockPatients[idx].vitals = vitals;
      mockPatients[idx].nursingNotes = `Vitals updated at ${new Date().toLocaleTimeString()}`;
      return mockPatients[idx];
    }
    return null;
  },
  updatePrescription: (id, prescription) => {
    const idx = mockPatients.findIndex(p => p.id === id);
    if (idx !== -1) {
      if (!mockPatients[idx].prescriptions) mockPatients[idx].prescriptions = [];
      mockPatients[idx].prescriptions.push(prescription);
      return mockPatients[idx];
    }
    return null;
  }
};

export const appointmentService = {
  getAll: () => mockAppointments,
  create: (appointment) => {
    const newId = `A-${500 + mockAppointments.length + 1}`;
    const patient = mockPatients.find(p => p.id === appointment.patientId) || { name: appointment.patientName };
    const doctor = mockDoctors.find(d => d.id === appointment.doctorId) || { name: appointment.doctorName };
    
    const newApp = {
      id: newId,
      patientId: appointment.patientId || 'P-105',
      patientName: patient.name,
      doctorId: appointment.doctorId,
      doctorName: doctor.name,
      department: appointment.department || doctor.specialty,
      date: appointment.date,
      time: appointment.time,
      status: 'Scheduled'
    };
    mockAppointments.unshift(newApp);
    
    // Increment Doctor appointment count
    const dIdx = mockDoctors.findIndex(d => d.id === appointment.doctorId);
    if (dIdx !== -1) mockDoctors[dIdx].appointmentsCount += 1;
    
    // Log Activity
    mockActivities.unshift({ id: Date.now(), text: `Appointment booked for ${patient.name} with ${doctor.name}`, time: 'Just now', type: 'success' });
    return newApp;
  },
  updateStatus: (id, status) => {
    const idx = mockAppointments.findIndex(a => a.id === id);
    if (idx !== -1) {
      mockAppointments[idx].status = status;
      return mockAppointments[idx];
    }
    return null;
  }
};

export const roomService = {
  getAll: () => mockRooms,
  allocateBed: (roomNumber, bedId, patientId) => {
    const room = mockRooms.find(r => r.roomNumber === roomNumber);
    if (room) {
      const bed = room.beds.find(b => b.id === bedId);
      if (bed) {
        const patient = mockPatients.find(p => p.id === patientId);
        bed.status = 'OCCUPIED';
        bed.patientId = patientId;
        room.availableBeds = room.beds.filter(b => b.status === 'AVAILABLE').length;
        room.status = room.availableBeds === 0 ? 'OCCUPIED' : 'OCCUPIED';
        
        if (patient) {
          patient.room = `${room.type} - Bed ${bedId}`;
          patient.status = 'Admitted';
        }
        
        mockActivities.unshift({ id: Date.now(), text: `Bed ${roomNumber}-${bedId} Allocated to Patient ${patient?.name || patientId}`, time: 'Just now', type: 'info' });
        return true;
      }
    }
    return false;
  },
  updateStatus: (roomNumber, status) => {
    const room = mockRooms.find(r => r.roomNumber === roomNumber);
    if (room) {
      room.status = status;
      return true;
    }
    return false;
  }
};

export const pharmacyService = {
  getAll: () => mockMedicines,
  addStock: (id, qty) => {
    const med = mockMedicines.find(m => m.id === id);
    if (med) {
      med.stock += parseInt(qty);
      if (med.stock > med.threshold) med.status = 'IN STOCK';
      else if (med.stock > 0) med.status = 'LOW STOCK';
      return med;
    }
    return null;
  },
  dispense: (id, qty) => {
    const med = mockMedicines.find(m => m.id === id);
    if (med && med.stock >= qty) {
      med.stock -= parseInt(qty);
      if (med.stock === 0) med.status = 'OUT OF STOCK';
      else if (med.stock <= med.threshold) med.status = 'LOW STOCK';
      return med;
    }
    return null;
  },
  create: (medicine) => {
    const newId = `M-${400 + mockMedicines.length + 1}`;
    const newMed = {
      id: newId,
      name: medicine.name,
      type: medicine.type,
      stock: parseInt(medicine.stock),
      threshold: parseInt(medicine.threshold),
      price: parseFloat(medicine.price),
      expiryDate: medicine.expiryDate,
      status: parseInt(medicine.stock) > parseInt(medicine.threshold) ? 'IN STOCK' : 'LOW STOCK'
    };
    mockMedicines.unshift(newMed);
    return newMed;
  }
};

export const bloodBankService = {
  getAllStock: () => mockBloodStock,
  getAllDonors: () => mockBloodDonors,
  addDonor: (donor) => {
    const newId = `BD-${mockBloodDonors.length + 1}`;
    const newDonor = { id: newId, lastDonated: new Date().toISOString().split('T')[0], ...donor };
    mockBloodDonors.unshift(newDonor);
    
    // Add bags to stock
    const stock = mockBloodStock.find(s => s.group === donor.bloodGroup);
    if (stock) {
      stock.bags += 1;
      stock.status = stock.bags > 5 ? 'Normal' : 'Low Stock';
    }
    return newDonor;
  },
  requestBlood: (group, bags) => {
    const stock = mockBloodStock.find(s => s.group === group);
    if (stock && stock.bags >= bags) {
      stock.bags -= bags;
      stock.status = stock.bags <= 2 ? 'Emergency Alert' : (stock.bags <= 5 ? 'Low Stock' : 'Normal');
      return true;
    }
    return false;
  }
};

export const visitorService = {
  getAll: () => mockVisitors,
  create: (visitor) => {
    const newId = `V-${600 + mockVisitors.length + 1}`;
    const newVisitor = {
      id: newId,
      visitorName: visitor.visitorName,
      phone: visitor.phone,
      patientName: visitor.patientName,
      checkInTime: new Date().toLocaleString(),
      checkOutTime: null,
      status: 'Checked In',
      passId: `PASS-${Math.floor(10000 + Math.random() * 90000)}`
    };
    mockVisitors.unshift(newVisitor);
    return newVisitor;
  },
  checkOut: (id) => {
    const vis = mockVisitors.find(v => v.id === id);
    if (vis) {
      vis.checkOutTime = new Date().toLocaleString();
      vis.status = 'Checked Out';
      return true;
    }
    return false;
  }
};

export const billingService = {
  getAll: () => mockBills,
  create: (bill) => {
    const newId = `INV-2026-00${mockBills.length + 1}`;
    const room = parseFloat(bill.roomCharges || 0);
    const doctor = parseFloat(bill.doctorCharges || 0);
    const medicine = parseFloat(bill.medicineCharges || 0);
    const other = parseFloat(bill.otherCharges || 0);
    const total = room + doctor + medicine + other;
    
    const newBill = {
      id: newId,
      patientName: bill.patientName,
      patientId: bill.patientId || 'P-105',
      date: new Date().toISOString().split('T')[0],
      roomCharges: room,
      doctorCharges: doctor,
      medicineCharges: medicine,
      otherCharges: other,
      total: total,
      status: bill.status || 'Pending'
    };
    mockBills.unshift(newBill);
    return newBill;
  },
  pay: (id) => {
    const bill = mockBills.find(b => b.id === id);
    if (bill) {
      bill.status = 'Paid';
      return true;
    }
    return false;
  }
};
