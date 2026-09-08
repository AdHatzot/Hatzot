/**
 * @team     core
 * @owner    core
 * @public   yes
 * @updated  2026-09-08
 *
 * Israeli localities with coordinates. Read-only shared data — the alerts team
 * keys its per-locality alerts off `id`, and any team may drop a marker at a
 * locality without inventing its own coordinate table.
 *
 * SEED LIST, NOT THE FULL REGISTRY. ~100 localities, enough to build and demo
 * against. Israel has roughly 1,200 including kibbutzim and moshavim; replace
 * this array with the CBS (למ"ס) locality file when you need full coverage.
 * Nothing but this one array has to change — the shape is the contract.
 */

export type District =
  | 'north'
  | 'haifa'
  | 'center'
  | 'telaviv'
  | 'jerusalem'
  | 'south'
  | 'judea-samaria';

export interface Locality {
  id: string;
  name: string;
  lat: number;
  lng: number;
  district: District;
}

export const DISTRICT_LABELS: Readonly<Record<District, string>> = {
  north: 'צפון',
  haifa: 'חיפה',
  center: 'מרכז',
  telaviv: 'תל אביב',
  jerusalem: 'ירושלים',
  south: 'דרום',
  'judea-samaria': 'יהודה ושומרון',
};

export const LOCALITIES: readonly Locality[] = [
  { id: 'kiryat-shmona', name: 'קריית שמונה', lat: 33.2072, lng: 35.5695, district: 'north' },
  { id: 'shlomi', name: 'שלומי', lat: 33.0728, lng: 35.145, district: 'north' },
  { id: 'nahariya', name: 'נהריה', lat: 33.0058, lng: 35.0948, district: 'north' },
  { id: 'maalot-tarshiha', name: 'מעלות-תרשיחא', lat: 33.0167, lng: 35.2833, district: 'north' },
  { id: 'katzrin', name: 'קצרין', lat: 32.9917, lng: 35.6889, district: 'north' },
  { id: 'safed', name: 'צפת', lat: 32.9646, lng: 35.496, district: 'north' },
  { id: 'hatzor-haglilit', name: 'חצור הגלילית', lat: 32.98, lng: 35.545, district: 'north' },
  { id: 'rosh-pina', name: 'ראש פינה', lat: 32.9686, lng: 35.5422, district: 'north' },
  { id: 'akko', name: 'עכו', lat: 32.9281, lng: 35.0818, district: 'north' },
  { id: 'karmiel', name: 'כרמיאל', lat: 32.9186, lng: 35.2961, district: 'north' },
  { id: 'sakhnin', name: 'סח׳נין', lat: 32.8644, lng: 35.2969, district: 'north' },
  { id: 'tamra', name: 'טמרה', lat: 32.8536, lng: 35.1978, district: 'north' },
  { id: 'shefaram', name: 'שפרעם', lat: 32.8056, lng: 35.1697, district: 'north' },
  { id: 'tiberias', name: 'טבריה', lat: 32.794, lng: 35.53, district: 'north' },
  { id: 'nazareth', name: 'נצרת', lat: 32.701, lng: 35.3035, district: 'north' },
  { id: 'nof-hagalil', name: 'נוף הגליל', lat: 32.7, lng: 35.32, district: 'north' },
  { id: 'kfar-tavor', name: 'כפר תבור', lat: 32.6861, lng: 35.4108, district: 'north' },
  { id: 'migdal-haemek', name: 'מגדל העמק', lat: 32.6753, lng: 35.24, district: 'north' },
  { id: 'afula', name: 'עפולה', lat: 32.6078, lng: 35.2897, district: 'north' },
  { id: 'beit-shean', name: 'בית שאן', lat: 32.4969, lng: 35.4997, district: 'north' },

  { id: 'haifa', name: 'חיפה', lat: 32.794, lng: 34.9896, district: 'haifa' },
  { id: 'kiryat-motzkin', name: 'קריית מוצקין', lat: 32.8394, lng: 35.0736, district: 'haifa' },
  { id: 'kiryat-yam', name: 'קריית ים', lat: 32.8478, lng: 35.0678, district: 'haifa' },
  { id: 'kiryat-bialik', name: 'קריית ביאליק', lat: 32.8272, lng: 35.0864, district: 'haifa' },
  { id: 'kiryat-ata', name: 'קריית אתא', lat: 32.8114, lng: 35.1128, district: 'haifa' },
  { id: 'nesher', name: 'נשר', lat: 32.7656, lng: 35.0439, district: 'haifa' },
  { id: 'tirat-carmel', name: 'טירת כרמל', lat: 32.7606, lng: 34.9714, district: 'haifa' },
  { id: 'daliyat-al-karmel', name: 'דאלית אל-כרמל', lat: 32.6944, lng: 35.0472, district: 'haifa' },
  { id: 'yokneam', name: 'יקנעם עילית', lat: 32.6558, lng: 35.1103, district: 'haifa' },
  { id: 'atlit', name: 'עתלית', lat: 32.6889, lng: 34.9394, district: 'haifa' },
  { id: 'fureidis', name: 'פוריידיס', lat: 32.6, lng: 34.95, district: 'haifa' },
  { id: 'zichron-yaakov', name: 'זכרון יעקב', lat: 32.5731, lng: 34.9528, district: 'haifa' },
  { id: 'jisr-az-zarqa', name: 'ג׳סר א-זרקא', lat: 32.5375, lng: 34.9111, district: 'haifa' },
  { id: 'binyamina', name: 'בנימינה-גבעת עדה', lat: 32.5142, lng: 34.9486, district: 'haifa' },
  { id: 'umm-al-fahm', name: 'אום אל-פחם', lat: 32.5194, lng: 35.1522, district: 'haifa' },
  { id: 'or-akiva', name: 'אור עקיבא', lat: 32.5083, lng: 34.9167, district: 'haifa' },
  { id: 'caesarea', name: 'קיסריה', lat: 32.5, lng: 34.9, district: 'haifa' },
  { id: 'pardes-hanna', name: 'פרדס חנה-כרכור', lat: 32.475, lng: 34.9667, district: 'haifa' },
  { id: 'hadera', name: 'חדרה', lat: 32.434, lng: 34.9196, district: 'haifa' },
  { id: 'baqa-al-gharbiyye', name: 'באקה אל-גרבייה', lat: 32.4167, lng: 35.0333, district: 'haifa' },

  { id: 'kfar-yona', name: 'כפר יונה', lat: 32.3178, lng: 34.9358, district: 'center' },
  { id: 'netanya', name: 'נתניה', lat: 32.3215, lng: 34.8532, district: 'center' },
  { id: 'kadima-tzoran', name: 'קדימה-צורן', lat: 32.2833, lng: 34.9167, district: 'center' },
  { id: 'qalansawe', name: 'קלנסווה', lat: 32.2856, lng: 34.9822, district: 'center' },
  { id: 'even-yehuda', name: 'אבן יהודה', lat: 32.2708, lng: 34.8878, district: 'center' },
  { id: 'taibe', name: 'טייבה', lat: 32.2667, lng: 35.0072, district: 'center' },
  { id: 'tel-mond', name: 'תל מונד', lat: 32.25, lng: 34.9167, district: 'center' },
  { id: 'tira', name: 'טירה', lat: 32.2333, lng: 34.95, district: 'center' },
  { id: 'kochav-yair', name: 'כוכב יאיר', lat: 32.2242, lng: 34.9908, district: 'center' },
  { id: 'raanana', name: 'רעננה', lat: 32.1848, lng: 34.8713, district: 'center' },
  { id: 'kfar-saba', name: 'כפר סבא', lat: 32.175, lng: 34.907, district: 'center' },
  { id: 'hod-hasharon', name: 'הוד השרון', lat: 32.15, lng: 34.8892, district: 'center' },
  { id: 'jaljulia', name: 'ג׳לג׳וליה', lat: 32.1531, lng: 34.9506, district: 'center' },
  { id: 'kfar-qasim', name: 'כפר קאסם', lat: 32.1147, lng: 34.9764, district: 'center' },
  { id: 'rosh-haayin', name: 'ראש העין', lat: 32.0956, lng: 34.9567, district: 'center' },
  { id: 'petah-tikva', name: 'פתח תקווה', lat: 32.0878, lng: 34.8878, district: 'center' },
  { id: 'elad', name: 'אלעד', lat: 32.0522, lng: 34.9511, district: 'center' },
  { id: 'shoham', name: 'שוהם', lat: 31.9992, lng: 34.9469, district: 'center' },
  { id: 'yehud', name: 'יהוד-מונוסון', lat: 32.0333, lng: 34.8833, district: 'center' },
  { id: 'lod', name: 'לוד', lat: 31.9515, lng: 34.8953, district: 'center' },
  { id: 'ramla', name: 'רמלה', lat: 31.9293, lng: 34.8667, district: 'center' },
  { id: 'modiin', name: 'מודיעין-מכבים-רעות', lat: 31.8928, lng: 35.0104, district: 'center' },
  { id: 'rishon-lezion', name: 'ראשון לציון', lat: 31.973, lng: 34.8066, district: 'center' },
  { id: 'nes-ziona', name: 'נס ציונה', lat: 31.9293, lng: 34.7986, district: 'center' },
  { id: 'rehovot', name: 'רחובות', lat: 31.8928, lng: 34.8113, district: 'center' },
  { id: 'yavne', name: 'יבנה', lat: 31.8783, lng: 34.7386, district: 'center' },
  { id: 'mazkeret-batya', name: 'מזכרת בתיה', lat: 31.8514, lng: 34.8361, district: 'center' },
  { id: 'kiryat-ekron', name: 'קריית עקרון', lat: 31.8664, lng: 34.8203, district: 'center' },
  { id: 'gedera', name: 'גדרה', lat: 31.8136, lng: 34.7794, district: 'center' },
  { id: 'gan-yavne', name: 'גן יבנה', lat: 31.7869, lng: 34.7053, district: 'center' },

  { id: 'tel-aviv', name: 'תל אביב-יפו', lat: 32.0853, lng: 34.7818, district: 'telaviv' },
  { id: 'herzliya', name: 'הרצליה', lat: 32.1624, lng: 34.8447, district: 'telaviv' },
  { id: 'ramat-hasharon', name: 'רמת השרון', lat: 32.1461, lng: 34.8394, district: 'telaviv' },
  { id: 'bnei-brak', name: 'בני ברק', lat: 32.0807, lng: 34.8338, district: 'telaviv' },
  { id: 'ramat-gan', name: 'רמת גן', lat: 32.0684, lng: 34.8248, district: 'telaviv' },
  { id: 'givatayim', name: 'גבעתיים', lat: 32.0723, lng: 34.8103, district: 'telaviv' },
  { id: 'kiryat-ono', name: 'קריית אונו', lat: 32.0553, lng: 34.8553, district: 'telaviv' },
  { id: 'ganei-tikva', name: 'גני תקווה', lat: 32.0642, lng: 34.8722, district: 'telaviv' },
  { id: 'or-yehuda', name: 'אור יהודה', lat: 32.0308, lng: 34.8553, district: 'telaviv' },
  { id: 'azor', name: 'אזור', lat: 32.0272, lng: 34.8028, district: 'telaviv' },
  { id: 'holon', name: 'חולון', lat: 32.0117, lng: 34.7725, district: 'telaviv' },
  { id: 'bat-yam', name: 'בת ים', lat: 32.0171, lng: 34.7457, district: 'telaviv' },

  { id: 'jerusalem', name: 'ירושלים', lat: 31.7683, lng: 35.2137, district: 'jerusalem' },
  { id: 'mevaseret-zion', name: 'מבשרת ציון', lat: 31.7981, lng: 35.1508, district: 'jerusalem' },
  { id: 'beit-shemesh', name: 'בית שמש', lat: 31.7497, lng: 34.9887, district: 'jerusalem' },

  { id: 'ariel', name: 'אריאל', lat: 32.1056, lng: 35.1872, district: 'judea-samaria' },
  { id: 'karnei-shomron', name: 'קרני שומרון', lat: 32.1731, lng: 35.0964, district: 'judea-samaria' },
  { id: 'oranit', name: 'אורנית', lat: 32.12, lng: 34.995, district: 'judea-samaria' },
  { id: 'elkana', name: 'אלקנה', lat: 32.1097, lng: 35.0, district: 'judea-samaria' },
  { id: 'modiin-illit', name: 'מודיעין עילית', lat: 31.9333, lng: 35.0417, district: 'judea-samaria' },
  { id: 'givat-zeev', name: 'גבעת זאב', lat: 31.8619, lng: 35.1697, district: 'judea-samaria' },
  { id: 'maale-adumim', name: 'מעלה אדומים', lat: 31.7772, lng: 35.2975, district: 'judea-samaria' },
  { id: 'beitar-illit', name: 'ביתר עילית', lat: 31.6969, lng: 35.1236, district: 'judea-samaria' },
  { id: 'efrat', name: 'אפרת', lat: 31.6547, lng: 35.1494, district: 'judea-samaria' },
  { id: 'kiryat-arba', name: 'קריית ארבע', lat: 31.5322, lng: 35.1147, district: 'judea-samaria' },

  { id: 'ashdod', name: 'אשדוד', lat: 31.8014, lng: 34.6435, district: 'south' },
  { id: 'kiryat-malachi', name: 'קריית מלאכי', lat: 31.73, lng: 34.7472, district: 'south' },
  { id: 'ashkelon', name: 'אשקלון', lat: 31.6688, lng: 34.5742, district: 'south' },
  { id: 'kiryat-gat', name: 'קריית גת', lat: 31.61, lng: 34.7642, district: 'south' },
  { id: 'sderot', name: 'שדרות', lat: 31.525, lng: 34.5964, district: 'south' },
  { id: 'netivot', name: 'נתיבות', lat: 31.4222, lng: 34.5883, district: 'south' },
  { id: 'rahat', name: 'רהט', lat: 31.3925, lng: 34.7542, district: 'south' },
  { id: 'lehavim', name: 'להבים', lat: 31.3717, lng: 34.8172, district: 'south' },
  { id: 'ofakim', name: 'אופקים', lat: 31.3128, lng: 34.6203, district: 'south' },
  { id: 'meitar', name: 'מיתר', lat: 31.3236, lng: 34.9333, district: 'south' },
  { id: 'lakiya', name: 'לקיה', lat: 31.3236, lng: 34.8631, district: 'south' },
  { id: 'hura', name: 'חורה', lat: 31.3, lng: 34.95, district: 'south' },
  { id: 'omer', name: 'עומר', lat: 31.2681, lng: 34.8497, district: 'south' },
  { id: 'beer-sheva', name: 'באר שבע', lat: 31.253, lng: 34.7915, district: 'south' },
  { id: 'arad', name: 'ערד', lat: 31.2589, lng: 35.2128, district: 'south' },
  { id: 'tel-sheva', name: 'תל שבע', lat: 31.2542, lng: 34.8425, district: 'south' },
  { id: 'ksseife', name: 'כסייפה', lat: 31.2361, lng: 35.0972, district: 'south' },
  { id: 'ararat-hanegev', name: 'ערערה בנגב', lat: 31.2094, lng: 35.0106, district: 'south' },
  { id: 'segev-shalom', name: 'שגב שלום', lat: 31.1928, lng: 34.8422, district: 'south' },
  { id: 'dimona', name: 'דימונה', lat: 31.0686, lng: 35.0333, district: 'south' },
  { id: 'yeruham', name: 'ירוחם', lat: 30.9878, lng: 34.9297, district: 'south' },
  { id: 'mitzpe-ramon', name: 'מצפה רמון', lat: 30.6094, lng: 34.8014, district: 'south' },
  { id: 'eilat', name: 'אילת', lat: 29.5581, lng: 34.9482, district: 'south' },
];

export function findLocality(id: string): Locality | undefined {
  return LOCALITIES.find((l) => l.id === id);
}

export function distanceKm(
  a: Pick<Locality, 'lat' | 'lng'>,
  b: Pick<Locality, 'lat' | 'lng'>,
): number {
  const R = 6371;
  const toRad = (deg: number): number => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function localitiesWithin(
  point: Pick<Locality, 'lat' | 'lng'>,
  radiusKm: number,
): readonly Locality[] {
  return LOCALITIES.map((l) => ({ l, d: distanceKm(point, l) }))
    .filter(({ d }) => d <= radiusKm)
    .sort((a, b) => a.d - b.d)
    .map(({ l }) => l);
}
