import React, { useEffect, useMemo, useState } from 'react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';
import LoadingButton from '../../components/LoadingButton';

// Tab labels + ordering for the setting groups returned by the API.
const GROUP_META = {
  site_identity: { label: 'Site Identity', order: 1 },
  localization: { label: 'Localization', order: 2 },
  financial_defaults: { label: 'Financial Defaults', order: 3 },
  notifications: { label: 'Notifications', order: 4 },
  email: { label: 'Email (SMTP)', order: 5 },
};

// Optional dropdowns for known enum-like keys (otherwise rendered as inputs).
const SELECT_OPTIONS = {
  locale: [
    { value: 'en', label: 'English' },
    { value: 'bn', label: 'বাংলা (Bangla)' },
  ],
  fiscal_year_start_month: Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2000, i, 1).toLocaleString('en', { month: 'long' }),
  })),
  mail_mailer: [
    { value: 'smtp', label: 'SMTP' },
    { value: 'log', label: 'Log (testing only)' },
  ],
  mail_encryption: [
    { value: 'tls', label: 'TLS' },
    { value: 'ssl', label: 'SSL' },
    { value: 'none', label: 'None' },
  ],
};

const humanize = (key) =>
  String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const GeneralSettings = () => {
  const { hasPermission } = useAuth();
  const canView = hasPermission('general.settings.view');
  const canUpdate = hasPermission('general.settings.update');

  const [groups, setGroups] = useState({}); // { group: [ {key,value,type,group} ] }
  const [values, setValues] = useState({}); // scalar key -> value
  const [files, setFiles] = useState({}); // image key -> File
  const [previews, setPreviews] = useState({}); // image key -> url
  const [activeTab, setActiveTab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testAddr, setTestAddr] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (canView) fetchSettings();
  }, []);

  const tabs = useMemo(() => {
    return Object.keys(groups).sort(
      (a, b) => (GROUP_META[a]?.order ?? 99) - (GROUP_META[b]?.order ?? 99)
    );
  }, [groups]);

  const hydrate = (grouped) => {
    const nextValues = {};
    const nextPreviews = {};
    Object.values(grouped).forEach((items) => {
      items.forEach((item) => {
        if (item.type === 'image') {
          nextPreviews[item.key] = item.value || null;
        } else if (item.type === 'boolean') {
          nextValues[item.key] = !!item.value;
        } else {
          nextValues[item.key] = item.value ?? '';
        }
      });
    });
    setGroups(grouped);
    setValues(nextValues);
    setPreviews(nextPreviews);
    setFiles({});
    setActiveTab((prev) => prev ?? Object.keys(grouped).sort(
      (a, b) => (GROUP_META[a]?.order ?? 99) - (GROUP_META[b]?.order ?? 99)
    )[0] ?? null);
  };

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/general-settings');
      hydrate(res.data?.data || {});
    } catch (err) {
      Swal.fire({ position: 'top-end', icon: 'error', title: err.response?.data?.message || 'Failed to load settings', showConfirmButton: false, timer: 2000, toast: true });
    } finally {
      setLoading(false);
    }
  };

  const handleScalarChange = (key, type) => (e) => {
    const v = type === 'boolean' ? e.target.checked : e.target.value;
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  const handleFileChange = (key) => (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFiles((prev) => ({ ...prev, [key]: file }));
    setPreviews((prev) => ({ ...prev, [key]: URL.createObjectURL(file) }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!canUpdate) return;
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        const out = typeof value === 'boolean' ? (value ? '1' : '0') : (value ?? '');
        fd.append(`settings[${key}]`, out);
      });
      Object.entries(files).forEach(([key, file]) => {
        if (file) fd.append(key, file);
      });

      const res = await api.post('/general-settings', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      hydrate(res.data?.data || {});
      Swal.fire({ position: 'top-end', icon: 'success', title: 'Settings saved', showConfirmButton: false, timer: 1400, toast: true });
    } catch (err) {
      if (err.response?.data?.errors) {
        const firstError = Object.values(err.response.data.errors)[0][0];
        Swal.fire({ position: 'top-end', icon: 'error', title: firstError, showConfirmButton: false, timer: 2500, toast: true });
      } else {
        Swal.fire({ position: 'top-end', icon: 'error', title: err.response?.data?.message || 'Save failed', showConfirmButton: false, timer: 2500, toast: true });
      }
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testAddr) {
      Swal.fire({ position: 'top-end', icon: 'warning', title: 'Enter an email address to test', showConfirmButton: false, timer: 2000, toast: true });
      return;
    }
    setTesting(true);
    try {
      const res = await api.post('/general-settings/test-email', { email: testAddr });
      Swal.fire({ position: 'top-end', icon: 'success', title: res.data?.message || 'Test email sent', showConfirmButton: false, timer: 2500, toast: true });
    } catch (err) {
      const msg = err.response?.data?.errors?.email?.[0] || err.response?.data?.message || 'Failed to send test email';
      Swal.fire({ position: 'top-end', icon: 'error', title: msg, showConfirmButton: false, timer: 3500, toast: true });
    } finally {
      setTesting(false);
    }
  };

  const renderField = (item) => {
    const { key, type } = item;
    const label = humanize(key);

    if (type === 'image') {
      return (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <div className="flex items-center gap-4 mt-1">
            {previews[key] ? (
              <img src={previews[key]} alt={label} className="object-contain w-16 h-16 bg-gray-50 rounded border" />
            ) : (
              <div className="flex justify-center items-center w-16 h-16 text-xs text-gray-400 bg-gray-50 rounded border">None</div>
            )}
            <input
              type="file"
              accept="image/*"
              disabled={!canUpdate}
              onChange={handleFileChange(key)}
              className="text-sm"
            />
          </div>
        </div>
      );
    }

    if (type === 'boolean') {
      return (
        <div key={key} className="flex justify-between items-center py-1">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <input
            type="checkbox"
            checked={!!values[key]}
            disabled={!canUpdate}
            onChange={handleScalarChange(key, type)}
            className="w-5 h-5"
          />
        </div>
      );
    }

    if (SELECT_OPTIONS[key]) {
      return (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <select
            value={values[key] ?? ''}
            disabled={!canUpdate}
            onChange={handleScalarChange(key, type)}
            className="px-3 py-2 mt-1 w-full rounded-md border border-gray-300"
          >
            {SELECT_OPTIONS[key].map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );
    }

    if (type === 'password') {
      return (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Leave blank to keep current"
            value={values[key] ?? ''}
            disabled={!canUpdate}
            onChange={handleScalarChange(key, type)}
            className="px-3 py-2 mt-1 w-full rounded-md border border-gray-300"
          />
        </div>
      );
    }

    if (type === 'text') {
      return (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          <textarea
            value={values[key] ?? ''}
            disabled={!canUpdate}
            onChange={handleScalarChange(key, type)}
            rows="3"
            className="px-3 py-2 mt-1 w-full rounded-md border border-gray-300"
          />
        </div>
      );
    }

    return (
      <div key={key}>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input
          type={type === 'number' || type === 'integer' ? 'number' : 'text'}
          step={type === 'number' ? '0.01' : undefined}
          value={values[key] ?? ''}
          disabled={!canUpdate}
          onChange={handleScalarChange(key, type)}
          className="px-3 py-2 mt-1 w-full rounded-md border border-gray-300"
        />
      </div>
    );
  };

  if (!canView) return <div className="py-10 text-center text-red-500">Permission Denied</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">General Settings</h2>
      </div>

      {loading ? (
        <div className="py-10 text-center text-gray-500">Loading...</div>
      ) : tabs.length === 0 ? (
        <div className="py-10 text-center text-gray-500">No settings found.</div>
      ) : (
        <form onSubmit={submit} className="overflow-hidden bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-200">
            {tabs.map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => setActiveTab(g)}
                className={`whitespace-nowrap px-5 py-3 text-sm font-medium border-b-2 ${
                  activeTab === g
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {GROUP_META[g]?.label || humanize(g)}
              </button>
            ))}
          </div>

          {/* Active tab fields */}
          <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
            {(groups[activeTab] || []).map((item) => (
              <div key={item.key} className={item.type === 'text' ? 'md:col-span-2' : ''}>
                {renderField(item)}
              </div>
            ))}
          </div>

          {/* Test email panel (email tab only) */}
          {activeTab === 'email' && canUpdate && (
            <div className="px-6 pb-6">
              <div className="p-4 rounded-lg border border-blue-100 bg-blue-50">
                <h4 className="text-sm font-semibold text-blue-900">Test your configuration</h4>
                <p className="mt-1 mb-3 text-xs text-blue-700">
                  Save your SMTP settings first, then send a test email to confirm they work.
                </p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="email"
                    value={testAddr}
                    onChange={(e) => setTestAddr(e.target.value)}
                    placeholder="recipient@example.com"
                    className="flex-1 px-3 py-2 rounded-md border border-gray-300"
                  />
                  <LoadingButton
                    type="button"
                    isLoading={testing}
                    loadingText="Sending..."
                    onClick={sendTestEmail}
                    className="px-5 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Send Test Email
                  </LoadingButton>
                </div>
              </div>
            </div>
          )}

          {canUpdate && (
            <div className="flex justify-end px-6 py-3 bg-gray-50 border-t">
              <LoadingButton
                type="submit"
                isLoading={saving}
                loadingText="Saving..."
                className="px-5 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Save Settings
              </LoadingButton>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default GeneralSettings;
