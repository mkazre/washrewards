// Sample data mirroring the prototype (WashRewards SA.dc.html).
// Replaced by live API responses once USE_MOCK_DATA is false.

export type Partner = {
  id: string;
  name: string;
  area: string;
  rating: string;
  dist: string;
  price: string;
  featured?: boolean;
  mapTop: string;
  mapLeft: string;
};

export type Package = {
  id: string;
  name: string;
  desc: string;
  price: string;
  time: string;
  earn: string;
  popular?: boolean;
};

export type Slot = { label: string; disabled?: boolean };

export type Txn = {
  title: string;
  sub: string;
  amount: string;
  kind: 'spend' | 'reward';
};

export type Review = { name: string; stars: number; when: string; text: string };

export type Booking = {
  time: string;
  name: string;
  pkg: string;
  price: string;
};

export const partners: Partner[] = [
  { id: 'sparkle', name: 'Sparkle & Shine', area: 'Sandton City', rating: '4.8', dist: '1.2 km', price: 'R59', featured: true, mapTop: '26%', mapLeft: '40%' },
  { id: 'aquajet', name: 'AquaJet Auto Spa', area: 'Rosebank', rating: '4.6', dist: '2.4 km', price: 'R49', mapTop: '50%', mapLeft: '21%' },
  { id: 'prestige', name: 'Prestige Wash Co.', area: 'Melrose Arch', rating: '4.9', dist: '3.1 km', price: 'R75', mapTop: '38%', mapLeft: '70%' },
  { id: 'driveclean', name: 'DriveClean Express', area: 'Braamfontein', rating: '4.4', dist: '4.5 km', price: 'R45', mapTop: '68%', mapLeft: '55%' },
];

export const packages: Package[] = [
  { id: 'basic', name: 'Basic Wash', desc: 'Exterior wash & hand dry', price: 'R59', time: '20 min', earn: '59' },
  { id: 'valet', name: 'Full Valet', desc: 'Interior + exterior + wax', price: 'R189', time: '45 min', earn: '189', popular: true },
  { id: 'premium', name: 'Premium Detail', desc: 'Deep clean, polish & ceramic protect', price: 'R349', time: '90 min', earn: '349' },
];

export const slots: Slot[] = [
  { label: '09:30' }, { label: '11:00' }, { label: '12:30', disabled: true },
  { label: '14:00' }, { label: '15:30' }, { label: '17:00' },
];

export const txns: Txn[] = [
  { title: 'Full Valet', sub: 'Sparkle & Shine · 12 Jun', amount: 'R189', kind: 'spend' },
  { title: 'Basic Wash', sub: 'DriveClean Express · 5 Jun', amount: 'R59', kind: 'spend' },
  { title: 'R100 voucher earned', sub: 'After 5 washes · 28 May', amount: '+R100', kind: 'reward' },
  { title: 'Premium Detail', sub: 'Prestige Wash Co. · 20 May', amount: 'R349', kind: 'spend' },
];

export const partnerReviews: Review[] = [
  { name: 'Naledi M.', stars: 5, when: '2 days ago', text: 'Spotless finish and done in 40 minutes. Booking made it effortless.' },
  { name: 'Johan V.', stars: 5, when: '5 days ago', text: 'Great value valet — staff were professional and friendly.' },
];

export const todayBookings: Booking[] = [
  { time: '09:30', name: 'Thabo M.', pkg: 'Full Valet', price: 'R189' },
  { time: '11:00', name: 'Lerato K.', pkg: 'Basic Wash', price: 'R59' },
  { time: '12:30', name: 'Sipho N.', pkg: 'Premium Detail', price: 'R349' },
  { time: '14:00', name: 'Aisha P.', pkg: 'Full Valet', price: 'R189' },
];

export const payMethods = [
  { brand: 'VISA', last: '4827', label: 'Visa' },
  { brand: 'MC', last: '1190', label: 'Mastercard' },
  { brand: 'EFT', last: '', label: 'Instant EFT' },
];

export const ratingCats = ['Cleanliness', 'Staff professionalism', 'Value for money', 'Waiting time'];

export const user = { name: 'Sanele Dlamini', initials: 'SD' };
export const vehicle = { name: 'VW Polo Vivo', plate: 'FH 21 RT GP' };
export const lastWash = { partner: 'Prestige Wash Co.', pkg: 'Premium Detail' };

export const voucher = { balance: 'R100', count: '1', washCount: 3 };
