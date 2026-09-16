import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ShieldCheck,
  Camera,
  Save,
  X,
  Edit3,
  HeartPulse,
  Award,
  Stethoscope,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { profileService } from '../../services/profileService';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { ROLE_LABELS, BLOOD_GROUPS } from '../../config/constants';

const ALLOWED_BLOOD_GROUPS = ['Not Recorded', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const ProfilePage = () => {
  const { user, updateUser, currentRole } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bio: '',
    department: '',
    specialization: '',
    licenseNumber: '',
    experienceYears: 0,
    qualifications: '',
    employeeId: '',
  });

  const [profilePicture, setProfilePicture] = useState('');

  // Load profile from MongoDB
  const fetchProfile = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await profileService.getProfile();
      if (res?.success && res.user) {
        const u = res.user;
        const prof = u.professionalDetails || {};
        const emer = u.emergencyContact || {};

        setFormData({
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          phone: u.phone || '',
          dateOfBirth: u.dateOfBirth || '',
          gender: u.gender || '',
          bloodGroup: u.bloodGroup || (res.patient?.bloodGroup || 'Not Recorded'),
          address: u.address || '',
          city: u.city || '',
          state: u.state || '',
          postalCode: u.postalCode || '',
          emergencyContactName: emer.name || '',
          emergencyContactPhone: emer.phone || '',
          bio: u.bio || '',
          department: prof.department || '',
          specialization: prof.specialization || '',
          licenseNumber: prof.licenseNumber || '',
          experienceYears: prof.experienceYears || 0,
          qualifications: prof.qualifications || '',
          employeeId: prof.employeeId || '',
        });

        setProfilePicture(u.profilePicture || '');
        updateUser(u);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Unable to load profile data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePictureSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');

    // 1. Validate MIME type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Invalid image format. Supported formats: JPG, PNG, WEBP.');
      return;
    }

    // 2. Validate original file size <= 2MB
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setErrorMsg('Profile picture file size must not exceed 2 MB.');
      return;
    }

    setUploadingPic(true);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result;
        const res = await profileService.updateProfilePicture(base64Data);
        if (res?.success) {
          setProfilePicture(res.profilePicture);
          updateUser(res.user);
          setSuccessMsg('Profile picture updated successfully.');
        } else {
          setErrorMsg(res?.message || 'Failed to update profile picture.');
        }
      } catch (err) {
        setErrorMsg(err.response?.data?.message || err.message || 'Failed to upload image.');
      } finally {
        setUploadingPic(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Error reading selected image file.');
      setUploadingPic(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSaving(true);

    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        emergencyContact: {
          name: formData.emergencyContactName.trim(),
          phone: formData.emergencyContactPhone.trim(),
        },
        bio: formData.bio.trim(),
      };

      if (currentRole !== 'patient') {
        payload.professionalDetails = {
          department: formData.department.trim(),
          specialization: formData.specialization.trim(),
          licenseNumber: formData.licenseNumber.trim(),
          experienceYears: Number(formData.experienceYears) || 0,
          qualifications: formData.qualifications.trim(),
          employeeId: formData.employeeId.trim(),
        };
      }

      const res = await profileService.updateProfile(payload);
      if (res?.success) {
        updateUser(res.user);
        setSuccessMsg('Profile updated successfully.');
        setIsEditing(false);
      } else {
        setErrorMsg(res?.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrorMsg('');
    setSuccessMsg('');
    fetchProfile();
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3 py-12">
        <Loader size="lg" />
        <span className="text-xs text-slate-500 font-medium">Loading authoritative profile from MongoDB...</span>
      </div>
    );
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Page Title & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <User className="w-6 h-6 text-blue-600" />
            My User Profile
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your authenticated MediSync AI account details and professional credentials
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setIsEditing(true);
                setErrorMsg('');
                setSuccessMsg('');
              }}
              className="flex items-center gap-1.5"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
                className="flex items-center gap-1.5"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                loading={saving}
                className="flex items-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Notifications / Feedback */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-700 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* HEADER CARD: Avatar + Identity */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Profile Picture with Upload Overlay */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl shadow-sm">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt={user?.name || 'User Profile'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPic}
              className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-md transition-transform hover:scale-105 cursor-pointer disabled:opacity-50"
              title="Change Profile Picture (Max 2MB)"
            >
              <Camera className="w-4 h-4" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePictureSelect}
              className="hidden"
            />
          </div>

          {/* User Info Overview */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {formData.firstName} {formData.lastName}
                </h2>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
                    {ROLE_LABELS[currentRole] || currentRole}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium border border-emerald-100">
                    <ShieldCheck className="w-3 h-3" /> Active Account
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user?.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {formData.phone || 'Phone not set'}
              </span>
              {formData.bloodGroup && formData.bloodGroup !== 'Not Recorded' && (
                <span className="flex items-center gap-1 font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                  🩸 {formData.bloodGroup}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* PERSONAL INFORMATION CARD */}
        <Card title="Personal Information" subtitle="Primary identity and contact information">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-medium text-slate-800 py-1">{formData.firstName || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Last Name <span className="text-rose-500">*</span>
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-medium text-slate-800 py-1">{formData.lastName || '-'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Email Address</span>
                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Read-Only
                </span>
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-medium text-slate-800 py-1">{formData.phone || 'Not Recorded'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth
              </label>
              {isEditing ? (
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-medium text-slate-800 py-1">{formData.dateOfBirth || 'Not Recorded'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender
              </label>
              {isEditing ? (
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="text-xs font-medium text-slate-800 py-1">{formData.gender || 'Not Recorded'}</p>
              )}
            </div>
          </div>
        </Card>

        {/* ROLE-SPECIFIC: PATIENT CLINICAL / MEDICAL SECTION */}
        {currentRole === 'patient' && (
          <Card
            title="Patient Clinical & Health Profile"
            subtitle="Controlled personal health attributes and emergency contact"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Blood Group
                  </label>
                  {isEditing ? (
                    <select
                      name="bloodGroup"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                    >
                      {ALLOWED_BLOOD_GROUPS.map((bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center gap-2 py-1">
                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                        {formData.bloodGroup || 'Not Recorded'}
                      </span>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    Synchronized automatically with your Personal Medical History and clinical chart.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-800">
                💡 <strong>Clinical Data Safety:</strong> Vital signs (BP, SpO2, Temperature, Heart Rate, etc.) and Prescriptions are managed and verified exclusively by hospital clinical staff (Nurses/Doctors) and cannot be modified via self-profile editing.
              </div>
            </div>
          </Card>
        )}

        {/* ROLE-SPECIFIC: PROFESSIONAL DETAILS FOR STAFF (Doctor, Nurse, Receptionist, Pharmacist, Admin) */}
        {currentRole !== 'patient' && (
          <Card
            title="Professional Credentials & Department"
            subtitle="Staff qualifications, certifications, and institutional bio"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    placeholder="e.g. Cardiology / General Ward"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-xs font-medium text-slate-800 py-1">{formData.department || 'Not Recorded'}</p>
                )}
              </div>

              {currentRole === 'doctor' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specialization
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleChange}
                      placeholder="e.g. Interventional Cardiology"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  ) : (
                    <p className="text-xs font-medium text-slate-800 py-1">{formData.specialization || 'Not Recorded'}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {currentRole === 'doctor' || currentRole === 'nurse' || currentRole === 'pharmacist'
                    ? 'Medical / Practice License No.'
                    : 'Employee / Staff ID'}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="e.g. MED-LIC-2026-99"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-xs font-medium text-slate-800 py-1">{formData.licenseNumber || 'Not Recorded'}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Years of Experience
                </label>
                {isEditing ? (
                  <input
                    type="number"
                    name="experienceYears"
                    min="0"
                    max="60"
                    value={formData.experienceYears}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-xs font-medium text-slate-800 py-1">
                    {formData.experienceYears ? `${formData.experienceYears} Years` : 'Not Recorded'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Qualifications & Degrees
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleChange}
                    placeholder="e.g. MBBS, MD, B.Sc Nursing"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                ) : (
                  <p className="text-xs font-medium text-slate-800 py-1">{formData.qualifications || 'Not Recorded'}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Blood Group
                </label>
                {isEditing ? (
                  <select
                    name="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    {ALLOWED_BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>
                        {bg}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs font-medium text-slate-800 py-1">{formData.bloodGroup || 'Not Recorded'}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Professional Bio & Responsibilities
              </label>
              {isEditing ? (
                <textarea
                  name="bio"
                  rows="3"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Provide a brief clinical or administrative background..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs text-slate-700 py-1 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                  {formData.bio || 'No professional bio provided yet.'}
                </p>
              )}
            </div>
          </Card>
        )}

        {/* ADDRESS & LOCATION CARD */}
        <Card title="Contact & Address" subtitle="Residential and communication address">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Street Address
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Health Ave, Suite 400"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-medium text-slate-800 py-1">{formData.address || 'Not Recorded'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                City
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-medium text-slate-800 py-1">{formData.city || 'Not Recorded'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                State
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-medium text-slate-800 py-1">{formData.state || 'Not Recorded'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Postal Code
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-medium text-slate-800 py-1">{formData.postalCode || 'Not Recorded'}</p>
              )}
            </div>
          </div>
        </Card>

        {/* EMERGENCY CONTACT CARD */}
        <Card title="Emergency Contact" subtitle="Designated emergency point of contact">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Person Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="emergencyContactName"
                  value={formData.emergencyContactName}
                  onChange={handleChange}
                  placeholder="e.g. Sarah Smith (Spouse / Guardian)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-medium text-slate-800 py-1">{formData.emergencyContactName || 'Not Recorded'}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Person Phone
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="emergencyContactPhone"
                  value={formData.emergencyContactPhone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543219"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              ) : (
                <p className="text-xs font-medium text-slate-800 py-1">{formData.emergencyContactPhone || 'Not Recorded'}</p>
              )}
            </div>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default ProfilePage;
