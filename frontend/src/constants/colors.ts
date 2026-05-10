export const Colors = {
  background: '#0F1117',
  card: '#1A1D27',
  cardBorder: 'rgba(255,255,255,0.08)',
  green: '#4CAF82',
  yellow: '#F5A623',
  red: '#E05252',
  textPrimary: '#FFFFFF',
  textSecondary: '#8B8FA8',
  accent: '#4CAF82',
  inputBg: '#22253A',
  overlay: 'rgba(15,17,23,0.85)',
};

export type WellnessColor = 'green' | 'yellow' | 'red';

export const wellnessColorMap: Record<WellnessColor, string> = {
  green: Colors.green,
  yellow: Colors.yellow,
  red: Colors.red,
};
