// Browser notification utilities for flight reminders

export interface FlightReminderOptions {
  flightNumber: string;
  departure: string;
  origin: string;
  destination: string;
  hoursBeforeFlight: number;
}

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Request permission for notifications
  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission === "denied") {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  // Show a notification
  showNotification(title: string, options: NotificationOptions = {}): Notification | null {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return null;
    }

    const notification = new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });

    // Auto-close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);

    return notification;
  }

  // Schedule a flight reminder
  scheduleFlightReminder(booking: any, hoursBeforeFlight: number = 24): void {
    const flightTime = new Date(booking.flight.departureTime);
    const reminderTime = new Date(flightTime.getTime() - hoursBeforeFlight * 60 * 60 * 1000);
    const now = new Date();

    // Don't schedule if the reminder time has already passed
    if (reminderTime <= now) {
      console.log("Reminder time has already passed for flight", booking.flight.flightNumber);
      return;
    }

    const timeUntilReminder = reminderTime.getTime() - now.getTime();

    // Store reminder in localStorage for persistence
    const reminderId = `flight-reminder-${booking.id}-${hoursBeforeFlight}h`;
    const reminderData = {
      bookingId: booking.id,
      flightNumber: booking.flight.flightNumber,
      departure: flightTime.toISOString(),
      origin: booking.flight.origin.code,
      destination: booking.flight.destination.code,
      hoursBeforeFlight,
      scheduledFor: reminderTime.toISOString(),
    };

    localStorage.setItem(reminderId, JSON.stringify(reminderData));

    // Schedule the notification
    setTimeout(() => {
      this.showFlightReminder(reminderData);
      // Remove from localStorage after showing
      localStorage.removeItem(reminderId);
    }, timeUntilReminder);

    console.log(
      `Flight reminder scheduled for ${reminderTime.toLocaleString()} (${hoursBeforeFlight}h before flight ${
        booking.flight.flightNumber
      })`
    );
  }

  // Show flight reminder notification
  private showFlightReminder(reminderData: any): void {
    const { flightNumber, departure, origin, destination, hoursBeforeFlight } = reminderData;
    const departureTime = new Date(departure);

    const title = `Flight Reminder: ${flightNumber}`;
    const body = `Your flight from ${origin} to ${destination} departs in ${hoursBeforeFlight} hours at ${departureTime.toLocaleTimeString()}`;

    this.showNotification(title, {
      body,
      tag: `flight-${flightNumber}`, // Prevent duplicate notifications
      requireInteraction: true, // Keep notification visible until user interacts
    });
  }

  // Setup reminders for all user bookings
  setupBookingReminders(bookings: any[]): void {
    bookings.forEach((booking) => {
      if (booking.status === "confirmed") {
        // Schedule multiple reminders
        this.scheduleFlightReminder(booking, 24); // 24 hours before
        this.scheduleFlightReminder(booking, 2); // 2 hours before
      }
    });
  }

  // Restore reminders from localStorage on app load
  restoreScheduledReminders(): void {
    const keys = Object.keys(localStorage);
    const reminderKeys = keys.filter((key) => key.startsWith("flight-reminder-"));

    reminderKeys.forEach((key) => {
      try {
        const reminderData = JSON.parse(localStorage.getItem(key) || "");
        const scheduledFor = new Date(reminderData.scheduledFor);
        const now = new Date();

        // Check if reminder time has passed
        if (scheduledFor <= now) {
          // Show immediately if we missed it
          this.showFlightReminder(reminderData);
          localStorage.removeItem(key);
        } else {
          // Reschedule
          const timeUntilReminder = scheduledFor.getTime() - now.getTime();
          setTimeout(() => {
            this.showFlightReminder(reminderData);
            localStorage.removeItem(key);
          }, timeUntilReminder);
        }
      } catch (error) {
        console.error("Error restoring reminder:", error);
        localStorage.removeItem(key);
      }
    });
  }

  // Clear all scheduled reminders for a booking (e.g., when cancelled)
  clearBookingReminders(bookingId: string): void {
    const keys = Object.keys(localStorage);
    const reminderKeys = keys.filter((key) => key.startsWith(`flight-reminder-${bookingId}-`));

    reminderKeys.forEach((key) => {
      localStorage.removeItem(key);
    });
  }
}

export const notificationService = NotificationService.getInstance();
