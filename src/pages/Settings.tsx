import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Bell, Moon, Sun, Sliders, FileText, Shield, Save,
  Monitor, Palette,
} from 'lucide-react';
import type { ThemeMode } from '@/types';
import { useThemeStore } from '@/store/themeStore';

function ThemeSection() {
  const { theme, setTheme, resolvedTheme } = useThemeStore();

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold">Theme Settings</h2>
      <p className="text-sm text-text-secondary mb-4">
        Current mode: <span className="font-semibold text-text-primary capitalize">{resolvedTheme}</span>
        {theme === 'system' && <span className="text-text-tertiary"> (system)</span>}
      </p>
      <div className="grid grid-cols-3 gap-3">
        {([
          { id: 'light' as ThemeMode, icon: Sun, label: 'Light', desc: 'Light mode' },
          { id: 'dark' as ThemeMode, icon: Moon, label: 'Dark', desc: 'Dark mode' },
          { id: 'system' as ThemeMode, icon: Monitor, label: 'System', desc: 'Follow system' },
        ]).map(({ id, icon: Icon, label, desc }) => (
          <button
            key={id}
            onClick={() => setTheme(id)}
            className={`p-6 rounded-xl border-2 text-center transition-all ${
              theme === id
                ? 'border-medical-500 bg-medical-50 shadow-md'
                : 'border-border hover:border-medical-300 hover:bg-gray-50'
            }`}
          >
            <div className={`w-16 h-10 rounded-lg mx-auto mb-3 flex items-center justify-center ${
              id === 'light' ? 'bg-white border border-border' :
              id === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-r from-white to-gray-900 border border-border'
            }`}>
              <Icon size={16} className={id === 'light' ? 'text-amber-500' : id === 'dark' ? 'text-blue-400' : 'text-text-tertiary'} />
            </div>
            <p className={`text-sm font-semibold capitalize ${theme === id ? 'text-medical-700' : 'text-text-primary'}`}>{label}</p>
            <p className="text-xs text-text-tertiary mt-0.5">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

const sections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'theme', label: 'Theme', icon: Palette },
  { id: 'thresholds', label: 'Model Thresholds', icon: Sliders },
  { id: 'reports', label: 'Report Settings', icon: FileText },
  { id: 'security', label: 'Security', icon: Shield },
];

export function Settings() {
  const [activeSection, setActiveSection] = useState('profile');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-secondary mt-1">Manage your account, preferences, and system configuration</p>
      </motion.div>

      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="medical-card p-2 h-fit"
        >
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeSection === section.id
                  ? 'bg-medical-500 text-white'
                  : 'text-text-secondary hover:bg-gray-50'
              }`}
            >
              <section.icon size={16} />
              {section.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="medical-card p-6 space-y-6"
        >
          {/* Profile */}
          {activeSection === 'profile' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold">Profile Settings</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name</label>
                  <input type="text" defaultValue="Dr. Aarav Sharma" className="input-field" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" defaultValue="dr.sharma@neuroscan.ai" className="input-field" />
                </div>
                <div>
                  <label className="label">Hospital / Institution</label>
                  <input type="text" defaultValue="All India Institute of Medical Sciences" className="input-field" />
                </div>
                <div>
                  <label className="label">Specialization</label>
                  <input type="text" defaultValue="Neurology" className="input-field" />
                </div>
                <div>
                  <label className="label">License Number</label>
                  <input type="text" defaultValue="MCI-2021-45892" className="input-field" />
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold">Notification Preferences</h2>
              <div className="space-y-3">
                {[
                  { label: 'Email Alerts', desc: 'Receive email notifications for completed analyses' },
                  { label: 'Critical Results', desc: 'Immediate notification for high-risk predictions' },
                  { label: 'Weekly Digest', desc: 'Weekly summary of platform activity' },
                  { label: 'Report Ready', desc: 'Notification when clinical reports are generated' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                      <p className="text-xs text-text-tertiary">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-medical-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-medical-500" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Theme */}
          {activeSection === 'theme' && (
            <ThemeSection />
          )}

          {/* Model Thresholds */}
          {activeSection === 'thresholds' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold">Model Threshold Settings</h2>
              <div className="space-y-4">
                {[
                  { label: 'Confidence Threshold', desc: 'Minimum confidence for predictions (default: 0.85)', value: 0.85, min: 0.5, max: 0.99, step: 0.01 },
                  { label: 'High Risk Threshold', desc: 'Probability threshold for high-risk classification', value: 0.75, min: 0.5, max: 0.95, step: 0.01 },
                  { label: 'Mild Risk Threshold', desc: 'Probability threshold for mild-risk classification', value: 0.50, min: 0.25, max: 0.75, step: 0.01 },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                        <p className="text-xs text-text-tertiary">{item.desc}</p>
                      </div>
                      <span className="text-sm font-bold text-medical-600">{item.value}</span>
                    </div>
                    <input
                      type="range"
                      min={item.min}
                      max={item.max}
                      step={item.step}
                      defaultValue={item.value}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-medical-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report Settings */}
          {activeSection === 'reports' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold">Report Generation Settings</h2>
              <div className="space-y-3">
                {[
                  { label: 'Include Grad-CAM', desc: 'Include explainability heatmaps in reports' },
                  { label: 'Include SHAP Analysis', desc: 'Include feature importance analysis' },
                  { label: 'Include Recommendations', desc: 'Include AI-generated clinical recommendations' },
                  { label: 'Auto-Generate Reports', desc: 'Automatically generate reports after analysis' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                      <p className="text-xs text-text-tertiary">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-medical-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-medical-500" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security */}
          {activeSection === 'security' && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold">Security Settings</h2>
              <div className="space-y-3">
                {[
                  { label: 'Two-Factor Authentication', desc: 'Add an extra layer of security to your account' },
                  { label: 'Audit Logging', desc: 'Log all system actions for compliance' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                      <p className="text-xs text-text-tertiary">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked={i === 1} className="sr-only peer" />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-medical-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-medical-500" />
                    </label>
                  </div>
                ))}
                <div className="p-4 rounded-xl bg-gray-50">
                  <label className="label">Session Timeout (minutes)</label>
                  <select className="input-field">
                    <option>15</option>
                    <option>30</option>
                    <option selected>60</option>
                    <option>120</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t border-border">
            <button onClick={handleSave} className="btn-primary">
              {saved ? (
                <>✓ Saved Successfully</>
              ) : (
                <><Save size={16} /> Save Settings</>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
