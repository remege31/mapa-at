// Datos compartidos de territorios históricos
// Usados en MapView.tsx (render) y App.tsx (búsqueda + panel)

export const TERRITORY_COLORS: Record<string, string> = {
  'Egypt':                   '#C9A84C',
  'Assyria':                 '#8B3A3A',
  'Babylonia':               '#C0522A',
  'Hittites':                '#8B6914',
  'Elam':                    '#7A4A6A',
  'Israel':                  '#8B6A26',
  'Judah':                   '#B8963E',
  'Canaan':                  '#6B8E23',
  'Arameans':                '#8A7B6F',
  'Philistines':             '#8B7355',
  'Phoenicia':               '#4A7A8B',
  'Persia':                  '#A0522D',
  'Media':                   '#7A4A2E',
  'Urartu':                  '#6B4A8B',
  'Arabian pastoral nomads': '#6B6054',
  'Greek city-states':       '#3B6B8B',
  'Achaemenid Empire':                     '#A0522D',
  'Kingdom of David and Solomon':          '#8B6A26',
  'state societies and Aramaean kingdoms': '#8B6914',
  'Cimerians':                             '#6B6054',
  'Iranian pastoralists':                  '#8A7B6F',
  'Saharan pastoral nomads':               '#6B6054',
  'Illyrians':                             '#8A7B6F',
  'Blemmyes':                              '#6B6054',
  'Thrace':                                '#6B4A8B',
  'Kush':                                  '#7A4A6A',
  'Meroe':                                 '#7A4A6A',
  'Bell-shaped burials culture':           '#3B6B8B',
  'Karasuk culture':                       '#4A7A8B',
  'Urnfield cultures':                     '#3B6B8B',
  'Dravidians':                            '#4A7A8B',
  'Phrygians':                             '#8A7B6F',
  'default':                               '#8B7355',
}

export const TERRITORY_TYPE: Record<string, string> = {
  'Egypt':                   'Imperio',
  'Assyria':                 'Imperio',
  'Babylonia':               'Imperio',
  'Persia':                  'Imperio',
  'Hittites':                'Imperio',
  'Media':                   'Imperio',
  'Israel':                  'Reino',
  'Judah':                   'Reino',
  'Elam':                    'Reino',
  'Urartu':                  'Reino',
  'Canaan':                  'Región cultural',
  'Philistines':             'Región cultural',
  'Phoenicia':               'Región cultural',
  'Greek city-states':       'Región cultural',
  'Arameans':                'Zona tribal',
  'Arabian pastoral nomads': 'Zona tribal',
  'Achaemenid Empire':                     'Imperio',
  'Kingdom of David and Solomon':          'Reino',
  'state societies and Aramaean kingdoms': 'Reino',
  'Cimerians':                             'Zona tribal',
  'Iranian pastoralists':                  'Zona tribal',
  'Saharan pastoral nomads':               'Zona tribal',
  'Illyrians':                             'Zona tribal',
  'Blemmyes':                              'Zona tribal',
  'Thrace':                                'Región cultural',
  'Kush':                                  'Reino',
  'Meroe':                                 'Reino',
  'Bell-shaped burials culture':           'Región cultural',
  'Karasuk culture':                       'Región cultural',
  'Urnfield cultures':                     'Región cultural',
  'Dravidians':                            'Región cultural',
  'Phrygians':                             'Zona tribal',
}

