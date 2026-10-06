/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { db } from './services/db';
import { Booking, ServiceCategory } from './types';
import { Header } from './components/common/Header';
import { ZunoApp } from './components/mobile/ZunoApp';
import { CustomerHome } from './components/customer/CustomerHome';
import { BuildMyVisitModal } from './components/customer/BuildMyVisitModal';
import { NeedHelpNowModal } from './components/customer/NeedHelpNowModal';
import { ActiveBookingModal } from './components/customer/ActiveBookingModal';
import { SupportTicketModal } from './components/customer/SupportTicketModal';
import { PrivacyNoticeModal } from './components/common/PrivacyNoticeModal';
import { HelperPortal } from './components/helper/HelperPortal';
import { AdminControlTower } from './components/admin/AdminControlTower';
import { DemoScenarioTour } from './components/demo/DemoScenarioTour';

export default function App() {
  // Sync with reactive marketplace state
  const state = useSyncExternalStore(db.subscribe, db.getState);

  // Active role view: 'customer' | 'mobile_customer' | 'helper' | 'admin' | 'demo'
  const [currentRole, setCurrentRole] = useState<'customer' | 'mobile_customer' | 'helper' | 'admin' | 'demo'>('customer');

  // Modals state
  const [isBuildVisitOpen, setIsBuildVisitOpen] = useState(false);
  const [buildVisitPreCategory, setBuildVisitPreCategory] = useState<ServiceCategory | undefined>(undefined);
  const [buildVisitPreTaskIds, setBuildVisitPreTaskIds] = useState<string[] | undefined>(undefined);
  const [buildVisitInitialHelperId, setBuildVisitInitialHelperId] = useState<string | undefined>(undefined);

  const [isNeedHelpNowOpen, setIsNeedHelpNowOpen] = useState(false);
  const [isPrivacyNoticeOpen, setIsPrivacyNoticeOpen] = useState(false);
  const [activeBookingModalId, setActiveBookingModalId] = useState<string | null>(null);
  const [supportModalBookingId, setSupportModalBookingId] = useState<string | null>(null);

  const activeCustomer = db.getActiveCustomer();
  const activeHelper = db.getActiveHelper();

  // Active booking for the details modal
  const selectedBooking = state.bookings.find((b) => b.id === activeBookingModalId) || null;
  const selectedBookingHelper = selectedBooking
    ? state.helpers.find((h) => h.id === selectedBooking.helperId)
    : undefined;

  // Handlers
  const handleOpenBuildVisit = (preCategory?: ServiceCategory, preTaskIds?: string[]) => {
    setBuildVisitPreCategory(preCategory);
    setBuildVisitPreTaskIds(preTaskIds);
    setBuildVisitInitialHelperId(undefined);
    setIsBuildVisitOpen(true);
  };

  const handleCloseBuildVisit = () => {
    setIsBuildVisitOpen(false);
    setBuildVisitPreCategory(undefined);
    setBuildVisitPreTaskIds(undefined);
    setBuildVisitInitialHelperId(undefined);
  };

  const handleBookAgain = (previousBooking: Booking) => {
    setBuildVisitPreCategory(undefined);
    setBuildVisitPreTaskIds([...previousBooking.tasks]);
    setBuildVisitInitialHelperId(previousBooking.helperId);
    setIsBuildVisitOpen(true);
  };

  const handleConfirmNewBooking = (newBookingData: any) => {
    const created = db.createBooking(newBookingData);
    // Automatically open the booking tracker so user sees confirmation & OTP
    setActiveBookingModalId(created.id);
  };

  const handleAcceptReplacement = (bookingId: string) => {
    db.acceptReplacement(bookingId);
  };

  const handleSubmitRating = (bookingId: string, ratingData: any) => {
    db.submitRating(bookingId, ratingData);
  };

  const handleToggleFavourite = (helperId: string) => {
    db.toggleFavouriteHelper(activeCustomer.id, helperId);
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col selection:bg-orange-500 selection:text-white">
      {/* 1. Global Navigation Bar with Role Switcher */}
      <Header
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        activeCustomer={activeCustomer}
        activeHelper={activeHelper}
        onResetDemo={() => db.resetToDemoData()}
        onOpenPrivacy={() => setIsPrivacyNoticeOpen(true)}
      />

      {/* 2. Main Role Content */}
      <main className="flex-1 pb-16">
        {currentRole === 'customer' && (
          <CustomerHome
            customer={activeCustomer}
            helpers={state.helpers}
            bookings={state.bookings}
            onOpenBuildVisit={handleOpenBuildVisit}
            onOpenNeedHelpNow={() => setIsNeedHelpNowOpen(true)}
            onBookAgain={handleBookAgain}
            onViewBookingDetails={(id) => setActiveBookingModalId(id)}
            onToggleFavourite={handleToggleFavourite}
          />
        )}

        {currentRole === 'mobile_customer' && (
          <ZunoApp />
        )}

        {currentRole === 'helper' && (
          <HelperPortal
            helper={activeHelper}
            bookings={state.bookings}
            customers={state.customers}
            helpers={state.helpers}
            onSwitchHelper={(helperId) => db.setActiveHelperId(helperId)}
            onUpdateAvailability={(status) => db.updateHelperAvailability(activeHelper.id, status)}
            onVerifyOtp={(bkId, otp) => db.verifyStartOtp(bkId, otp, activeHelper.id)}
            onUpdateBookingStatus={(bkId, status) => db.updateBookingStatus(bkId, status, { actor: 'helper', actorName: activeHelper.name })}
            onCancelWithEmergency={(bkId, reason) => db.cancelByHelper(bkId, activeHelper.id, reason)}
            onRateCustomer={(bkId, rating, feedback) => db.submitHelperRatingForCustomer(bkId, rating, feedback)}
          />
        )}

        {currentRole === 'admin' && (
          <AdminControlTower
            bookings={state.bookings}
            helpers={state.helpers}
            customers={state.customers}
            apartments={state.apartments}
            pricingConfig={state.pricingConfig}
            supportTickets={state.supportTickets}
            auditLogs={state.auditLogs}
            supplyDemand={state.supplyDemand}
            privacyRequests={state.privacyRequests}
            privacyConsents={state.privacyConsents}
            onUpdatePricing={(cfg) => db.updatePricingConfig(cfg)}
            onUpdateVerification={(id, status, checklist, isChildcare) =>
              db.updateHelperVerification(id, status, checklist, isChildcare)
            }
            onUpdateTicketStatus={(id, status, res) => db.updateSupportTicketStatus(id, status, res)}
            onUpdatePrivacyRequest={(id, status, res) => db.updatePrivacyRequestStatus(id, status, res)}
            onImportHelpers={(newH) => db.importHelpers(newH)}
            onImportApartments={(newA) => db.importApartments(newA)}
          />
        )}

        {currentRole === 'demo' && (
          <DemoScenarioTour
            currentRole={currentRole}
            onRoleChange={setCurrentRole}
            onLaunchBuildVisit={() => {
              setCurrentRole('customer');
              handleOpenBuildVisit();
            }}
            onLaunchUrgentHelp={() => {
              setCurrentRole('customer');
              setIsNeedHelpNowOpen(true);
            }}
            onResetDemo={() => db.resetToDemoData()}
          />
        )}
      </main>

      {/* 3. Global Modals */}
      {/* A. Build My Visit Core Flow */}
      <BuildMyVisitModal
        isOpen={isBuildVisitOpen}
        onClose={handleCloseBuildVisit}
        customer={activeCustomer}
        helpers={state.helpers}
        pricingConfig={state.pricingConfig}
        preselectedCategory={buildVisitPreCategory}
        preselectedTaskIds={buildVisitPreTaskIds}
        initialHelperId={buildVisitInitialHelperId}
        onConfirmBooking={handleConfirmNewBooking}
      />

      {/* B. Need Help Now Flow */}
      <NeedHelpNowModal
        isOpen={isNeedHelpNowOpen}
        onClose={() => setIsNeedHelpNowOpen(false)}
        customer={activeCustomer}
        helpers={state.helpers}
        pricingConfig={state.pricingConfig}
        onConfirmUrgentBooking={handleConfirmNewBooking}
      />

      {/* C. Active Booking Details & OTP Lifecycle */}
      <ActiveBookingModal
        booking={selectedBooking}
        onClose={() => setActiveBookingModalId(null)}
        helper={selectedBookingHelper}
        customer={activeCustomer}
        helpers={state.helpers}
        onAcceptReplacement={handleAcceptReplacement}
        onChooseReplacementHelper={(bkId, hId) => db.chooseReplacementHelper(bkId, hId)}
        onSubmitRating={handleSubmitRating}
        onBookAgain={handleBookAgain}
        onOpenSupport={(bkId) => {
          setSupportModalBookingId(bkId);
        }}
        onToggleFavourite={handleToggleFavourite}
      />

      {/* D. Report an Issue / Support Ticket */}
      <SupportTicketModal
        isOpen={!!supportModalBookingId}
        onClose={() => setSupportModalBookingId(null)}
        customer={activeCustomer}
        bookingId={supportModalBookingId || undefined}
        onCreateTicket={(t) => db.createSupportTicket(t)}
      />

      {/* E. Privacy & Personal Data Protection Modal (DPDP) */}
      <PrivacyNoticeModal
        isOpen={isPrivacyNoticeOpen}
        onClose={() => setIsPrivacyNoticeOpen(false)}
        customer={activeCustomer}
      />

      {/* Clean quiet footer */}
      <footer className="border-t border-stone-200 py-4 text-center text-xs text-stone-500 bg-white">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900 font-display">ZUNO</span>
            <span>·</span>
            <span>Your extra pair of hands.</span>
            <span>·</span>
            <button
              onClick={() => setIsPrivacyNoticeOpen(true)}
              className="text-stone-600 hover:text-stone-900 underline font-medium"
            >
              Privacy & DPDP Controls
            </button>
          </div>
          <div>
            Chennai Pilot: Pallavaram · Chromepet · Pammal · Keelkattalai · Medavakkam · Velachery · Tambaram · Perungalathur
          </div>
        </div>
      </footer>
    </div>
  );
}
