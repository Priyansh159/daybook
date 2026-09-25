const paths = {
  dashboard: 'M4 5a1 1 0 011-1h5v7H4V5zm10-1h5a1 1 0 011 1v4h-6V4zM4 13h6v7H5a1 1 0 01-1-1v-6zm10-2h6v8a1 1 0 01-1 1h-5v-9z',
  tasks: 'M9 5h10M9 12h10M9 19h10M4 5l1 1 2-2M4 12l1 1 2-2M4 19l1 1 2-2',
  attendance: 'M12 7v5l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z',
  leave: 'M4 20h16M6 16l3-9 3 5 3-3 3 7',
  wfh: 'M3 11l9-7 9 7M5 10v10h14V10M10 20v-5h4v5',
  calendar: 'M7 3v3m10-3v3M4 9h16M5 6h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1z',
  profile: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8a7 7 0 0114 0',
  employees: 'M16 11a3 3 0 100-6 3 3 0 000 6zM8 11a3 3 0 100-6 3 3 0 000 6zm-6 9a6 6 0 0112 0m-1.5-4.5A6 6 0 0122 20',
  reports: 'M5 20V10m7 10V4m7 16v-7',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zm7.4-3a7.4 7.4 0 00-.1-1.3l2-1.6-2-3.4-2.4 1a7.5 7.5 0 00-2.2-1.3L14.3 3h-4l-.4 2.4a7.5 7.5 0 00-2.2 1.3l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 000 2.6l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 002.2 1.3l.4 2.4h4l.4-2.4a7.5 7.5 0 002.2-1.3l2.4 1 2-3.4-2-1.6c.1-.4.1-.9.1-1.3z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M6 6l12 12M18 6L6 18',
  logout: 'M15 17l5-5-5-5M20 12H9m4 8H5a1 1 0 01-1-1V5a1 1 0 011-1h8',
  chevronDown: 'M6 9l6 6 6-6',
} as const

export type IconName = keyof typeof paths

export function Icon({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  )
}