export const TERRITORY_NAMES_ES: Record<string, string> = {
  'Egypt':                   'Egipto',
  'Assyria':                 'Asiria',
  'Babylonia':               'Mesopotamia',
  'Hittites':                'Hititas',
  'Elam':                    'Elam',
  'Israel':                  'Israel',
  'Judah':                   'Judá',
  'Canaan':                  'Canaán',
  'Arameans':                'Arameos',
  'Philistines':             'Filisteos',
  'Phoenicia':               'Fenicia',
  'Persia':                  'Persia',
  'Media':                   'Media',
  'Urartu':                  'Urartu',
  'Arabian pastoral nomads': 'Pastores nómadas árabes',
  'Greek city-states':       'Ciudades-estado griegas',
  'Achaemenid Empire':                     'Imperio aqueménida',
  'Kingdom of David and Solomon':          'Reino unido de Israel',
  'state societies and Aramaean kingdoms': 'Reinos arameos',
  'Cimerians':                             'Cimerios',
  'Iranian pastoralists':                  'Pastores nómadas iranios',
  'Saharan pastoral nomads':               'Pastores nómadas del Sahara',
  'Illyrians':                             'Ilirios',
  'Blemmyes':                              'Blemios',
  'Thrace':                                'Tracia',
  'Kush':                                  'Reino de Kush',
  'Meroe':                                 'Reino de Meroë',
  'Bell-shaped burials culture':           'Cultura del vaso campaniforme',
  'Karasuk culture':                       'Cultura de Karasuk',
  'Urnfield cultures':                     'Cultura de los campos de urnas',
  'Dravidians':                            'Drávidas',
  'Phrygians':                             'Frigios',
  'Berbers':                'Bereberes',
  'Saba':                   'Saba',
  'Ethiopian highland farmers': 'Agricultores etíopes',
  'Celtiberians':           'Celtíberos',
  'Carthaginian Empire':    'Imperio cartaginés',
  'Etrurians':              'Etruscos',
  'Rome':                   'Roma',
  'Sabini':                 'Sabinos',
  'Samnites':               'Samnitas',
  'Boii':                   'Boyos',
  'Gandhāra':               'Gandhara',
  'Hindu kingdoms':         'Reinos hindúes',
  'Zhou states':            'Estados Zhou',
  'Saharan Pastoral Nomads': 'Pastores nómadas del Sahara',
}

export function getTerritoryColor(name: string): string {
  for (const key of Object.keys(TERRITORY_COLORS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return TERRITORY_COLORS[key]
    }
  }
  return TERRITORY_COLORS['default']
}

export function getTerritoryType(name: string): string {
  for (const key of Object.keys(TERRITORY_TYPE)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return TERRITORY_TYPE[key]
    }
  }
  return ''
}

export function getTerritoryNameES(name: string): string {
  for (const key of Object.keys(TERRITORY_NAMES_ES)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return TERRITORY_NAMES_ES[key]
    }
  }
  return name
}

// Lista para la búsqueda — solo territorios principales del AT
export const TERRITORY_SEARCH_LIST: { nombreEN: string; nombreES: string }[] = [
  { nombreEN: 'Egypt',                        nombreES: 'Egipto' },
  { nombreEN: 'Assyria',                      nombreES: 'Asiria' },
  { nombreEN: 'Babylonia',                    nombreES: 'Mesopotamia / Babilonia' },
  { nombreEN: 'Hittites',                     nombreES: 'Hititas' },
  { nombreEN: 'Elam',                         nombreES: 'Elam' },
  { nombreEN: 'Israel',                       nombreES: 'Israel (reino)' },
  { nombreEN: 'Judah',                        nombreES: 'Judá (reino)' },
  { nombreEN: 'Canaan',                       nombreES: 'Canaán' },
  { nombreEN: 'Arameans',                     nombreES: 'Arameos' },
  { nombreEN: 'Philistines',                  nombreES: 'Filisteos' },
  { nombreEN: 'Phoenicia',                    nombreES: 'Fenicia' },
  { nombreEN: 'Persia',                       nombreES: 'Persia' },
  { nombreEN: 'Media',                        nombreES: 'Media' },
  { nombreEN: 'Urartu',                       nombreES: 'Urartu' },
  { nombreEN: 'Arabian pastoral nomads',      nombreES: 'Pastores nómadas árabes' },
  { nombreEN: 'Greek city-states',            nombreES: 'Ciudades-estado griegas' },
  { nombreEN: 'Achaemenid Empire',            nombreES: 'Imperio aqueménida' },
  { nombreEN: 'Kingdom of David and Solomon', nombreES: 'Reino unido de Israel' },
  { nombreEN: 'Kush',                         nombreES: 'Reino de Kush' },
]
