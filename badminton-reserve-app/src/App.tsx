import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Header from "./components/Header";
import AvailableTimes from "./components/AvailableTimes";
import BottomNavigation from "./components/BottomNavigation";
import LoginButton from "./components/LoginButton";
import UnauthenticatedView from "./components/UnauthenticatedView";
import { api } from "./utils/api";

function AppContent() {
  const { isAuthenticated, loading } = useAuth();
  const [selectedCourt, setSelectedCourt] = useState(1);
  const [activeReservation, setActiveReservation] = useState<{
    court: number;
    time: string;
  } | null>(null);
  const [hasActiveCourtUsage, setHasActiveCourtUsage] = useState(false);
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
      loadCourtStatus(selectedCourt);
    }
  }, [isAuthenticated, selectedCourt]);

  // Auto-refresh court status and usage status
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      loadCourtStatus(selectedCourt);
      loadCourtUsageStatus();
    }, 5000); // Refresh every 5 seconds

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

  const loadCourtStatus = async (courtId: number) => {
    try {
      const data = await api.getCourtStatus(courtId);
      setCourtStatus(data);
    } catch (error) {
      console.error("Error loading court status:", error);
      setCourtStatus({ status: "Open", time: null, color: "text-green-500" });
    }
  };

  const handleReserve = async (time: string) => {
    try {
      setError(null);
      await api.makeReservation(selectedCourt, time);
      setActiveReservation({ court: selectedCourt, time });
      // Refresh status
      loadCourtUsageStatus();
    } catch (error: any) {
      console.error("Error making reservation:", error);
      setError(error.message || "Failed to make reservation");
    }
  };

  const isReserved = (time: string) => {
    return (
      activeReservation?.court === selectedCourt &&
      activeReservation?.time === time
    );
  };

  const hasActiveReservation = () => {
    return activeReservation !== null;
  };

  const canReserve = (time: string) => {
    // Can't reserve if any court is being used
    if (hasActiveCourtUsage) {
      return false;
    }

    // Can reserve if: no active reservation OR this is the current reservation being changed
    return !hasActiveReservation() || isReserved(time);
  };

  const startCourtTimer = async () => {
    try {
      setError(null);
      await api.takeCourt(selectedCourt);
      // Clear any existing reservation
      setActiveReservation(null);
      // Refresh status
      loadCourtStatus(selectedCourt);
      loadCourtUsageStatus();
    } catch (error: any) {
      console.error("Error taking court:", error);
      setError(error.message || "Failed to take court");
    }
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
      {/* User info header */}
      <div className="bg-white px-6 pt-4 pb-2 flex justify-between items-center border-b">
        <div className="text-sm text-gray-600">
          Welcome back!{" "}
          {error && <span className="text-red-500 ml-2">{error}</span>}
        </div>
        <LoginButton />
      </div>

      <Header
        selectedCourt={selectedCourt}
        setSelectedCourt={setSelectedCourt}
        courtStatus={courtStatus}
        onTakeCourt={startCourtTimer}
        hasActiveReservation={hasActiveReservation()}
        hasActiveCourtUsage={hasActiveCourtUsage}
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

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
