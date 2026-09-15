import React, { createContext, useContext, useState, useEffect } from 'react';
import { mockRooms, mockPatients, mockActivities } from '../data/mockData';
import { NotificationContext } from './NotificationContext';
import { useAuth } from '../hooks/useAuth';

export const RoomContext = createContext();

const STORAGE_KEY = 'medisync_beds';
const REQUESTS_STORAGE_KEY = 'medisync_bed_requests';

export const RoomProvider = ({ children }) => {
  const notifCtx = useContext(NotificationContext);
  const addNotification = notifCtx ? notifCtx.addNotification : null;
  const { currentRole, user } = useAuth();

  const [rooms, setRooms] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 6) {
          const totalBedCount = parsed.reduce((sum, r) => sum + (Array.isArray(r.beds) ? r.beds.length : 0), 0);
          if (totalBedCount === 33) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.error('Failed to parse rooms from localStorage', e);
    }
    return mockRooms;
  });

  const [bedRequests, setBedRequests] = useState(() => {
    try {
      const saved = localStorage.getItem(REQUESTS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse bed requests from localStorage', e);
    }
    return [];
  });

  // Keep localStorage updated for rooms
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
    } catch (e) {
      console.error('Failed to persist rooms to localStorage', e);
    }
  }, [rooms]);

  // Keep localStorage updated for bed requests
  useEffect(() => {
    try {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(bedRequests));
    } catch (e) {
      console.error('Failed to persist bed requests to localStorage', e);
    }
  }, [bedRequests]);

  // Derived Dynamic Statistics
  const allBeds = rooms.flatMap(r => r.beds || []);
  const totalRooms = rooms.length;
  const totalBeds = allBeds.length;
  const occupiedBeds = allBeds.filter(b => (b.status || '').toUpperCase() === 'OCCUPIED').length;
  const availableBeds = allBeds.filter(b => (b.status || '').toUpperCase() === 'AVAILABLE').length;

  /**
   * Get all beds for a specific room
   */
  const getRoomBeds = (roomNumber) => {
    const room = rooms.find(r => r.roomNumber === roomNumber);
    return room ? room.beds : [];
  };

  /**
   * Get only available beds for a specific room
   */
  const getAvailableBeds = (roomNumber) => {
    const room = rooms.find(r => r.roomNumber === roomNumber);
    if (!room) return [];
    return room.beds.filter(b => (b.status || '').toUpperCase() === 'AVAILABLE');
  };

  /**
   * Allocate Bed Space (Admin Only)
   */
  const allocateBed = ({ roomNumber, bedId, patientId, patientName }) => {
    // Action-level role permission guard
    if (currentRole !== 'admin') {
      if (addNotification) {
        addNotification('Access Denied', 'Only administrators are authorized to allocate beds.', 'Emergency');
      }
      return { success: false, error: 'Unauthorized: Only Administrator can allocate beds.' };
    }

    if (!roomNumber || !bedId || !patientId) {
      return { success: false, error: 'Missing required allocation parameters.' };
    }

    let allocatedPatientName = patientName;
    if (!allocatedPatientName) {
      const pObj = mockPatients.find(p => p.id === patientId);
      allocatedPatientName = pObj ? pObj.name : `Patient ${patientId}`;
    }

    let bedUpdated = false;
    let targetRoomName = '';
    let targetBedNum = '';

    const updatedRooms = rooms.map(room => {
      if (room.roomNumber !== roomNumber) return room;

      targetRoomName = room.type;

      const updatedBeds = room.beds.map(bed => {
        if (bed.id !== bedId && bed.bedNumber !== bedId) return bed;

        // Duplicate allocation prevention check
        if ((bed.status || '').toUpperCase() === 'OCCUPIED') {
          return bed; // Cannot re-allocate an occupied bed
        }

        bedUpdated = true;
        targetBedNum = bed.bedNumber;
        return {
          ...bed,
          status: 'OCCUPIED',
          patientId: patientId,
          patientName: allocatedPatientName,
          allocatedAt: new Date().toISOString()
        };
      });

      return {
        ...room,
        beds: updatedBeds
      };
    });

    if (!bedUpdated) {
      return { success: false, error: 'Selected bed is already occupied or does not exist.' };
    }

    setRooms(updatedRooms);

    // Update patient record if in mockPatients
    const targetPatient = mockPatients.find(p => p.id === patientId);
    if (targetPatient) {
      targetPatient.room = `${targetRoomName} - ${targetBedNum}`;
      targetPatient.status = 'Admitted';
    }

    // Log Activity
    mockActivities.unshift({
      id: Date.now(),
      text: `Bed ${roomNumber}-${targetBedNum} Allocated to ${allocatedPatientName}`,
      time: 'Just now',
      type: 'info'
    });

    // Send toast notification
    if (addNotification) {
      addNotification(
        'Bed Space Allocated',
        `Bed ${bedId} in ${targetRoomName} (${roomNumber}) allocated to ${allocatedPatientName}.`,
        'System'
      );
    }

    return { success: true };
  };

  /**
   * Release Bed Space (Admin Only)
   */
  const releaseBed = ({ roomNumber, bedId }) => {
    // Action-level role permission guard
    if (currentRole !== 'admin') {
      if (addNotification) {
        addNotification('Access Denied', 'Only administrators are authorized to release beds.', 'Emergency');
      }
      return { success: false, error: 'Unauthorized: Only Administrator can release beds.' };
    }

    if (!roomNumber || !bedId) {
      return { success: false, error: 'Missing room or bed identifier.' };
    }

    let bedReleased = false;
    let releasedPatientName = '';
    let targetRoomName = '';
    let targetBedNum = '';

    const updatedRooms = rooms.map(room => {
      if (room.roomNumber !== roomNumber) return room;

      targetRoomName = room.type;

      const updatedBeds = room.beds.map(bed => {
        if (bed.id !== bedId && bed.bedNumber !== bedId) return bed;

        if ((bed.status || '').toUpperCase() !== 'OCCUPIED') {
          return bed;
        }

        bedReleased = true;
        releasedPatientName = bed.patientName;
        targetBedNum = bed.bedNumber;

        return {
          ...bed,
          status: 'AVAILABLE',
          patientId: null,
          patientName: null,
          allocatedAt: null
        };
      });

      return {
        ...room,
        beds: updatedBeds
      };
    });

    if (!bedReleased) {
      return { success: false, error: 'Bed is not currently occupied.' };
    }

    setRooms(updatedRooms);

    // Log Activity
    mockActivities.unshift({
      id: Date.now(),
      text: `Bed ${roomNumber}-${targetBedNum} Released from ${releasedPatientName || 'Patient'}`,
      time: 'Just now',
      type: 'info'
    });

    // Send toast notification
    if (addNotification) {
      addNotification(
        'Bed Released',
        `Bed ${bedId} in ${targetRoomName} (${roomNumber}) is now available.`,
        'System'
      );
    }

    return { success: true };
  };

  /**
   * Patient creates a bed request for a ROOM SECTION only (never selects a bed number)
   */
  const createBedRequest = (sectionId) => {
    if (currentRole !== 'patient') {
      return { success: false, message: 'Only patients can request a bed.' };
    }

    const targetSection = rooms.find(r => r.roomNumber === sectionId);
    if (!targetSection) {
      return { success: false, message: 'Selected section does not exist.' };
    }

    // Live section availability check
    const sectionAvailableBeds = (targetSection.beds || []).filter(
      b => (b.status || '').toUpperCase() === 'AVAILABLE'
    ).length;

    if (sectionAvailableBeds <= 0) {
      return { success: false, message: 'No beds are currently available in this section.' };
    }

    const patientId = user?.id || 'P-105';
    const patientName = user?.name || 'Gousik Lakshmanan';

    // Duplicate pending request check for same patient & section
    const hasExistingPending = bedRequests.some(
      req => req.requesterId === patientId && req.sectionId === sectionId && req.status === 'pending'
    );

    if (hasExistingPending) {
      return {
        success: false,
        message: 'You already have a pending bed request for this section.'
      };
    }

    const now = new Date().toISOString();
    const newRequest = {
      id: `BED-REQ-${Date.now()}`,
      requesterId: patientId,
      requesterName: patientName,
      requesterRole: 'patient',
      sectionId: targetSection.roomNumber,
      sectionName: targetSection.type,
      requestedAt: now,
      status: 'pending',
      assignedBedId: null,
      assignedBedNumber: null,
      createdAt: now,
      updatedAt: now
    };

    // Bed availability remains unchanged upon request creation
    setBedRequests(prev => [newRequest, ...prev]);

    if (addNotification) {
      addNotification(
        'New Bed Request',
        `New bed request from ${patientName} for ${targetSection.type} (${targetSection.roomNumber}).`,
        'System'
      );
    }

    return { success: true, request: newRequest };
  };

  /**
   * Admin accepts a pending bed request and allocates an actual available bed
   */
  const acceptBedRequest = (requestId, bedId) => {
    if (currentRole !== 'admin') {
      return { success: false, message: 'Unauthorized: Only Administrator can accept bed requests.' };
    }

    const targetRequest = bedRequests.find(r => r.id === requestId);
    if (!targetRequest) {
      return { success: false, message: 'Bed request not found.' };
    }

    if (targetRequest.status !== 'pending') {
      return { success: false, message: `Request is already ${targetRequest.status}.` };
    }

    const targetSection = rooms.find(r => r.roomNumber === targetRequest.sectionId);
    if (!targetSection) {
      return { success: false, message: 'Requested section not found.' };
    }

    // Find and validate the selected bed strictly in the requested section
    const targetBed = (targetSection.beds || []).find(
      b => b.id === bedId || b.bedNumber === bedId
    );

    if (!targetBed) {
      return {
        success: false,
        message: 'Invalid bed selection. Please select an available bed from the requested section.'
      };
    }

    if (targetBed.roomId !== targetRequest.sectionId) {
      return {
        success: false,
        message: 'Invalid bed selection. The selected bed does not belong to the requested section.'
      };
    }

    // Strict live availability check
    if ((targetBed.status || '').toUpperCase() !== 'AVAILABLE') {
      return {
        success: false,
        message: 'This bed is no longer available. Please select another available bed.'
      };
    }

    // Perform atomic-style state update for room beds and request
    let bedAssignedNumber = targetBed.bedNumber;
    let bedAssignedId = targetBed.id;
    const now = new Date().toISOString();

    const updatedRooms = rooms.map(room => {
      if (room.roomNumber !== targetRequest.sectionId) return room;

      const updatedBeds = room.beds.map(b => {
        if (b.id !== bedAssignedId) return b;

        return {
          ...b,
          status: 'OCCUPIED',
          patientId: targetRequest.requesterId,
          patientName: targetRequest.requesterName,
          allocatedAt: now
        };
      });

      return {
        ...room,
        beds: updatedBeds
      };
    });

    setRooms(updatedRooms);

    // Update bed request to approved
    setBedRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved',
              assignedBedId: bedAssignedId,
              assignedBedNumber: bedAssignedNumber,
              updatedAt: now
            }
          : r
      )
    );

    // Update mockPatients if present
    const targetPatient = mockPatients.find(p => p.id === targetRequest.requesterId);
    if (targetPatient) {
      targetPatient.room = `${targetSection.type} - ${bedAssignedNumber}`;
      targetPatient.status = 'Admitted';
    }

    // Log activity
    mockActivities.unshift({
      id: Date.now(),
      text: `Bed Request Approved: ${targetSection.type}-${bedAssignedNumber} Allocated to ${targetRequest.requesterName}`,
      time: 'Just now',
      type: 'info'
    });

    // Send toast notification
    if (addNotification) {
      addNotification(
        'Bed Request Approved',
        `Bed ${bedAssignedNumber} in ${targetSection.type} allocated to ${targetRequest.requesterName}.`,
        'System'
      );
    }

    return { success: true, bedNumber: bedAssignedNumber, patientName: targetRequest.requesterName };
  };

  /**
   * Admin rejects a pending bed request
   */
  const rejectBedRequest = (requestId) => {
    if (currentRole !== 'admin') {
      return { success: false, message: 'Unauthorized: Only Administrator can reject bed requests.' };
    }

    const targetRequest = bedRequests.find(r => r.id === requestId);
    if (!targetRequest) {
      return { success: false, message: 'Bed request not found.' };
    }

    if (targetRequest.status !== 'pending') {
      return { success: false, message: `Request is already ${targetRequest.status}.` };
    }

    const now = new Date().toISOString();

    // Bed availability remains unchanged
    setBedRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected',
              assignedBedId: null,
              assignedBedNumber: null,
              updatedAt: now
            }
          : r
      )
    );

    if (addNotification) {
      addNotification(
        'Bed Request Rejected',
        `Bed request from ${targetRequest.requesterName} for ${targetRequest.sectionName} was rejected.`,
        'System'
      );
    }

    return { success: true };
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
        getRoomBeds,
        getAvailableBeds,
        allocateBed,
        releaseBed,
        createBedRequest,
        acceptBedRequest,
        rejectBedRequest
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
