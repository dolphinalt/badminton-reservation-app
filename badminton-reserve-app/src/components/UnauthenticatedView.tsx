import { useState, useEffect } from "react";
import LoginButton from "./LoginButton";
import { api } from "../utils/api";

interface CourtStatus {
  id: number;
  name: string;
  status: string;
  color: string;
  reservationCount: number;
  isInUse: boolean;
}

export default function UnauthenticatedView() {
  const [courts, setCourts] = useState<CourtStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCourtsStatus();

    // Refresh every 5 seconds
    const interval = setInterval(loadCourtsStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadCourtsStatus = async () => {
    try {
      setError(null);
      const data = await api.getPublicCourtsStatus();
      setCourts(data.courts);
    } catch (error: any) {
      console.error("Error loading courts status:", error);
      setError("Failed to load court status");
      // Set default courts as fallback
      setCourts([
        {
          id: 1,
          name: "Court 1",
          status: "Available",
          color: "text-green-500",
          reservationCount: 0,
          isInUse: false,
        },
        {
          id: 2,
          name: "Court 2",
          status: "Available",
          color: "text-green-500",
          reservationCount: 0,
          isInUse: false,
        },
        {
          id: 3,
          name: "Court 3",
          status: "Available",
          color: "text-green-500",
          reservationCount: 0,
          isInUse: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Badminton</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Court Reservation
          </h2>
          <p className="text-gray-600">
            Please sign in to reserve courts and manage your badminton sessions.
          </p>
        </div>

        <div className="mb-8">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {loading
              ? // Loading state
                Array.from({ length: 3 }, (_, i) => (
                  <div
                    key={i}
                    className="bg-gray-100 p-4 rounded-lg animate-pulse"
                  >
                    <div className="h-5 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  </div>
                ))
              : // Dynamic court data
                courts.map((court) => (
                  <div
                    key={court.id}
                    className={`p-4 rounded-lg ${
                      court.isInUse ? "bg-red-50" : "bg-green-50"
                    }`}
                  >
                    <div className={`font-semibold ${court.color}`}>
                      {court.name}
                    </div>
                    <div className={`text-sm ${court.color} mb-1`}>
                      {court.status}
                    </div>
                    <div className="text-xs text-gray-600 font-medium">
                      {court.reservationCount > 0
                        ? `${court.reservationCount} player${
                            court.reservationCount === 1 ? "" : "s"
                          } in queue`
                        : "No queue"}
                    </div>
                  </div>
                ))}
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center mb-4">{error}</div>
          )}

          <div className="text-center">
            <div className="text-xs text-gray-500 mb-2">
              Status updates every 5 seconds
            </div>
            <div className="text-xs text-gray-600">
              <div className="inline-flex items-center mr-4">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                Available
              </div>
              <div className="inline-flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                In Use
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <LoginButton />
          <p className="text-xs text-gray-500">
            By signing in, you agree to our terms of service and can reserve
            courts for up to 30 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
