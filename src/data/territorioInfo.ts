// Datos estáticos por territorio: significado bíblico, lugares y pueblos
// Ciudades: máximo 4 IDs de /public/data/
// Naturales: ríos, mares, montes

export interface TerritoryInfo {
  significado: string
  ciudades: string[]   // IDs de lugar (ciudad)
  naturales: string[]  // IDs de lugar natural
  pueblos: string[]
}

export const TERRITORY_INFO: Record<string, TerritoryInfo> = {

  'Canaan': {
    significado: 'La tierra prometida a Abraham y sus descendientes (Gn 12:7). Escenario de la conquista bajo Josué y del período de los Jueces. Habitada por siete pueblos que Israel debía desplazar según el mandato divino (Dt 7:1).',
    ciudades: ['jericho', 'shechem', 'hebron', 'bethel'],
    naturales: ['salt_sea', 'jabbok'],
    pueblos: ['Cananeos', 'Jebuseos', 'Amorreos', 'Ferezeos', 'Heveos'],
  },

  'Israel': {
    significado: 'El Reino del Norte, formado tras la división bajo Roboam (930 a.C.). Compuesto por diez tribus, con capital en Samaria. Cayó ante Asiria en 722 a.C., dando inicio a la diáspora de las «diez tribus perdidas» (2 R 17:6).',
    ciudades: ['samaria', 'dan', 'bethel', 'shiloh'],
    naturales: ['carmel_mount'],
    pueblos: ['Tribu de Efraín', 'Tribu de Dan', 'Tribu de Neftalí', 'Tribu de Manasés'],
  },

  'Judah': {
    significado: 'El Reino del Sur, gobernado por la dinastía davídica desde Jerusalén. Sobrevivió al colapso del norte pero cayó ante Babilonia en 586 a.C. Sus deportados preservaron la identidad que daría forma al judaísmo postcautiverio (2 R 25).',
    ciudades: ['jerusalen', 'hebron', 'bethlehem', 'lachish'],
    naturales: ['salt_sea'],
    pueblos: ['Judeos', 'Benjaminitas', 'Simeonitas'],
  },

  'Egypt': {
    significado: 'Potencia dominante del sur. Contexto del cautiverio israelita y el Éxodo bajo Moisés (Éx 1–15). Reaparece como refugio en tiempos de Jeremías y como rival estratégico frente a Asiria y Babilonia en los libros proféticos.',
    ciudades: ['memphis', 'on', 'zoan', 'tahpanhes'],
    naturales: [],
    pueblos: ['Egipcios', 'Israelitas (cautiverio)', 'Hicsos'],
  },

  'Assyria': {
    significado: 'El Imperio del norte dominó el Levante desde el siglo IX a.C. Deportó al Reino del Norte (Israel) en 722 a.C. Su sombra recorre Amós, Oseas, Nahúm e Isaías. Nínive, su capital, es el destino de la misión de Jonás (Jon 1:2).',
    ciudades: ['nineveh', 'hamath', 'arpad'],
    naturales: [],
    pueblos: ['Asirios', 'Arameos deportados'],
  },

  'Babylonia': {
    significado: 'Cuna de la civilización bíblica: de Ur partió Abraham (Gn 11:31). Babilonia deportó a Judá en 586 a.C., iniciando el Exilio. Las visiones de Ezequiel y Daniel transcurren junto al río Quebar, a orillas del Imperio.',
    ciudades: ['babylon', 'haran', 'susa'],
    naturales: ['chebar'],
    pueblos: ['Caldeos', 'Babilonios', 'Acadios'],
  },

  'Philistines': {
    significado: 'Pueblo del mar establecido en la costa suroeste de Canaán. Principal antagonista de Israel durante los Jueces y la monarquía temprana. Sus cinco ciudades (Pentápolis filistea) enfrentan a Sansón, Samuel, Saúl y David.',
    ciudades: ['gaza', 'ashdod', 'ashkelon', 'gath'],
    naturales: [],
    pueblos: ['Filisteos', 'Pueblos del Mar'],
  },

  'Phoenicia': {
    significado: 'Maestros del comercio marítimo mediterráneo. Hiram I de Tiro aportó materiales y artesanos para el Templo de Salomón (1 R 5). Su influencia religiosa introdujo el culto a Baal en Israel a través de Jezabel, princesa sidoniana.',
    ciudades: ['tyre', 'sidon'],
    naturales: ['carmel_mount'],
    pueblos: ['Fenicios', 'Cananeos costeros'],
  },

  'Persia': {
    significado: 'Ciro el Grande conquistó Babilonia en 539 a.C. y promulgó el edicto que permitió el retorno de los exiliados judíos (Esd 1:1–4). Contexto de los libros de Ester, Esdras, Nehemías y los últimos capítulos de Daniel.',
    ciudades: ['susa', 'babylon'],
    naturales: [],
    pueblos: ['Persas', 'Medos', 'Judíos del exilio'],
  },

  'Media': {
    significado: 'Reino iranio que junto a Babilonia destruyó Nínive en 612 a.C., poniendo fin al Imperio Asirio. Los profetas lo citan como instrumento del juicio divino sobre Babilonia (Is 13:17; Jr 51:11).',
    ciudades: [],
    naturales: [],
    pueblos: ['Medos', 'Iranios'],
  },

  'Arameans': {
    significado: 'Pueblo semita con capital en Damasco. Rival constante de Israel durante la monarquía dividida. El arameo se convirtió en lingua franca del Creciente Fértil tras la expansión asiria y persiste en partes de Daniel y Esdras.',
    ciudades: ['damascus', 'hamath'],
    naturales: [],
    pueblos: ['Arameos', 'Sirios'],
  },

  'Hittites': {
    significado: 'Gran Imperio de Anatolia durante la Edad de Bronce. Mencionados como habitantes de Canaán (Gn 23) y comerciantes de caballos (1 R 10:29). Urías el hitita, uno de los valientes de David, es el personaje hitita más destacado del AT.',
    ciudades: ['hamath'],
    naturales: [],
    pueblos: ['Hititas', 'Neo-hititas'],
  },

  'Elam': {
    significado: 'Antigua civilización al este de Mesopotamia, con capital en Susa. Invade Canaán en Gn 14. Elamitas aparecen en Pentecostés (Hch 2:9). Su territorio se convirtió en el núcleo del Imperio Persa bajo los aqueménidas.',
    ciudades: ['susa'],
    naturales: [],
    pueblos: ['Elamitas', 'Proto-persas'],
  },

  'Urartu': {
    significado: 'Reino montañoso al norte del lago Van, identificado con el Ararat bíblico donde reposó el arca de Noé (Gn 8:4). Rival del Imperio Asirio en el norte. Sus inscripciones en cuneiforme documentan la presión asiria sobre la región.',
    ciudades: [],
    naturales: [],
    pueblos: ['Urartianos', 'Proto-armenios'],
  },

  'Arabian pastoral nomads': {
    significado: 'Tribus nómadas del desierto que rodean a Israel por el sur y el este. Los ismaelitas compraron a José (Gn 37:25). Los madianitas oprimieron a Israel hasta la victoria de Gedeón (Jue 6). Los amalecitas son el enemigo ancestral de Saúl (1 S 15).',
    ciudades: ['beersheba', 'ezion_geber'],
    naturales: [],
    pueblos: ['Ismaelitas', 'Madianitas', 'Amalecitas'],
  },

  'Greek city-states': {
    significado: 'Mencionadas como «Javán» en la tabla de naciones (Gn 10:2). Tarsis, probable destino de la huida de Jonás. Daniel describe el reino griego como el «macho cabrío» que derrota a Persia (Dn 8), prefigurando a Alejandro Magno.',
    ciudades: ['tarshish'],
    naturales: [],
    pueblos: ['Griegos', 'Javanitas'],
  },

  'Achaemenid Empire': {
    significado: 'El mayor Imperio del mundo antiguo bajo Ciro, Darío y Artajerjes. Su política de tolerancia religiosa permitió la reconstrucción del Templo (Esd 6:3–5). Ester y Nehemías sirven en la corte imperial de Susa.',
    ciudades: ['susa', 'babylon', 'damascus'],
    naturales: [],
    pueblos: ['Persas', 'Medos', 'Judíos de la diáspora'],
  },

  'Kingdom of David and Solomon': {
    significado: 'El reino unificado bajo Saúl, David y Salomón (ca. 1050–930 a.C.). Alcanzó su máxima extensión bajo Salomón. Jerusalén fue capital y sede del primer Templo. La división tras la muerte de Salomón dio origen a Israel y Judá.',
    ciudades: ['jerusalen', 'hebron', 'beersheba', 'dan'],
    naturales: ['salt_sea', 'carmel_mount'],
    pueblos: ['Israelitas', 'Doce tribus', 'Jebuseos asimilados'],
  },

  'Kush': {
    significado: 'Reino al sur de Egipto (actual Sudán). La dinastía kushita (XXV) gobernó Egipto ca. 747–664 a.C. Los profetas lo convocan como aliado potencial de Judá y objeto del juicio divino (Is 18; Sof 3:10; Ez 30:4–5).',
    ciudades: ['thebes', 'memphis'],
    naturales: [],
    pueblos: ['Cushitas', 'Nubios', 'Etíopes'],
  },

}
