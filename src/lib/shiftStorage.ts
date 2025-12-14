import { Shift, ActivityLog, CashRegisterSession, Transaction } from '@/types';

const STORAGE_KEYS = {
  SHIFTS: 'dimsum_shifts',
  ACTIVITY_LOGS: 'dimsum_activity_logs',
  CASH_REGISTER_SESSIONS: 'dimsum_cash_register_sessions',
  ACTIVE_SHIFT: 'dimsum_active_shift',
};

// Shift Management
export function getStoredShifts(): Shift[] {
  const stored = localStorage.getItem(STORAGE_KEYS.SHIFTS);
  return stored ? JSON.parse(stored) : [];
}

export function saveShift(shift: Shift): void {
  const shifts = getStoredShifts();
  const existingIndex = shifts.findIndex(s => s.id === shift.id);
  
  if (existingIndex !== -1) {
    shifts[existingIndex] = shift;
  } else {
    shifts.push(shift);
  }
  
  localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
}

export function getActiveShift(cashierId: string): Shift | null {
  const shifts = getStoredShifts();
  return shifts.find(s => s.cashierId === cashierId && s.status === 'active') || null;
}

export function getAllActiveShifts(): Shift[] {
  const shifts = getStoredShifts();
  return shifts.filter(s => s.status === 'active');
}

export function closeShift(shiftId: string, closingData: {
  actualCash: number;
  closingBalance: number;
  expectedCash: number;
  difference: number;
  totalSales: number;
  transactionCount: number;
}): void {
  const shifts = getStoredShifts();
  const shift = shifts.find(s => s.id === shiftId);
  
  if (shift) {
    shift.status = 'closed';
    shift.endTime = Date.now().toString();
    shift.actualCash = closingData.actualCash;
    shift.closingBalance = closingData.closingBalance;
    shift.expectedCash = closingData.expectedCash;
    shift.difference = closingData.difference;
    shift.totalSales = closingData.totalSales;
    shift.transactionCount = closingData.transactionCount;
    
    localStorage.setItem(STORAGE_KEYS.SHIFTS, JSON.stringify(shifts));
  }
}

export function getShiftsByDateRange(startDate: Date, endDate: Date): Shift[] {
  const shifts = getStoredShifts();
  return shifts.filter(s => {
    const shiftDate = new Date(s.startTime);
    return shiftDate >= startDate && shiftDate <= endDate;
  });
}

export function getShiftsByCashier(cashierId: string): Shift[] {
  const shifts = getStoredShifts();
  return shifts.filter(s => s.cashierId === cashierId);
}

// Activity Log Management
export function getStoredActivityLogs(): ActivityLog[] {
  const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
  return stored ? JSON.parse(stored) : [];
}

export function saveActivityLog(log: ActivityLog): void {
  const logs = getStoredActivityLogs();
  logs.push(log);
  localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(logs));
}

export function getActivityLogsByDateRange(startDate: Date, endDate: Date): ActivityLog[] {
  const logs = getStoredActivityLogs();
  return logs.filter(l => {
    const logDate = new Date(l.timestamp);
    return logDate >= startDate && logDate <= endDate;
  });
}

export function getActivityLogsByUser(userId: string): ActivityLog[] {
  const logs = getStoredActivityLogs();
  return logs.filter(l => l.userId === userId);
}

export function getActivityLogsByType(actionType: ActivityLog['actionType']): ActivityLog[] {
  const logs = getStoredActivityLogs();
  return logs.filter(l => l.actionType === actionType);
}

// Cash Register Session Management
export function getStoredCashRegisterSessions(): CashRegisterSession[] {
  const stored = localStorage.getItem(STORAGE_KEYS.CASH_REGISTER_SESSIONS);
  return stored ? JSON.parse(stored) : [];
}

export function saveCashRegisterSession(session: CashRegisterSession): void {
  const sessions = getStoredCashRegisterSessions();
  const existingIndex = sessions.findIndex(s => s.id === session.id);
  
  if (existingIndex !== -1) {
    sessions[existingIndex] = session;
  } else {
    sessions.push(session);
  }
  
  localStorage.setItem(STORAGE_KEYS.CASH_REGISTER_SESSIONS, JSON.stringify(sessions));
}

export function getActiveCashRegisterSession(cashierId: string): CashRegisterSession | null {
  const sessions = getStoredCashRegisterSessions();
  return sessions.find(s => s.cashierId === cashierId && s.status === 'open') || null;
}

export function closeCashRegisterSession(sessionId: string, actualCash: number): void {
  const sessions = getStoredCashRegisterSessions();
  const session = sessions.find(s => s.id === sessionId);
  
  if (session) {
    session.status = 'closed';
    session.endTime = Date.now();
    session.actualCash = actualCash;
    session.closingBalance = actualCash;
    session.difference = actualCash - (session.expectedCash || 0);
    
    localStorage.setItem(STORAGE_KEYS.CASH_REGISTER_SESSIONS, JSON.stringify(sessions));
  }
}

// Helper Functions
export function determineShiftType(timestamp: number = Date.now()): 'pagi' | 'siang' | 'malam' {
  const date = new Date(timestamp);
  const hour = date.getHours();
  
  if (hour >= 6 && hour < 14) {
    return 'pagi'; // 06:00 - 14:00
  } else if (hour >= 14 && hour < 22) {
    return 'siang'; // 14:00 - 22:00
  } else {
    return 'malam'; // 22:00 - 06:00
  }
}

export function getShiftTimeRange(shiftType: 'pagi' | 'siang' | 'malam'): string {
  switch (shiftType) {
    case 'pagi':
      return '06:00 - 14:00';
    case 'siang':
      return '14:00 - 22:00';
    case 'malam':
      return '22:00 - 06:00';
  }
}

export function calculateShiftSales(shiftId: string, transactions: Transaction[]): {
  totalSales: number;
  transactionCount: number;
  cashTotal: number;
  transferTotal: number;
  ewalletTotal: number;
} {
  const shiftTransactions = transactions.filter(t => t.shiftId === shiftId);
  
  return {
    totalSales: shiftTransactions.reduce((sum, t) => sum + t.total, 0),
    transactionCount: shiftTransactions.length,
    cashTotal: shiftTransactions
      .filter(t => t.paymentMethod === 'tunai')
      .reduce((sum, t) => sum + t.total, 0),
    transferTotal: shiftTransactions
      .filter(t => t.paymentMethod === 'transfer')
      .reduce((sum, t) => sum + t.total, 0),
    ewalletTotal: shiftTransactions
      .filter(t => t.paymentMethod === 'e-wallet')
      .reduce((sum, t) => sum + t.total, 0),
  };
}