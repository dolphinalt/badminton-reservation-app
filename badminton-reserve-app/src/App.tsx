import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Header from "./components/Header";
import AvailableTimes from "./components/AvailableTimes";
import BottomNavigation from "./components/BottomNavigation";
import LoginButton from "./components/LoginButton";
import UnauthenticatedView from "./components/UnauthenticatedView";
import { api } from "./utils/api";

function AppContent() {
  const { isAuthenticated, loading, user } = useAuth();
  const [selectedCourt, setSelectedCourt] = useState(1);
  const [userReservations, setUserReservations] = useState<any[]>([]);
  const [allReservations, setAllReservations] = useState<any[]>([]);
  const [hasActiveCourtUsage, setHasActiveCourtUsage] = useState(false);
  const [isCurrentUserUsingAnyCourt, setIsCurrentUserUsingAnyCourt] =
    useState(false);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [courtStatus, setCourtStatus] = useState({
    status: "Open",
    time: null,
    color: "text-green-500",
  });
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    if (isAuthenticated) {
      loadTimeSlots();
      loadCourtUsageStatus();
      loadUserCourtUsageStatus();
      loadCourtStatus(selectedCourt);
      loadUserReservations();
      loadAllReservations();
    }
  }, [isAuthenticated, selectedCourt]);

  // Auto-refresh court status and usage status
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      loadCourtStatus(selectedCourt);
      loadCourtUsageStatus();
      loadUserCourtUsageStatus();
      loadAllReservations();
      loadUserReservations(); // Also refresh user reservations to update activeReservation for selected court
    }, 1000); // Refresh every second

    return () => clearInterval(interval);
  }, [isAuthenticated, selectedCourt]);

  const loadTimeSlots = async () => {
    try {
      setError(null);
      const data = await api.getTimeSlots();
      setAvailableTimes(data.timeSlots.map((slot: any) => slot.time));
    } catch (error: any) {
      console.error("Error loading time slots:", error);
      setError("Failed to load available times");
      // Set default times as fallback
      setAvailableTimes(["2:00 pm", "2:30 pm", "3:00 pm", "3:30 pm"]);
    }
  };

  const loadCourtUsageStatus = async () => {
    try {
      const data = await api.getCourtUsageStatus();
      setHasActiveCourtUsage(data.hasActiveCourtUsage);
    } catch (error) {
      console.error("Error loading court usage status:", error);
    }
  };

  const loadUserCourtUsageStatus = async () => {
    try {
      const data = await api.getUserCourtUsageStatus();
      setIsCurrentUserUsingAnyCourt(data.isCurrentUserUsingAnyCourt);
    } catch (error) {
      console.error("Error loading user court usage status:", error);
    }
  };

  const loadCourtStatus = async (courtId: number) => {
    try {
      const data = await api.getCourtStatus(courtId);

      // Check if court transitioned from "In Use" to "Available" (timer expired)
      const wasInUse = courtStatus.status.includes("In Use");
      const nowAvailable = data.status === "Open";

      if (wasInUse && nowAvailable) {
        console.log(
          "🎯 Court session automatically completed - timer reached 0!"
        );
        // Force immediate refresh of all user states when court session auto-completes
        setTimeout(() => {
          loadUserCourtUsageStatus();
          loadUserReservations();
          loadCourtUsageStatus();
        }, 100);
      }

      setCourtStatus(data);
    } catch (error) {
      console.error("Error loading court status:", error);
      setCourtStatus({ status: "Open", time: null, color: "text-green-500" });
    }
  };

  const loadUserReservations = async () => {
    try {
      const data = await api.getReservations();
      setUserReservations(data.reservations || []);
    } catch (error) {
      console.error("Error loading user reservations:", error);
      setUserReservations([]);
    }
  };

  const loadAllReservations = async () => {
    try {
      const data = await api.getAllReservations();
      setAllReservations(data.reservations || []);
    } catch (error) {
      console.error("Error loading all reservations:", error);
      setAllReservations([]);
    }
  };

  const handleReserve = async (time: string) => {
    try {
      setError(null);

      // If this time slot is already reserved by the current user, cancel it instead
      if (isReserved(time)) {
        const reservation = userReservations.find(
          (res) =>
            res.status === "reserved" &&
            res.court_id === selectedCourt &&
            res.time_slot === time
        );
        if (reservation) {
          await api.cancelReservation(reservation.id);
        }
      } else {
        // Make a new reservation
        await api.makeReservation(selectedCourt, time);
      }

      // Refresh reservations and status
      loadUserReservations();
      loadAllReservations();
      loadCourtUsageStatus();
      loadUserCourtUsageStatus();
    } catch (error: any) {
      console.error("Error handling reservation:", error);
      setError(error.message || "Failed to handle reservation");
    }
  };

  const isReserved = (time: string) => {
    if (!user) return false;

    // Check if the current user has a reservation for this court and time
    return userReservations.some(
      (res: any) =>
        res.court_id === selectedCourt &&
        res.time_slot === time &&
        res.status === "reserved"
    );
  };

  const isReservedByOthers = (time: string) => {
    if (!user) return false;

    return allReservations.some(
      (res: any) =>
        res.court_id === selectedCourt &&
        res.time_slot === time &&
        res.user_id !== user.id // Check if the reservation is NOT by the current user
    );
  };

  const hasActiveReservation = () => {
    return userReservations.some(
      (res) => res.court_id === selectedCourt && res.status === "reserved"
    );
  };

  const canReserve = (time: string) => {
    // Can always click on your own reservations to cancel them
    if (isReserved(time)) {
      return true;
    }

    // Can't reserve if this slot is reserved by another user
    if (isReservedByOthers(time)) {
      return false;
    }

    // Can't make new reservations if user is currently using a court
    if (isCurrentUserUsingAnyCourt) {
      return false;
    }

    // Can't make new reservations if user already has an active reservation
    const hasAnyReservation = userReservations.some(
      (res) => res.status === "reserved"
    );
    if (hasAnyReservation) {
      return false;
    }

    // Can reserve if this specific court/time slot is not already reserved
    return true;
  };

  const startCourtTimer = async () => {
    try {
      setError(null);
      await api.takeCourt(selectedCourt);
      // Refresh status and reservations
      loadCourtStatus(selectedCourt);
      loadCourtUsageStatus();
      loadUserCourtUsageStatus();
      loadUserReservations();
    } catch (error: any) {
      console.error("Error taking court:", error);
      setError(error.message || "Failed to take court");
    }
  };

  const releaseCourtTimer = async () => {
    try {
      setError(null);
      await api.releaseCourt(selectedCourt);
      // Refresh status and reservations
      loadCourtStatus(selectedCourt);
      loadCourtUsageStatus();
      loadUserCourtUsageStatus();
      loadUserReservations();
    } catch (error: any) {
      console.error("Error releasing court:", error);
      setError(error.message || "Failed to release court");
    }
  };

  const isCurrentUserUsingThisCourt = () => {
    // Check if the current court is in use and the user is using any court
    // This is a simplified check - in a real app, we'd want to track which specific court the user is using
    return courtStatus.status.includes("In Use") && isCurrentUserUsingAnyCourt;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <UnauthenticatedView />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header
        selectedCourt={selectedCourt}
        setSelectedCourt={setSelectedCourt}
        courtStatus={courtStatus}
        onTakeCourt={startCourtTimer}
        onReleaseCourt={releaseCourtTimer}
        hasActiveReservation={hasActiveReservation()}
        isCurrentUserUsingAnyCourt={isCurrentUserUsingAnyCourt}
        isCurrentUserUsingThisCourt={isCurrentUserUsingThisCourt()}
      />

      <AvailableTimes
        availableTimes={availableTimes}
        isReserved={isReserved}
        isReservedByOthers={isReservedByOthers}
        handleReserve={handleReserve}
        canReserve={canReserve}
      />

      <BottomNavigation />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
