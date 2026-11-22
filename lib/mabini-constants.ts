/**
 * Official Barangays and Contact Constants for the Municipality of Mabini, Batangas
 * MENR Office - EcoGuard Environmental Portal
 */

export const MABINI_BARANGAYS = [
  "Anilao East",
  "Anilao Proper",
  "Bagalangit",
  "Bulacan",
  "Calamias",
  "Estrella",
  "Gasang",
  "Laurel",
  "Ligaya",
  "Mainaga",
  "Mainit",
  "Majuben",
  "Malimatoc I",
  "Malimatoc II",
  "Monte Carlo",
  "Nag-Iba",
  "Pilahan",
  "Poblacion",
  "Pulong Anahao",
  "Pulong Balibaguhan",
  "Pulong Niogan",
  "Sagawing",
  "San Francisco",
  "San Jose",
  "San Juan",
  "San Teodoro",
  "Santa Ana",
  "Santa Mesa",
  "Santo Niño",
  "Santo Tomas",
  "Solo",
  "Talaga East",
  "Talaga Proper",
] as const;

export type MabiniBarangay = (typeof MABINI_BARANGAYS)[number];

export const MENR_OFFICE_INFO = {
  name: "Municipal Environment and Natural Resources Office (MENR)",
  lgu: "Municipality of Mabini, Province of Batangas",
  address: "Municipal Hall Complex, F. Castillo Blvd., Poblacion, Mabini, Batangas 4202",
  hours: "Monday–Thursday: 8:00 AM – 6:00 PM",
  emergencyNote: "For immediate environmental hazards or emergency waste situations, contact the Municipal Disaster Risk Reduction & Management Office (MDRRMO) or visit the MENR Office in person during operating hours.",
};
