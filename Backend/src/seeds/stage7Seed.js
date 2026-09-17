import mongoose from 'mongoose';
import Visitor from '../models/Visitor.js';
import Bill from '../models/Bill.js';
import DietPlan from '../models/DietPlan.js';
import Patient from '../models/Patient.js';
import User from '../models/User.js';

export const seedStage7 = async () => {
  try {
    // 1. Locate staff and patients
    let adminUser = await User.findOne({ role: 'admin' });
    let receptionistUser = await User.findOne({ role: 'receptionist' });
    const creatorUser = receptionistUser || adminUser || await User.findOne();

    const creatorId = creatorUser ? creatorUser._id : new mongoose.Types.ObjectId();
    const creatorName = creatorUser ? (creatorUser.name || 'Staff Receptionist') : 'Staff Receptionist';

    const patients = await Patient.find();
    if (!patients || patients.length === 0) {
      console.log('[SEED] Stage 7: No patients available yet. Skipping seed.');
      return;
    }

    const patient1 = patients[0];
    const patient2 = patients.length > 1 ? patients[1] : patients[0];

    // 2. Seed Initial Visitors Idempotently
    const initialVisitors = [
      {
        passId: 'PASS-10021',
        visitorName: 'Rajesh Sharma',
        phone: '+91 98888 12345',
        email: 'rajesh.sharma@example.com',
        relationship: 'Brother',
        purpose: 'Ward Visit & Moral Support',
        patientId: patient1._id,
        patientName: patient1.name,
        patientRoom: patient1.room || patient1.ward || 'Ward A-101',
        visitDate: new Date(),
        checkInTime: null,
        checkOutTime: null,
        status: 'Expected',
        registeredBy: creatorId,
        registeredByName: creatorName,
        notes: 'Requested visiting pass for evening hours'
      },
      {
        passId: 'PASS-10022',
        visitorName: 'Kavitha Devi',
        phone: '+91 98888 23456',
        email: 'kavitha.devi@example.com',
        relationship: 'Spouse',
        purpose: 'Post-Op Care Visit',
        patientId: patient2._id,
        patientName: patient2.name,
        patientRoom: patient2.room || patient2.ward || 'ICU Bed 2',
        visitDate: new Date(),
        checkInTime: new Date(Date.now() - 3600000), // 1 hour ago
        checkOutTime: null,
        status: 'Checked In',
        registeredBy: creatorId,
        registeredByName: creatorName,
        notes: 'Attending physician approval on file'
      }
    ];

    for (const v of initialVisitors) {
      await Visitor.findOneAndUpdate(
        { passId: v.passId },
        { $setOnInsert: v },
        { upsert: true, new: true }
      );
    }

    // 3. Seed Initial Billing Invoices Idempotently
    const initialBills = [
      {
        invoiceNumber: 'INV-2026-100001',
        patientId: patient1._id,
        patientName: patient1.name,
        patientEmail: patient1.email || 'patient@medisync.local',
        items: [
          { description: 'General Consultation & Health Evaluation', category: 'Doctor Consultation', quantity: 1, unitPrice: 500, amount: 500 },
          { description: 'Amoxicillin 500mg (14 Capsules)', category: 'Pharmacy & Medication', quantity: 2, unitPrice: 150, amount: 300 },
          { description: 'Complete Blood Count (CBC) Panel', category: 'Lab Test', quantity: 1, unitPrice: 450, amount: 450 }
        ],
        subtotal: 1250,
        discount: 50,
        tax: 60,
        totalAmount: 1260,
        amountPaid: 600,
        balanceAmount: 660,
        paymentStatus: 'Partially Paid',
        paymentMethod: 'UPI',
        paymentHistory: [
          {
            paymentId: 'PAY-100001',
            amount: 600,
            paymentMethod: 'UPI',
            transactionRef: 'UPI-TXN-984712',
            paidAt: new Date(),
            recordedBy: creatorId,
            recordedByName: creatorName
          }
        ],
        notes: 'Initial admission fee paid via UPI',
        createdBy: creatorId,
        createdByName: creatorName
      },
      {
        invoiceNumber: 'INV-2026-100002',
        patientId: patient2._id,
        patientName: patient2.name,
        patientEmail: patient2.email || 'patient2@medisync.local',
        items: [
          { description: 'Semi-Private Room Stay (2 Days)', category: 'Room & Bed', quantity: 2, unitPrice: 1200, amount: 2400 },
          { description: 'Post-Op Monitoring & Nursing Care', category: 'Procedure', quantity: 1, unitPrice: 800, amount: 800 }
        ],
        subtotal: 3200,
        discount: 0,
        tax: 160,
        totalAmount: 3360,
        amountPaid: 0,
        balanceAmount: 3360,
        paymentStatus: 'Unpaid',
        paymentMethod: 'Unpaid',
        paymentHistory: [],
        notes: 'Pending final discharge billing clearance',
        createdBy: creatorId,
        createdByName: creatorName
      }
    ];

    for (const b of initialBills) {
      await Bill.findOneAndUpdate(
        { invoiceNumber: b.invoiceNumber },
        { $setOnInsert: b },
        { upsert: true, new: true }
      );
    }

    // 4. Seed Initial Diet Plan Idempotently
    const existingPlan = await DietPlan.findOne({ patientId: patient1._id });
    if (!existingPlan) {
      await DietPlan.create({
        userId: patient1.userId || creatorId,
        patientId: patient1._id,
        patientName: patient1.name,
        questionnaire: {
          age: patient1.age || 28,
          gender: patient1.gender || 'male',
          height: 175,
          weight: 70,
          preference: 'vegetarian',
          allergies: ['Peanuts'],
          activity: 'moderate',
          currentDisease: 'Gastritis'
        },
        caloriesTarget: 2100,
        waterTarget: 2.8,
        macros: { protein: 80, carbs: 260, fats: 55, fiber: 30 },
        clinicalNote: 'Non-acidic soothing meals. High fiber with probiotic curd.',
        weeklyMeals: [
          { day: 'Monday', breakfast: 'Oatmeal with chia seeds and almond milk', lunch: 'Quinoa bowl with steamed spinach and lentils', dinner: 'Whole wheat flatbread with dal and bottle gourd', snacks: 'Buttermilk with roasted seeds' },
          { day: 'Tuesday', breakfast: 'Semolina vegetable upma with green tea', lunch: 'Brown rice with mixed beans and cucumber salad', dinner: 'Sweet potato soup with grilled paneer', snacks: 'Apple slices' },
          { day: 'Wednesday', breakfast: 'Multigrain toast with avocado mash', lunch: 'Paneer bhurji with multigrain rotis', dinner: 'Stir-fried broccoli and mushrooms with quinoa', snacks: 'Roasted chickpeas' },
          { day: 'Thursday', breakfast: 'Sprouted moong dal salad with lemon', lunch: 'Brown rice with vegetable curry and curd', dinner: 'Lentil soup with garlic bread', snacks: 'Mixed walnuts and berries' },
          { day: 'Friday', breakfast: 'Banana oats smoothie', lunch: 'Quinoa bowl with bell peppers and roasted beans', dinner: 'Soft rotis with spinach sabzi', snacks: 'Cucumber sticks with hummus' },
          { day: 'Saturday', breakfast: 'Paneer stuffed paratha (low oil)', lunch: 'Chickpea spinach curry with brown rice', dinner: 'Baked vegetable casserole', snacks: 'Roasted almonds' },
          { day: 'Sunday', breakfast: 'Poha with roasted peanuts and curry leaves', lunch: 'Millet khichdi with roasted papad and curd', dinner: 'Minestrone vegetable soup with tofu skewers', snacks: 'Chia pudding' }
        ],
        todayTarget: {
          breakfast: 'Oatmeal with chia seeds and almond milk',
          lunch: 'Quinoa bowl with steamed spinach and lentils',
          dinner: 'Whole wheat flatbread with dal and bottle gourd',
          snacks: 'Buttermilk with roasted seeds',
          calories: 2100,
          water: 2.8
        },
        source: 'CLINICAL_ASSIGNED',
        assignedBy: creatorId,
        assignedByName: creatorName,
        isActive: true
      });
    }

    console.log('[SEED] Stage 7 verification complete: Visitors, Billing, and Diet Plans verified.');
  } catch (error) {
    console.error(`[SEED ERROR] Failed to seed Stage 7: ${error.message}`);
  }
};

export default seedStage7;
