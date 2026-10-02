export function vistaMetropolitana(movil: boolean) {
  return {
    center: [-100.30, 25.75] as [number, number],
    zoom: movil ? 9.75 : 10.55,
    pitch: movil ? 30 : 45,
    bearing: 0,
  };
}
