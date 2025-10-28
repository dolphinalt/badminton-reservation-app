import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import AvailableTimes from "./components/AvailableTimes";
import BottomNavigation from "./components/BottomNavigation";

export default function App() {
  const [selectedCourt, setSelectedCourt] = useState(1);
  // Store single active reservation: { court: number, time: string } or null
  const [activeReservation, setActiveReservation] = useState<{
    court: number;
    time: string;
  } | null>(null);

  // Timer state for each court (in seconds)
  const [timers, setTimers] = useState<{ [key: number]: number | null }>({
    1: null,
    2: null,
    3: null,
  });

  // Timer countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const newTimers = { ...prev };

        // Update each court's timer
        Object.keys(newTimers).forEach((courtKey) => {
          const court = Number(courtKey);
          if (newTimers[court] !== null && newTimers[court]! > 0) {
            newTimers[court] = newTimers[court]! - 1;
          } else if (newTimers[court] === 0) {
            newTimers[court] = null; // Court becomes open when timer reaches 0
          }
        });

        return newTimers;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  // Format seconds to MM:SS
  const formatTime = (seconds: number | null) => {
    if (seconds === null) return null;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Get formatted time for display
  const getCurrentTime = (courtNum: number) => {
    return formatTime(timers[courtNum]);
  };

  const availableTimes = ["2:00 pm", "2:30 pm", "3:00 pm", "3:30 pm"];

  const handleReserve = (time: string) => {
    // Replace any existing reservation with the new one
    setActiveReservation({
      court: selectedCourt,
      time: time,
    });
  };

  const isReserved = (time: string) => {
    // Check if this time slot on this court is the active reservation
    return (
      activeReservation?.court === selectedCourt &&
      activeReservation?.time === time
    );
  };

  const hasActiveReservation = () => {
    return activeReservation !== null;
  };

  const hasActiveCourtUsage = () => {
    // Check if ANY court has an active timer (someone clicked "Take")
    return Object.values(timers).some((timer) => timer !== null);
  };

  const canReserve = (time: string) => {
    // Can't reserve if:
    // 1. Court is currently being used (timer active), OR
    // 2. User has a reservation on a different court
    if (hasActiveCourtUsage()) {
      return false;
    }

    // Can reserve if: no active reservation OR this is the current reservation being changed
    return !hasActiveReservation() || isReserved(time);
  };

  const getCourtStatus = (courtNum: number) => {
    const time = getCurrentTime(courtNum);
    if (time) {
      return { status: "In Use", time: time, color: "text-red-500" };
    }
    return { status: "Open", time: null, color: "text-green-500" };
  };

  // Start timer for a court (when "Take" button is clicked)
  const startCourtTimer = () => {
    // Don't allow taking a court if user already has a reservation
    if (hasActiveReservation()) {
      return;
    }

    // Clear any existing reservation when taking the court immediately
    setActiveReservation(null);

    // Calculate time until next available slot
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Find the next time slot
    let nextSlotMinutes = null;
    for (const timeStr of availableTimes) {
      // Parse time string (e.g., "2:30 pm")
      const [time, period] = timeStr.split(" ");
      const [hours, minutes] = time.split(":").map(Number);
      let slotHours = hours;

      // Convert to 24-hour format
      if (period.toLowerCase() === "pm" && hours !== 12) {
        slotHours += 12;
      } else if (period.toLowerCase() === "am" && hours === 12) {
        slotHours = 0;
      }

      const slotMinutes = slotHours * 60 + minutes;

      // Find next slot after current time
      if (slotMinutes > currentMinutes) {
        nextSlotMinutes = slotMinutes;
        break;
      }
    }

    // Calculate minutes until next slot (default to 30 if no next slot found)
    let minutesUntilNextSlot = 30;
    if (nextSlotMinutes !== null) {
      minutesUntilNextSlot = nextSlotMinutes - currentMinutes;
    }

    setTimers((prev) => ({
      ...prev,
      [selectedCourt]: minutesUntilNextSlot * 60, // Start at n minutes (converted to seconds)
    }));
  };

  const courtStatus = getCourtStatus(selectedCourt);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header
        selectedCourt={selectedCourt}
        setSelectedCourt={setSelectedCourt}
        courtStatus={courtStatus}
        onTakeCourt={startCourtTimer}
        hasActiveReservation={hasActiveReservation()}
      />

      <AvailableTimes
        availableTimes={availableTimes}
        isReserved={isReserved}
        handleReserve={handleReserve}
        canReserve={canReserve}
      />

      <BottomNavigation />
    </div>
  );
}
