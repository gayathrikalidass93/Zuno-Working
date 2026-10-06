/**
 * ZUNO truth-mode QA verification.
 *
 * This suite deliberately uses a fresh synthetic customer and the real seeded
 * Kavitha helper ID. It validates relationships by ID, not by display name.
 *
 * It is intentionally not a browser/E2E test: UI rendering and authentication
 * widgets still require a real browser run.
 */
import { db } from './db';

export function runZunoQASuite(): { name: string; status: 'PASS' | 'FAIL'; details?: string }[] {
  const results: { name: string; status: 'PASS' | 'FAIL'; details?: string }[] = [];

  const pass = (name: string, details: string) => results.push({ name, status: 'PASS', details });
  const fail = (name: string, details: string) => results.push({ name, status: 'FAIL', details });

  try {
    const TEST_PHONE = '+91 90000 00002';
    const TEST_EMAIL = 'customer.kavitha.flow@zuno.example';
    const KAVITHA_ID = 'hlp_kavitha';

    const before = db.getState();
    if (before.customers.some((c) => c.phone.replace(/\D/g, '') === TEST_PHONE.replace(/\D/g, ''))) {
      fail('1. Brand-new synthetic customer registration', 'Test phone already exists; refusing to reuse an existing customer.');
      return results;
    }

    const customer = db.registerCustomer({
      name: 'Test Customer Kavitha Flow',
      phone: TEST_PHONE,
      email: TEST_EMAIL,
      locality: 'Chromepet',
      apartmentName: 'ZUNO Residency',
      block: 'A',
      flat: '402',
      preferredLanguage: 'English / Tamil',
      preferences: { dietary: 'South Indian homestyle' },
    });

    if (!customer.id || customer.id === 'cust_kartik' || customer.name !== 'Test Customer Kavitha Flow') {
      fail('1. Brand-new synthetic customer registration', `Unexpected customer identity: ${customer.id} / ${customer.name}`);
      return results;
    }
    pass('1. Brand-new synthetic customer registration', `customerId=${customer.id}, profileId=${customer.id}, name=${customer.name}, phone=${customer.phone}`);

    db.setActiveCustomerId(customer.id);
    const loggedInCustomer = db.getActiveCustomer();
    if (loggedInCustomer.id !== customer.id || loggedInCustomer.phone !== TEST_PHONE) {
      fail('2. Customer session identity', `loggedInCustomerId=${loggedInCustomer.id}`);
      return results;
    }
    pass('2. Customer session identity', `loggedInCustomerId=${loggedInCustomer.id}`);

    const kavitha = db.getHelper(KAVITHA_ID);
    if (!kavitha || kavitha.id !== KAVITHA_ID || kavitha.name !== 'Kavitha Murugesan') {
      fail('3. Actual Kavitha helper identity', 'hlp_kavitha was not found or does not resolve to Kavitha Murugesan.');
      return results;
    }
    pass('3. Actual Kavitha helper identity', `helperId=${kavitha.id}, helperName=${kavitha.name}`);

    const booking = db.createBooking({
      customerId: customer.id,
      helperId: kavitha.id,
      status: 'confirmed',
      tasks: ['clean_kitchen'],
      scheduledDate: '2026-10-12',
      scheduledSlot: '10:00 AM - 12:00 PM',
      durationHours: 2,
      estimatedWorkloadMinutes: 120,
      bookingMode: 'choose_helper',
      isUrgent: false,
      locality: 'Chromepet',
      apartmentName: 'ZUNO Residency',
      block: 'A',
      flat: '402',
      customerNotes: 'Kitchen cleaning',
      pricing: {
        baseHourlyRate: kavitha.hourlyRate || 249,
        durationHours: 2,
        baseAmount: (kavitha.hourlyRate || 249) * 2,
        taskComplexityAdjustment: 0,
        urgentFee: 0,
        weekendFee: 0,
        multiTaskDiscount: 0,
        subtotal: (kavitha.hourlyRate || 249) * 2,
        zunoFee: 0,
        helperPayout: (kavitha.hourlyPayout || 0) * 2,
        totalAmount: (kavitha.hourlyRate || 249) * 2,
      },
    });

    if (
      !booking.id ||
      booking.customerId !== customer.id ||
      booking.helperId !== kavitha.id ||
      booking.locality !== 'Chromepet' ||
      booking.apartmentName !== 'ZUNO Residency' ||
      booking.block !== 'A' ||
      booking.flat !== '402'
    ) {
      fail('4. Booking relationship integrity', `bookingId=${booking.id}, customerId=${booking.customerId}, helperId=${booking.helperId}`);
      return results;
    }
    pass(
      '4. Booking relationship integrity',
      `bookingId=${booking.id}, customerId=${booking.customerId}, helperId=${booking.helperId}, task=${booking.tasks[0]}, date=${booking.scheduledDate}, slot=${booking.scheduledSlot}`
    );

    const customerView = db.getState().bookings.find((b) => b.id === booking.id && b.customerId === customer.id);
    const customerViewHelper = customerView?.helperId
      ? db.getHelper(customerView.helperId)
      : undefined;
    if (!customerView || customerViewHelper?.id !== KAVITHA_ID || customerViewHelper.name !== 'Kavitha Murugesan') {
      fail('5. Customer resolves booking helper by ID', 'Customer booking did not resolve to hlp_kavitha.');
    } else {
      pass('5. Customer resolves booking helper by ID', `bookingId=${customerView.id}, helperId=${customerViewHelper.id}, helperName=${customerViewHelper.name}`);
    }

    const customerBookingSerialized = JSON.stringify(customerView || {});
    if (customerBookingSerialized.includes(kavitha.phone) || customerBookingSerialized.includes(kavitha.emergencyContact)) {
      fail('6. Customer privacy boundary', 'Booking record exposed helper private phone/emergency contact.');
    } else {
      pass('6. Customer privacy boundary', 'Booking stores helperId only; helper private phone/emergency contact are not copied into the booking.');
    }

    // Simulate helper login using the real helper ID, without creating another booking.
    db.setActiveHelperId(kavitha.id);
    const loggedInHelper = db.getActiveHelper();
    const helperBooking = db.getState().bookings.find((b) => b.id === booking.id && b.helperId === loggedInHelper.id);
    if (loggedInHelper.id !== KAVITHA_ID || !helperBooking || helperBooking.id !== booking.id) {
      fail('7. Helper session sees exact existing booking', `loggedInHelperId=${loggedInHelper.id}, booking=${helperBooking?.id || 'none'}`);
    } else {
      pass('7. Helper session sees exact existing booking', `loggedInHelperId=${loggedInHelper.id}, bookingId=${helperBooking.id}, customerId=${helperBooking.customerId}`);
    }

    // Accept/advance the existing booking; never create a replacement booking.
    db.updateBookingStatus(booking.id, 'helper_assigned', {
      actor: 'helper',
      actorName: loggedInHelper.name,
    });
    const accepted = db.getState().bookings.find((b) => b.id === booking.id);
    if (!accepted || accepted.id !== booking.id || accepted.helperId !== KAVITHA_ID || accepted.customerId !== customer.id) {
      fail('8. Helper accepts existing booking without duplication', 'Existing booking relationship changed or booking identity changed.');
    } else {
      pass('8. Helper accepts existing booking without duplication', `same bookingId=${accepted.id}, status=${accepted.status}`);
    }

    // Regression: Kavitha -> On the way must preserve Kavitha's ID.
    db.updateBookingStatus(booking.id, 'on_the_way', {
      actor: 'helper',
      actorName: loggedInHelper.name,
    });
    const onTheWay = db.getState().bookings.find((b) => b.id === booking.id);
    const resolvedOnTheWayHelper = onTheWay?.helperId ? db.getHelper(onTheWay.helperId) : undefined;
    if (
      !onTheWay ||
      onTheWay.helperId !== KAVITHA_ID ||
      resolvedOnTheWayHelper?.id !== KAVITHA_ID ||
      resolvedOnTheWayHelper.name !== 'Kavitha Murugesan'
    ) {
      fail('9. Kavitha -> On the way regression', `helperId=${onTheWay?.helperId || 'missing'}, resolvedHelper=${resolvedOnTheWayHelper?.name || 'missing'}`);
    } else {
      pass('9. Kavitha -> On the way regression', 'Status changed to on_the_way while preserving helperId=hlp_kavitha.');
    }

    // Customer session returns to the same booking.
    db.setActiveCustomerId(customer.id);
    const returnedCustomer = db.getActiveCustomer();
    const returnedBooking = db.getState().bookings.find((b) => b.id === booking.id && b.customerId === returnedCustomer.id);
    if (!returnedBooking || returnedBooking.helperId !== KAVITHA_ID || returnedBooking.status !== 'on_the_way') {
      fail('10. Customer sees same booking after helper update', 'Customer did not see the exact booking/helper/status after helper action.');
    } else {
      pass('10. Customer sees same booking after helper update', `bookingId=${returnedBooking.id}, helperId=${returnedBooking.helperId}, status=${returnedBooking.status}`);
    }

    // Admin truth check: same booking, same customer, same helper.
    const adminBooking = db.getState().bookings.find((b) => b.id === booking.id);
    const adminCustomer = adminBooking ? db.getCustomer(adminBooking.customerId) : undefined;
    const adminHelper = adminBooking?.helperId ? db.getHelper(adminBooking.helperId) : undefined;
    if (
      !adminBooking ||
      adminBooking.id !== booking.id ||
      adminBooking.customerId !== customer.id ||
      adminBooking.helperId !== KAVITHA_ID ||
      adminCustomer?.id !== customer.id ||
      adminHelper?.id !== KAVITHA_ID
    ) {
      fail('11. Admin sees exact shared booking relationship', 'Admin-side ID resolution mismatch.');
    } else {
      pass('11. Admin sees exact shared booking relationship', `bookingId=${adminBooking.id}, customerId=${adminBooking.customerId}, helperId=${adminBooking.helperId}`);
    }

    // No second booking was created during helper acceptance/status transitions.
    const sameCustomerBookings = db.getState().bookings.filter((b) => b.customerId === customer.id);
    if (sameCustomerBookings.length !== 1 || sameCustomerBookings[0].id !== booking.id) {
      fail('12. No duplicate booking across role changes', `customer has ${sameCustomerBookings.length} booking(s)`);
    } else {
      pass('12. No duplicate booking across role changes', `exactly one booking remains: ${booking.id}`);
    }

    return results;
  } catch (err: any) {
    fail('QA execution exception', err?.message || String(err));
    return results;
  }
}
