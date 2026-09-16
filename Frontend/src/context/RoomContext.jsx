import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { roomService } from '../services/roomService';
import { bedRequestService } from '../services/bedRequestService';
import { NotificationContext } from './NotificationContext';
import { useAuth } from '../hooks/useAuth';

export const RoomContext = createContext();

export const RoomProvider = ({ children }) => {
  const notifCtx = useContext(NotificationContext);
  const addNotification = notifCtx ? notifCtx.addNotification : null;
  const { currentRole, user } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [bedRequests, setBedRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all rooms with their dynamic bed objects
  const fetchRooms = useCallback(async () => {
    try {
      const res = await roomService.getRooms();
      if (res.success && Array.isArray(res.data)) {
        // For each room, fetch its individual beds to populate the grid
        const populatedRooms = await Promise.all(
          res.data.map(async (room) => {
            try {
              const bedRes = await roomService.getRoomBeds(room.roomId);
              const beds = (bedRes.data || []).map((b) => ({
                ...b,
                id: b._id || b.bedNumber,
              }));
              return {
                ...room,
                roomNumber: room.roomId,
                type: room.roomName,
                totalBeds: room.capacity,
                beds,
              };
            } catch (err) {
              return {
                ...room,
                roomNumber: room.roomId,
                type: room.roomName,
                totalBeds: room.capacity,
                beds: [],
              };
            }
          })
        );
        setRooms(populatedRooms);
      }
    } catch (error) {
      console.error('Failed to fetch rooms from backend:', error);
    }
  }, []);

  // Fetch bed requests (Admin gets all, Patient gets their own)
  const fetchBedRequests = useCallback(async () => {
    if (!user) return;
    try {
      if (currentRole === 'admin') {
        const res = await bedRequestService.getAllBedRequests();
        if (res.success && Array.isArray(res.data)) {
          setBedRequests(res.data.map(r => ({ ...r, id: r._id })));
        }
      } else if (currentRole === 'patient') {
        const res = await bedRequestService.getMyBedRequests();
        if (res.success && Array.isArray(res.data)) {
          setBedRequests(res.data.map(r => ({ ...r, id: r._id })));
        }
      }
    } catch (error) {
      console.error('Failed to fetch bed requests:', error);
    }
  }, [currentRole, user]);

  // Initial load on authentication state change
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchRooms(), fetchBedRequests()]);
      setLoading(false);
    };

    if (user) {
      initData();
    }
  }, [user, fetchRooms, fetchBedRequests]);

  // Derived Dynamic Statistics
  const allBeds = rooms.flatMap((r) => r.beds || []);
  const totalRooms = rooms.length;
  const totalBeds = allBeds.length;
  const occupiedBeds = allBeds.filter((b) => (b.status || '').toUpperCase() === 'OCCUPIED').length;
  const availableBeds = allBeds.filter((b) => (b.status || '').toUpperCase() === 'AVAILABLE').length;

  /**
   * Get all beds for a specific room
   */
  const getRoomBeds = (roomNumber) => {
    const room = rooms.find((r) => r.roomNumber === roomNumber || r.roomId === roomNumber);
    return room ? room.beds : [];
  };

  /**
   * Get only available beds for a specific room
   */
  const getAvailableBeds = (roomNumber) => {
    const room = rooms.find((r) => r.roomNumber === roomNumber || r.roomId === roomNumber);
    if (!room) return [];
    return (room.beds || []).filter((b) => (b.status || '').toUpperCase() === 'AVAILABLE');
  };

  /**
   * Allocate Bed Space (Admin Only)
   */
  const allocateBed = async ({ roomNumber, bedId, patientId, patientName }) => {
    if (currentRole !== 'admin') {
      if (addNotification) {
        addNotification('Access Denied', 'Only administrators are authorized to allocate beds.', 'Emergency');
      }
      return { success: false, error: 'Unauthorized: Only Administrator can allocate beds.' };
    }

    try {
      const res = await roomService.allocateBed({ bedId, patientId });
      if (res.success) {
        await fetchRooms();
        if (addNotification) {
          addNotification(
            'Bed Space Allocated',
            res.message || `Bed allocated successfully.`,
            'System'
          );
        }
        return { success: true, data: res.data };
      }
      return { success: false, error: res.message || 'Allocation failed' };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to allocate bed';
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Release Bed Space (Admin Only)
   */
  const releaseBed = async ({ roomNumber, bedId }) => {
    if (currentRole !== 'admin') {
      if (addNotification) {
        addNotification('Access Denied', 'Only administrators are authorized to release beds.', 'Emergency');
      }
      return { success: false, error: 'Unauthorized: Only Administrator can release beds.' };
    }

    try {
      const res = await roomService.releaseBed(bedId);
      if (res.success) {
        await fetchRooms();
        if (addNotification) {
          addNotification(
            'Bed Released',
            res.message || `Bed released successfully and is now available.`,
            'System'
          );
        }
        return { success: true, data: res.data };
      }
      return { success: false, error: res.message || 'Failed to release bed' };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to release bed';
      return { success: false, error: errorMsg };
    }
  };

  /**
   * Patient creates a bed request for a ROOM SECTION only
   */
  const createBedRequest = async (sectionId) => {
    if (currentRole !== 'patient') {
      return { success: false, message: 'Only patients can request a bed.' };
    }

    try {
      const res = await bedRequestService.createBedRequest({ sectionId });
      if (res.success) {
        await fetchBedRequests();
        if (addNotification) {
          addNotification(
            'New Bed Request',
            res.message || `Bed request for section submitted successfully.`,
            'System'
          );
        }
        const createdReq = { ...res.data, id: res.data._id };
        return { success: true, request: createdReq };
      }
      return { success: false, message: res.message || 'Failed to submit bed request' };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create bed request';
      return { success: false, message: errorMsg };
    }
  };

  /**
   * Admin accepts a pending bed request and allocates an actual available bed
   */
  const acceptBedRequest = async (requestId, bedId) => {
    if (currentRole !== 'admin') {
      return { success: false, message: 'Unauthorized: Only Administrator can accept bed requests.' };
    }

    try {
      const res = await bedRequestService.approveBedRequest(requestId, bedId);
      if (res.success) {
        await Promise.all([fetchRooms(), fetchBedRequests()]);
        if (addNotification) {
          addNotification(
            'Bed Request Approved',
            res.message || 'Bed request approved successfully.',
            'System'
          );
        }
        return {
          success: true,
          bedNumber: res.data?.bed?.bedNumber,
          patientName: res.data?.request?.requesterName,
        };
      }
      return { success: false, message: res.message || 'Approval failed' };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to approve bed request';
      return { success: false, message: errorMsg };
    }
  };

  /**
   * Admin rejects a pending bed request
   */
  const rejectBedRequest = async (requestId) => {
    if (currentRole !== 'admin') {
      return { success: false, message: 'Unauthorized: Only Administrator can reject bed requests.' };
    }

    try {
      const res = await bedRequestService.rejectBedRequest(requestId);
      if (res.success) {
        await fetchBedRequests();
        if (addNotification) {
          addNotification(
            'Bed Request Rejected',
            res.message || 'Bed request rejected.',
            'System'
          );
        }
        return { success: true };
      }
      return { success: false, message: res.message || 'Failed to reject bed request' };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to reject bed request';
      return { success: false, message: errorMsg };
    }
  };

  return (
    <RoomContext.Provider
      value={{
        rooms,
        allBeds,
        totalRooms,
        totalBeds,
        occupiedBeds,
        availableBeds,
        bedRequests,
        loading,
        fetchRooms,
        fetchBedRequests,
        getRoomBeds,
        getAvailableBeds,
        allocateBed,
        releaseBed,
        createBedRequest,
        acceptBedRequest,
        rejectBedRequest,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRooms = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRooms must be used within a RoomProvider');
  }
  return context;
};

export default RoomContext;
