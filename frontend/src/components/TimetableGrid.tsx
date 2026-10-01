import React from 'react';

export interface SlotData {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  period: number;
  subject: string;
  class_id?: string;
  teacher_id?: { user_id: string; name: string };
  substitute_id?: { user_id: string; name: string };
}

interface Props {
  timetableEntries: SlotData[];
  onSlotClick?: (day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri', period: number, currentSlot?: SlotData) => void;
  isEditable?: boolean;
  showClassId?: boolean;
}

const PERIOD_TIMES = [
  { p: 1, label: '08:30 AM - 09:00 AM' },
  { p: 2, label: '09:00 AM - 09:30 AM' },
  { p: 3, label: '09:30 AM - 10:00 AM' },
  { p: 'BREAK', label: '10:00 AM - 10:30 AM (BREAK)' },
  { p: 4, label: '10:30 AM - 11:00 AM' },
  { p: 5, label: '11:00 AM - 11:30 AM' },
  { p: 6, label: '11:30 AM - 12:00 PM' },
];

const DAYS: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri')[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const TimetableGrid: React.FC<Props> = ({ timetableEntries, onSlotClick, isEditable = false, showClassId = false }) => {
  const getSlot = (day: string, period: number) => {
    return timetableEntries.find((e) => e.day === day && Number(e.period) === period);
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={styles.table}>
        <thead>
          <tr style={styles.thRow}>
            <th style={styles.timeCell}>Time Slot</th>
            {DAYS.map((d) => (
              <th key={d} style={styles.th}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERIOD_TIMES.map((pt, idx) => {
            if (pt.p === 'BREAK') {
              return (
                <tr key="break" style={{ backgroundColor: '#1a1a1a' }}>
                  <td style={styles.timeCell}>{pt.label}</td>
                  <td colSpan={5} style={{ ...styles.cell, textAlign: 'center', fontWeight: 'bold', color: '#a3a3a3' }}>
                    ☕ BREAK TIME (10:00 AM - 10:30 AM)
                  </td>
                </tr>
              );
            }

            const pNum = pt.p as number;
            return (
              <tr key={idx}>
                <td style={styles.timeCell}>
                  <div>Period {pNum}</div>
                  <div style={{ fontSize: '0.7rem', color: '#a3a3a3' }}>{pt.label}</div>
                </td>
                {DAYS.map((day) => {
                  const slot = getSlot(day, pNum);
                  return (
                    <td
                      key={day}
                      onClick={() => isEditable && onSlotClick && onSlotClick(day, pNum, slot)}
                      style={{
                        ...styles.cell,
                        cursor: isEditable ? 'pointer' : 'default',
                        backgroundColor: slot ? (slot.substitute_id ? '#1e1b4b' : '#0a0a0a') : '#000000',
                      }}
                    >
                      {slot ? (
                        <div>
                          {showClassId && slot.class_id && (
                            <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#38bdf8', marginBottom: '2px' }}>
                              Class {slot.class_id}
                            </div>
                          )}
                          <div style={{ fontWeight: 'bold', color: '#fff' }}>{slot.subject}</div>
                          <div style={{ fontSize: '0.75rem', color: '#a3a3a3', marginTop: '2px' }}>
                            <div>T: {slot.teacher_id?.name || 'Assigned'}</div>
                            {slot.substitute_id && (
                              <div style={{ color: '#f87171', marginTop: '1px' }}>
                                Sub: {slot.substitute_id.name}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#525252', fontSize: '0.75rem' }}>{isEditable ? '+ Click to set' : 'Free Period'}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'center', border: '1px solid #333' },
  thRow: { backgroundColor: '#121212', borderBottom: '2px solid #fff' },
  th: { padding: '0.75rem', fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid #333' },
  timeCell: { padding: '0.75rem', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid #333', backgroundColor: '#0d0d0d', width: '180px' },
  cell: { padding: '0.75rem', border: '1px solid #262626', minWidth: '130px', height: '60px', verticalAlign: 'middle' },
};