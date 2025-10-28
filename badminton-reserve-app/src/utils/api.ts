const API_BASE = 'http://localhost:3001/api';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('authToken');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const api = {
  // Court-related endpoints
  getCourts: async () => {
    const response = await fetch(`${API_BASE}/courts`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch courts: ${response.statusText}`);
    }
    
    return response.json();
  },

  getCourtStatus: async (courtId: number) => {
    const response = await fetch(`${API_BASE}/courts/${courtId}/status`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch court status: ${response.statusText}`);
    }
    
    return response.json();
  },

  takeCourt: async (courtId: number) => {
    const response = await fetch(`${API_BASE}/courts/${courtId}/take`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to take court: ${response.statusText}`);
    }
    
    return response.json();
  },

  getCourtUsageStatus: async () => {
    const response = await fetch(`${API_BASE}/courts/usage-status`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch usage status: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Reservation-related endpoints
  getReservations: async () => {
    const response = await fetch(`${API_BASE}/reservations`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch reservations: ${response.statusText}`);
    }
    
    return response.json();
  },

  makeReservation: async (courtId: number, timeSlot: string) => {
    const response = await fetch(`${API_BASE}/reservations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ courtId, timeSlot })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to make reservation: ${response.statusText}`);
    }
    
    return response.json();
  },

  cancelReservation: async (reservationId: number) => {
    const response = await fetch(`${API_BASE}/reservations/${reservationId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to cancel reservation: ${response.statusText}`);
    }
    
    return response.json();
  },

  // Time slots
  getTimeSlots: async () => {
    const response = await fetch(`${API_BASE}/time-slots`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch time slots: ${response.statusText}`);
    }
    
    return response.json();
  }
};