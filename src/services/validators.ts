import { z } from 'zod';

// E.164 phone number pattern
export const phoneSchema = z.string()
  .trim()
  .regex(/^\+[1-9]\d{9,14}$/, 'Phone number must be in valid E.164 format (e.g. +919876543210)');

export const attendanceSubmissionSchema = z.object({
  phoneNumber: phoneSchema.optional(),
  phone: phoneSchema.optional(),
  workerName: z.string().min(1).max(100).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  locationName: z.string().min(1).max(120).default('Selected Worksite'),
  locationMethod: z.enum(['gps_device', 'manual_preset', 'telegraph']).default('manual_preset'),
  hoursWorked: z.number().min(0.5).max(24).default(8.0),
  agreedWage: z.number().min(100).max(25000).default(600.0),
  rawMessage: z.string().max(500).optional(),
  isDemo: z.boolean().default(false),
  shiftAction: z.enum(['check_in', 'check_out']).default('check_in'),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  gpsAccuracyMeters: z.number().min(0.1).max(500).optional(),
  workPhotoUrl: z.string().optional(),
  workPhotoHash: z.string().optional(),
}).transform((data) => ({
  ...data,
  phoneNumber: data.phoneNumber || data.phone || '',
})).refine(data => Boolean(data.phoneNumber), { message: 'Phone number is required' });

export const attendanceCheckoutSchema = z.object({
  phoneNumber: phoneSchema.optional(),
  phone: phoneSchema.optional(),
  attendanceId: z.string().optional(),
  checkOutTime: z.string().optional(),
  workPhotoUrl: z.string().optional(),
  notes: z.string().max(300).optional(),
}).transform((data) => ({
  ...data,
  phoneNumber: data.phoneNumber || data.phone || '',
})).refine(data => Boolean(data.phoneNumber || data.attendanceId), { message: 'Phone number or attendance ID is required' });

export const disputeSubmissionSchema = z.object({
  phoneNumber: phoneSchema.optional(),
  phone: phoneSchema.optional(),
  contractorName: z.string().min(2, 'Contractor name must be at least 2 characters').max(120),
  claimedAmount: z.number().positive('Claimed amount must be a positive number'),
  workLocation: z.string().max(120).optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
}).transform((data) => ({
  ...data,
  phoneNumber: data.phoneNumber || data.phone || '',
})).refine(data => Boolean(data.phoneNumber), { message: 'Phone number is required' });

export const attendanceActionSchema = z.object({
  attendanceId: z.string().optional(),
  id: z.string().optional(),
  action: z.enum(['acknowledge', 'dispute']),
  reason: z.string().max(300).optional(),
}).transform((data) => ({
  ...data,
  attendanceId: data.attendanceId || data.id || '',
})).refine(data => Boolean(data.attendanceId), { message: 'attendanceId is required' });

export const retentionHoldSchema = z.object({
  siteKey: z.string().min(2).max(160),
  contractorName: z.string().min(2).max(120).default('Site Sub-Contractor'),
  held: z.boolean(),
  reason: z.string().max(300).optional(),
});

export const bulkAcknowledgeSchema = z.object({
  attendanceIds: z.array(z.string().min(1)).min(1).max(200),
});

export const siteOfferCreateSchema = z.object({
  workerPhone: phoneSchema,
  workerName: z.string().min(1).max(120),
  trade: z.string().min(1).max(120),
  employerName: z.string().min(2).max(120),
  projectSite: z.string().min(2).max(160),
  offeredDailyWage: z.number().min(200).max(25000),
  durationDays: z.number().int().min(1).max(365),
  startDate: z.string().min(4).max(30),
});

export const siteOfferActionSchema = z.object({
  status: z.enum(['accepted', 'declined']),
});

