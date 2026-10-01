// El segundo campo comparte coordenadas con la silueta y siempre se recorta.
export const particiones = {
  entero: '',
  partido: 'M40 0H80V100H40Z',
  cortado: 'M0 50H80V100H0Z',
  tajado: 'M0 0H80V100Z',
  cuartelado: 'M40 0H80V50H40ZM0 50H40V100H0Z',
  chevron: 'M0 66L40 34L80 66V84L40 52L0 84Z',
  faja: 'M0 39H80V61H0Z',
  palo: 'M29 0H51V100H29Z',
} as const;

export type Particion = keyof typeof particiones;
