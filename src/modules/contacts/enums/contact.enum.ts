/**
 * Contact status values.
 */
export enum ContactStatus {
  LEAD = 'lead',
  PROSPECT = 'prospect',
  CUSTOMER = 'customer',
  INACTIVE = 'inactive',
}

/**
 * Contact source — how the contact was acquired.
 */
export enum ContactSource {
  WEBSITE = 'website',
  REFERRAL = 'referral',
  SOCIAL_MEDIA = 'social_media',
  COLD_CALL = 'cold_call',
  EMAIL = 'email',
  OTHER = 'other',
}
