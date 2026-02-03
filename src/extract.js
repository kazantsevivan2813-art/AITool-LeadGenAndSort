/**
 * Extract CSV row fields from one enhet JSON object.
 * @param {object} obj - One element from the JSON array (Brønnøysund format)
 * @returns {{ organisasjonsnummer: string, navn: string, adresse: string, postnummer: string, epostadresse: string, telefon: string, mobil: string }}
 */
export function extractRow(obj) {
  const forretningsadresse = obj.forretningsadresse || {};
  const adresseArr = Array.isArray(forretningsadresse.adresse) ? forretningsadresse.adresse : [];
  const postnummer = forretningsadresse.postnummer ?? '';
  const poststed = (forretningsadresse.poststed ?? '').trim();
  // adresse = adresse + postnummer + poststed from forretningsadresse (no comma between postnummer and poststed)
  const adressePart = adresseArr.join(', ').trim();
  const postnummerPoststed = [postnummer, poststed].filter(Boolean).join(' ');
  const adresse = [adressePart, postnummerPoststed].filter(Boolean).join(', ');

  return {
    organisasjonsnummer: obj.organisasjonsnummer ?? '',
    navn: (obj.navn ?? '').trim(),
    adresse,
    postnummer,
    epostadresse: (obj.epostadresse ?? '').trim(),
    telefon: (obj.telefon ?? '').trim(),
    mobil: (obj.mobil ?? '').trim(),
  };
}
