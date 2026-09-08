export const STATUS_MAPPING: Record<string, string> = {
  PRE: 'Present',
  ABS: 'Absent',
  LVE: 'Leave',
  WFH: 'Work From Home',
  RD: 'Rest Day',
  HOL: 'Holiday',
  MIS: 'Missing'
}

export const REVERSE_STATUS_MAPPING: Record<string, string> = Object.entries(STATUS_MAPPING).reduce(
  (acc, [shortcode, full]) => ({ ...acc, [full]: shortcode }),
  {} as Record<string, string>
)

export const COUNTABLE_STATUS_SHORTCODES = ['PRE', 'WFH', 'HOL'] // Statuses that count as "Present/Worked" for the Excel Days Present tally

export const VALID_SHORTCODES = Object.keys(STATUS_MAPPING)

export const LEGEND_TEXT = Object.entries(STATUS_MAPPING).map(([k, v]) => `${k} = ${v}`).join(' | ')
