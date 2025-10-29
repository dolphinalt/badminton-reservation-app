import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Header from "./components/Header";
import AvailableTimes from "./components/AvailableTimes";
import BottomNavigation from "./components/BottomNavigation";
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
  const [queueData, setQueueData] = useState<any>({});
  const [courtStatus, setCourtStatus] = useState({
    status: "Open",
    time: null,
    color: "text-green-500",
  });
  const [error, setError] = useState<string | null>(null);

  // Temporarily suppress unused variable warnings - these will be used in queue system
  console.log({ allReservations, hasActiveCourtUsage, error });

  // Load initial data
  useEffect(() => {
    if (isAuthenticated) {
      loadQueue();
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
      loadQueue(); // Refresh queue data
    }, 1000); // Refresh every second

    return () => clearInterval(interval);
  }, [isAuthenticated, selectedCourt]);

  const loadQueue = async () => {
    try {
      setError(null);
      const data = await api.getQueue();
      setQueueData(data.queueByCourtId || {});
    } catch (error: any) {
      console.error("Error loading queue:", error);
      setError("Failed to load queue");
      setQueueData({});
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

  const handleReserve = async (courtId: number) => {
    try {
      setError(null);

      // Check if user already has a reservation for this court
      const existingReservation = userReservations.find(
        (res) => res.status === "reserved" && res.court_id === courtId
      );

      if (existingReservation) {
        // Cancel existing reservation
        await api.cancelReservation(existingReservation.id);
      } else {
        // Make a new reservation (join queue)
        await api.makeReservation(courtId);
      }

      // Refresh data
      loadQueue();
      loadUserReservations();
      loadAllReservations();
    } catch (error: any) {
      console.error("Error with reservation:", error);
      setError(error.message || "Failed to update reservation");
    }
  };

  const hasActiveReservation = () => {
    return userReservations.some(
      (res) => res.court_id === selectedCourt && res.status === "reserved"
    );
  };

  const canReserve = () => {
    // Can't make reservations if user is currently using a court
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

    return true;
  };

  const handleCancel = async (reservationId: number) => {
    try {
      setError(null);
      await api.cancelReservation(reservationId);

      // Refresh data
      loadQueue();
      loadUserReservations();
      loadAllReservations();
    } catch (error: any) {
      console.error("Error cancelling reservation:", error);
      setError(error.message || "Failed to cancel reservation");
    }
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
        selectedCourt={selectedCourt}
        queueData={queueData}
        handleReserve={handleReserve}
        handleCancel={handleCancel}
        canReserve={canReserve}
        user={user}
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
