export const navigationConfig = [
  {
    section: 'MAIN',
    items: [
      {
        label: 'Dashboard',
        path: '/:role/dashboard',
        icon: 'LayoutDashboard',
        permission: 'dashboard'
      },
      {
        label: 'Patients',
        path: '/:role/patients',
        icon: 'Users',
        permission: 'patients'
      },
      {
        label: 'Appointments',
        path: '/:role/appointments',
        icon: 'Calendar',
        permission: 'appointments'
      },
      {
        label: 'Doctors',
        path: '/:role/doctors',
        icon: 'Stethoscope',
        permission: 'doctors'
      },
      {
        label: 'Nurses',
        path: '/:role/nurses',
        icon: 'HeartHandshake',
        permission: 'nurses'
      },
      {
        label: 'Rooms & Beds',
        path: '/:role/rooms',
        icon: 'Bed',
        permission: 'rooms_beds'
      },
      {
        label: 'Pharmacy',
        path: '/:role/pharmacy',
        icon: 'Pills',
        permission: 'pharmacy'
      },
      {
        label: 'Blood Bank',
        path: '/:role/blood-bank',
        icon: 'Droplet',
        permission: 'blood_bank'
      },
      {
        label: 'Visitors',
        path: '/:role/visitors',
        icon: 'UserCheck',
        permission: 'visitors'
      },
      {
        label: 'Diet Planning',
        path: '/:role/diet',
        icon: 'Utensils',
        permission: 'diet'
      },
      {
        label: 'Billing',
        path: '/:role/billing',
        icon: 'ReceiptText',
        permission: 'billing'
      },
      {
        label: 'Reports',
        path: '/:role/reports',
        icon: 'FileBarChart',
        permission: 'reports'
      },
      {
        label: 'Notifications',
        path: '/:role/notifications',
        icon: 'Bell',
        permission: 'notifications'
      },
      {
        label: 'Settings',
        path: '/:role/settings',
        icon: 'Settings',
        permission: 'settings'
      }
    ]
  },
  {
    section: 'AI HEALTHCARE',
    items: [
      {
        label: 'AI Diet Planner',
        path: '/ai/diet-planner',
        icon: 'Salad',
        permission: 'ai_diet_planner'
      },
      {
        label: 'AI Report Summarizer',
        path: '/ai/report-summarizer',
        icon: 'FileHeart',
        permission: 'ai_report_summarizer'
      }
    ]
  }
];
