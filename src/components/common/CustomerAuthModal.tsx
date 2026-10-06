import React, { useState } from 'react';
import { Customer } from '../../types';
import { db } from '../../services/db';
import { CHENNAI_LOCALITIES } from '../../data/services';
import { maskPhoneNumber } from '../../services/privacy';
import {
  User,
  Phone,
  MapPin,
  Building,
  Mail,
  CheckCircle2,
  X,
  ArrowRight,
  UserPlus,
  LogIn,
  LogOut,
  AlertCircle,
} from 'lucide-react';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCustomer: Customer;
  onCustomerChange?: (customer: Customer) => void;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  activeCustomer,
  onCustomerChange,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [phoneInput, setPhoneInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Registration form fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regLocality, setRegLocality] = useState(CHENNAI_LOCALITIES[0]);
  const [regApartment, setRegApartment] = useState('');
  const [regBlock, setRegBlock] = useState('Block A');
  const [regFlat, setRegFlat] = useState('');

  if (!isOpen) return null;

  const handlePhoneLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const clean = phoneInput.trim();
    if (!clean) {
      setError('Please enter a valid mobile number');
      return;
    }

    const state = db.getState();
    // Normalize and match by digits
    const cleanDigits = clean.replace(/\D/g, '');
    const found = state.customers.find((c) => {
      const cDigits = c.phone.replace(/\D/g, '');
      return cDigits.endsWith(cleanDigits) || cleanDigits.endsWith(cDigits);
    });

    if (found) {
      // Existing user -> Login directly!
      db.setActiveCustomerId(found.id);
      if (onCustomerChange) onCustomerChange(found);
      setSuccessMessage(`Welcome back, ${found.name}! Your saved profile & orders are loaded.`);
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1200);
    } else {
      // New phone number -> Transition to registration mode
      setMode('register');
      setError('No account found for this phone number. Create your account in 30 seconds.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!regName.trim()) {
      setError('Please provide your name');
      return;
    }
    if (!phoneInput.trim()) {
      setError('Please provide your mobile number');
      return;
    }

    const formattedPhone = phoneInput.trim().startsWith('+91')
      ? phoneInput.trim()
      : `+91 ${phoneInput.trim()}`;

    try {
      const newCustomer = db.registerCustomer({
        name: regName.trim(),
        phone: formattedPhone,
        email: regEmail.trim() || `${regName.toLowerCase().replace(/\s+/g, '')}.demo@zuno.example`,
        locality: regLocality,
        apartmentName: regApartment.trim() || 'ZUNO Residency',
        block: regBlock.trim() || 'Block A',
        flat: regFlat.trim() || '101',
        preferredLanguage: 'English / Tamil',
        preferences: {
          dietary: 'South Indian homestyle',
          elderFriendly: true,
          kidsFriendly: true,
        },
      });

      if (onCustomerChange) onCustomerChange(newCustomer);
      setSuccessMessage(`Account created successfully! Welcome to ZUNO, ${newCustomer.name}.`);
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Unable to create account. Please use Customer Sign In if this phone is already registered.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900 font-display">
                {mode === 'login' ? 'Customer Sign In' : 'New Customer Registration'}
              </div>
              <div className="text-xs text-stone-500">
                {mode === 'login'
                  ? 'Enter phone number to access your orders'
                  : 'Register once to book helpers anytime'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Account Card */}
        <div className="px-5 pt-3 pb-1">
          <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-600 text-white font-bold flex items-center justify-center font-display">
                {activeCustomer.name.split(' ')[0][0]}
              </div>
              <div>
                <div className="font-bold text-stone-900 flex items-center gap-1.5">
                  <span>{activeCustomer.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                    Active
                  </span>
                </div>
                <div className="text-[11px] text-stone-500">
                  {maskPhoneNumber(activeCustomer.phone)} · {activeCustomer.apartmentName}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Form */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handlePhoneLookup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                  Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500 font-semibold">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="98405 12099 or 90000 00001"
                    className="w-full pl-12 pr-3 py-3 rounded-xl border border-stone-300 font-mono text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="text-[10px] text-stone-500">
                  Demo Accounts: <span className="font-mono font-bold text-stone-700">9840512099</span> (Kartik) or <span className="font-mono font-bold text-stone-700">9790865432</span> (Deepa)
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Continue / Look Up Account</span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('register');
                  }}
                  className="text-xs text-orange-600 hover:underline font-bold"
                >
                  New to ZUNO? Register your profile &rarr;
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700">Full Name *</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Ananya"
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-700">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+91 90000 00001"
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700">Chennai Locality</label>
                  <select
                    value={regLocality}
                    onChange={(e) => setRegLocality(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  >
                    {CHENNAI_LOCALITIES.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700">Apartment / Society</label>
                  <input
                    type="text"
                    value={regApartment}
                    onChange={(e) => setRegApartment(e.target.value)}
                    placeholder="e.g. ZUNO Residency"
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700">Block / Tower</label>
                  <input
                    type="text"
                    value={regBlock}
                    onChange={(e) => setRegBlock(e.target.value)}
                    placeholder="e.g. Block A"
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700">Flat / Door No</label>
                  <input
                    type="text"
                    value={regFlat}
                    onChange={(e) => setRegFlat(e.target.value)}
                    placeholder="e.g. 402"
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Account & Continue</span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMode('login');
                  }}
                  className="text-xs text-stone-600 hover:underline"
                >
                  Already have an account? Sign In &rarr;
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
