import React from 'react';
import { Customer, Helper } from '../../types';
import { CHENNAI_LOCALITIES } from '../../data/services';
import { Sparkles, Shield, ShieldCheck, User, HeartHandshake, Compass, RotateCcw, Smartphone } from 'lucide-react';

interface HeaderProps {
  currentRole: 'customer' | 'mobile_customer' | 'helper' | 'admin' | 'demo';
  onRoleChange: (role: 'customer' | 'mobile_customer' | 'helper' | 'admin' | 'demo') => void;
  activeCustomer: Customer;
  activeHelper: Helper;
  onResetDemo: () => void;
  onOpenPrivacy?: () => void;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  activeCustomer,
  activeHelper,
  onResetDemo,
  onOpenPrivacy,
  onOpenAuth,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Brand Zone: Clean single-element wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onRoleChange('customer')}
            className="flex items-baseline gap-2 text-left group focus:outline-none"
          >
            <span className="text-2xl font-black tracking-tight text-orange-600 font-display">
              ZUNO
            </span>
            <span className="hidden sm:inline text-xs font-medium text-stone-500 tracking-tight">
              Your extra pair of hands.
            </span>
          </button>

          {/* Location indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Chennai Pilot</span>
            <span className="text-stone-300">·</span>
            <span className="font-semibold text-stone-700">{activeCustomer.locality}</span>
          </div>
        </div>

        {/* Role Switcher Contract: Segmented button controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center p-0.5 bg-stone-100 rounded-lg text-xs font-medium">
            <button
              onClick={() => onRoleChange('customer')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all ${
                currentRole === 'customer'
                  ? 'bg-white text-orange-600 shadow-sm font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Customer</span>
            </button>

            <button
              onClick={() => onRoleChange('mobile_customer')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all ${
                currentRole === 'mobile_customer'
                  ? 'bg-purple-900 text-white shadow-sm font-semibold'
                  : 'text-purple-900 hover:bg-purple-50'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-coral-500" />
              <span>Mobile App (ZUNO)</span>
            </button>

            <button
              onClick={() => onRoleChange('helper')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all ${
                currentRole === 'helper'
                  ? 'bg-white text-emerald-600 shadow-sm font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Helper App</span>
            </button>

            <button
              onClick={() => onRoleChange('admin')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all ${
                currentRole === 'admin'
                  ? 'bg-white text-stone-900 shadow-sm font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Tower</span>
            </button>
          </div>

          {/* Demo walkthrough toggle */}
          <button
            onClick={() => onRoleChange('demo')}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              currentRole === 'demo'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Interactive Demo</span>
          </button>

          {/* Customer Account / Login Switcher */}
          {onOpenAuth && (
            <button
              onClick={onOpenAuth}
              title={`Logged in as ${activeCustomer.name} (${activeCustomer.phone}). Click to switch or register.`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-stone-800 bg-orange-50 border border-orange-200 hover:bg-orange-100 transition-colors shadow-2xs"
            >
              <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] font-black">
                {activeCustomer.name.split(' ')[0][0]}
              </span>
              <span className="hidden md:inline">{activeCustomer.name.split(' ')[0]}</span>
            </button>
          )}

          {/* Privacy controls toggle */}
          {onOpenPrivacy && (
            <button
              onClick={onOpenPrivacy}
              title="Privacy Notice & DPDP Controls"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Privacy</span>
            </button>
          )}

          {/* Reset state button */}
          <button
            onClick={() => {
              if (window.confirm('Reset all bookings and helpers back to Chennai pilot demo state?')) {
                onResetDemo();
              }
            }}
            title="Reset to Chennai Demo Data"
            className="p-1.5 text-stone-400 hover:text-stone-600 rounded-md hover:bg-stone-100 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
