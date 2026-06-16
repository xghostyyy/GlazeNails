export interface Interval {
  startMin: number; // minutes from midnight
  endMin: number;
}

export interface WorkingHoursInput {
  weekday: number; // 0=Sun, 1=Mon … 6=Sat
  startMin: number;
  endMin: number;
}

export interface TimeOffInput {
  startsAt: Date;
  endsAt: Date;
}

export interface AppointmentInput {
  startsAt: Date;
  endsAt: Date;
  status: string;
}

export interface SlotSettings {
  slotGranularity: number;
  bufferAfterMin: number;
  minLeadHours: number;
  maxAdvanceDays: number;
}

export interface GetAvailableSlotsParams {
  workingHours: WorkingHoursInput[];
  timeOffs: TimeOffInput[];
  existingAppointments: AppointmentInput[];
  settings: SlotSettings;
  date: Date;
  durationMin: number;
  now: Date;
  timezone: string;
}
