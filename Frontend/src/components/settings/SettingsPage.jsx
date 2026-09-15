import React, { useState } from 'react';
import { Settings, ShieldCheck, Database, BellRing } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

export const SettingsPage = () => {
  const [hospitalName, setHospitalName] = useState('MediSync AI Hospital Group');
  const [billingTerms, setBillingTerms] = useState('Net 15 Days');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [emergencyBagsThreshold, setEmergencyBagsThreshold] = useState(3);

  const handleSave = (e) => {
    e.preventDefault();
    alert('System settings updated successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-slate-800">System Configuration</h2>
        <p className="text-xs text-slate-500">Configure global parameters, security guidelines, and logistics alerts</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card title="Hospital Profile Info" subtitle="Global branding metadata">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
            <div>
              <label className="block text-slate-500 mb-1">Hospital / Clinic Group Name</label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="w-full p-2.5 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-500 mb-1">Standard Invoice Billing Terms</label>
              <select
                value={billingTerms}
                onChange={(e) => setBillingTerms(e.target.value)}
                className="w-full p-2.5 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-xs"
              >
                <option value="Immediate">Due Upon Receipt</option>
                <option value="Net 15 Days">Net 15 Days</option>
                <option value="Net 30 Days">Net 30 Days</option>
              </select>
            </div>
          </div>
        </Card>

        <Card title="Repository Alert Settings" subtitle="Threshold configs for low items warnings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600">
            <div className="flex items-center justify-between border border-slate-100 p-3 rounded-xl">
              <div>
                <span className="font-semibold text-slate-800 block">Critical Blood Bag Limit</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Trigger alarm below this value</span>
              </div>
              <input
                type="number"
                value={emergencyBagsThreshold}
                onChange={(e) => setEmergencyBagsThreshold(parseInt(e.target.value))}
                className="w-16 p-1.5 border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none rounded-lg text-center font-bold"
              />
            </div>

            <div className="flex items-center justify-between border border-slate-100 p-3 rounded-xl">
              <div>
                <span className="font-semibold text-slate-800 block">Push Notifications</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Enable real-time sounds</span>
              </div>
              <input
                type="checkbox"
                checked={alertsEnabled}
                onChange={(e) => setAlertsEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
              />
            </div>
          </div>
        </Card>

        <Card title="System Diagnostics" subtitle="Diagnostic status flags">
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <ShieldCheck className="w-5 h-5 mx-auto mb-1 text-emerald-600" />
              <span className="font-bold block">Security Audit</span>
              <span className="text-[9px] block text-emerald-600/70 mt-0.5">Grade: A+</span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
              <Database className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <span className="font-bold block">Local Cache</span>
              <span className="text-[9px] block text-blue-600/70 mt-0.5">84 KB Admitted</span>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
              <BellRing className="w-5 h-5 mx-auto mb-1 text-indigo-600" />
              <span className="font-bold block">Log Dispatcher</span>
              <span className="text-[9px] block text-indigo-600/70 mt-0.5">Operational</span>
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" variant="primary">
            Save System Configurations
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
