/**
 * Localização do aparelho, só quando a pessoa pede (botão "Perto de mim"). Fica no navegador:
 * serve apenas para mover o mapa; não é gravada nem enviada ao servidor.
 */
export function pedirLocalizacao(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Este navegador não informa a localização."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) =>
        reject(
          new Error(
            e.code === e.PERMISSION_DENIED
              ? "Sem permissão para usar a localização. Dá para liberar nas configurações do navegador."
              : "Não foi possível descobrir a localização agora. Tente de novo ou mova o mapa.",
          ),
        ),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  });
}
