/** Versículos (Reina-Valera 1960) elegidos para disciplina, pureza y fe. */
export interface Verse {
  ref: string;
  text: string;
  tags: ("pureza" | "disciplina" | "fe" | "perdon" | "dinero" | "fuerza")[];
}

export const VERSES: Verse[] = [
  { ref: "1 Corintios 10:13", tags: ["pureza", "fuerza"], text: "No os ha sobrevenido ninguna tentación que no sea humana; pero fiel es Dios, que no os dejará ser tentados más de lo que podéis resistir, sino que dará también juntamente con la tentación la salida, para que podáis soportar." },
  { ref: "Salmos 119:9", tags: ["pureza"], text: "¿Con qué limpiará el joven su camino? Con guardar tu palabra." },
  { ref: "Mateo 5:8", tags: ["pureza"], text: "Bienaventurados los de limpio corazón, porque ellos verán a Dios." },
  { ref: "1 Corintios 6:18", tags: ["pureza"], text: "Huid de la fornicación. Cualquier otro pecado que el hombre cometa, está fuera del cuerpo; mas el que fornica, contra su propio cuerpo peca." },
  { ref: "1 Corintios 6:19-20", tags: ["pureza"], text: "¿O ignoráis que vuestro cuerpo es templo del Espíritu Santo, el cual está en vosotros, el cual tenéis de Dios, y que no sois vuestros? Porque habéis sido comprados por precio; glorificad, pues, a Dios en vuestro cuerpo y en vuestro espíritu, los cuales son de Dios." },
  { ref: "Job 31:1", tags: ["pureza"], text: "Hice pacto con mis ojos; ¿cómo, pues, había yo de mirar a una virgen?" },
  { ref: "Salmos 101:3", tags: ["pureza"], text: "No pondré delante de mis ojos cosa injusta." },
  { ref: "Gálatas 5:16", tags: ["pureza"], text: "Digo, pues: Andad en el Espíritu, y no satisfagáis los deseos de la carne." },
  { ref: "Santiago 4:7", tags: ["pureza", "fuerza"], text: "Someteos, pues, a Dios; resistid al diablo, y huirá de vosotros." },
  { ref: "2 Timoteo 2:22", tags: ["pureza"], text: "Huye también de las pasiones juveniles, y sigue la justicia, la fe, el amor y la paz, con los que de corazón limpio invocan al Señor." },
  { ref: "Salmos 51:10", tags: ["pureza", "perdon"], text: "Crea en mí, oh Dios, un corazón limpio, y renueva un espíritu recto dentro de mí." },
  { ref: "1 Juan 1:9", tags: ["perdon"], text: "Si confesamos nuestros pecados, él es fiel y justo para perdonar nuestros pecados, y limpiarnos de toda maldad." },
  { ref: "Romanos 8:1", tags: ["perdon"], text: "Ahora, pues, ninguna condenación hay para los que están en Cristo Jesús, los que no andan conforme a la carne, sino conforme al Espíritu." },
  { ref: "2 Corintios 5:17", tags: ["perdon", "fe"], text: "De modo que si alguno está en Cristo, nueva criatura es; las cosas viejas pasaron; he aquí todas son hechas nuevas." },
  { ref: "Lamentaciones 3:22-23", tags: ["perdon", "fe"], text: "Por la misericordia de Jehová no hemos sido consumidos, porque nunca decayeron sus misericordias. Nuevas son cada mañana; grande es tu fidelidad." },
  { ref: "Proverbios 24:16", tags: ["perdon", "fuerza"], text: "Porque siete veces cae el justo, y vuelve a levantarse; mas los impíos caerán en el mal." },
  { ref: "Filipenses 3:13-14", tags: ["fuerza", "disciplina"], text: "Hermanos, yo mismo no pretendo haberlo ya alcanzado; pero una cosa hago: olvidando ciertamente lo que queda atrás, y extendiéndome a lo que está delante, prosigo a la meta, al premio del supremo llamamiento de Dios en Cristo Jesús." },
  { ref: "Filipenses 4:13", tags: ["fuerza"], text: "Todo lo puedo en Cristo que me fortalece." },
  { ref: "2 Timoteo 1:7", tags: ["fuerza", "disciplina"], text: "Porque no nos ha dado Dios espíritu de cobardía, sino de poder, de amor y de dominio propio." },
  { ref: "Isaías 40:31", tags: ["fuerza"], text: "Pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán." },
  { ref: "Josué 1:9", tags: ["fuerza"], text: "Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes, porque Jehová tu Dios estará contigo en dondequiera que vayas." },
  { ref: "Isaías 41:10", tags: ["fuerza", "fe"], text: "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia." },
  { ref: "Romanos 12:2", tags: ["disciplina", "pureza"], text: "No os conforméis a este siglo, sino transformaos por medio de la renovación de vuestro entendimiento, para que comprobéis cuál sea la buena voluntad de Dios, agradable y perfecta." },
  { ref: "1 Corintios 9:27", tags: ["disciplina"], text: "Sino que golpeo mi cuerpo, y lo pongo en servidumbre, no sea que habiendo sido heraldo para otros, yo mismo venga a ser eliminado." },
  { ref: "Hebreos 12:11", tags: ["disciplina"], text: "Es verdad que ninguna disciplina al presente parece ser causa de gozo, sino de tristeza; pero después da fruto apacible de justicia a los que en ella han sido ejercitados." },
  { ref: "Proverbios 6:9-11", tags: ["disciplina"], text: "Perezoso, ¿hasta cuándo has de dormir? ¿Cuándo te levantarás de tu sueño? Un poco de sueño, un poco de dormitar, y cruzar por un poco las manos para reposo; así vendrá tu necesidad como caminante, y tu pobreza como hombre armado." },
  { ref: "Proverbios 13:4", tags: ["disciplina"], text: "El alma del perezoso desea, y nada alcanza; mas el alma de los diligentes será prosperada." },
  { ref: "Colosenses 3:23", tags: ["disciplina"], text: "Y todo lo que hagáis, hacedlo de corazón, como para el Señor y no para los hombres." },
  { ref: "Efesios 5:15-16", tags: ["disciplina"], text: "Mirad, pues, con diligencia cómo andéis, no como necios sino como sabios, aprovechando bien el tiempo, porque los días son malos." },
  { ref: "Salmos 90:12", tags: ["disciplina", "fe"], text: "Enséñanos de tal modo a contar nuestros días, que traigamos al corazón sabiduría." },
  { ref: "Eclesiastés 9:10", tags: ["disciplina"], text: "Todo lo que te viniere a la mano para hacer, hazlo según tus fuerzas." },
  { ref: "Proverbios 4:23", tags: ["pureza", "disciplina"], text: "Sobre toda cosa guardada, guarda tu corazón; porque de él mana la vida." },
  { ref: "1 Timoteo 4:8", tags: ["disciplina"], text: "Porque el ejercicio corporal para poco es provechoso, pero la piedad para todo aprovecha, pues tiene promesa de esta vida presente, y de la venidera." },
  { ref: "Salmos 5:3", tags: ["fe", "disciplina"], text: "Oh Jehová, de mañana oirás mi voz; de mañana me presentaré delante de ti, y esperaré." },
  { ref: "Marcos 1:35", tags: ["fe", "disciplina"], text: "Levantándose muy de mañana, siendo aún muy oscuro, salió y se fue a un lugar desierto, y allí oraba." },
  { ref: "Proverbios 3:5-6", tags: ["fe"], text: "Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas." },
  { ref: "Mateo 6:33", tags: ["fe", "dinero"], text: "Mas buscad primeramente el reino de Dios y su justicia, y todas estas cosas os serán añadidas." },
  { ref: "Mateo 11:28", tags: ["fe"], text: "Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar." },
  { ref: "Salmos 46:1", tags: ["fe", "fuerza"], text: "Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones." },
  { ref: "Filipenses 4:6-7", tags: ["fe"], text: "Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias. Y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús." },
  { ref: "Proverbios 21:5", tags: ["dinero", "disciplina"], text: "Los pensamientos del diligente ciertamente tienden a la abundancia; mas todo el que se apresura alocadamente, de cierto va a la pobreza." },
  { ref: "Proverbios 6:6-8", tags: ["dinero", "disciplina"], text: "Ve a la hormiga, oh perezoso, mira sus caminos, y sé sabio; la cual no teniendo capitán, ni gobernador, ni señor, prepara en el verano su comida, y recoge en el tiempo de la siega su mantenimiento." },
  { ref: "Proverbios 22:7", tags: ["dinero"], text: "El rico se enseñorea de los pobres, y el que toma prestado es siervo del que presta." },
  { ref: "Proverbios 16:3", tags: ["dinero", "fe"], text: "Encomienda a Jehová tus obras, y tus pensamientos serán afirmados." },
  { ref: "Lucas 16:10", tags: ["dinero", "disciplina"], text: "El que es fiel en lo muy poco, también en lo más es fiel; y el que en lo muy poco es injusto, también en lo más es injusto." },
  { ref: "Romanos 5:3-4", tags: ["fuerza"], text: "Y no sólo esto, sino que también nos gloriamos en las tribulaciones, sabiendo que la tribulación produce paciencia; y la paciencia, prueba; y la prueba, esperanza." },
  { ref: "Hebreos 12:1", tags: ["disciplina", "pureza"], text: "Despojémonos de todo peso y del pecado que nos asedia, y corramos con paciencia la carrera que tenemos por delante." },
  { ref: "Gálatas 6:9", tags: ["fuerza", "disciplina"], text: "No nos cansemos, pues, de hacer bien; porque a su tiempo segaremos, si no desmayamos." },
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function verseForDay(ymd: string): Verse {
  return VERSES[hash(ymd) % VERSES.length];
}

export function versesByTag(tag: Verse["tags"][number]): Verse[] {
  return VERSES.filter((v) => v.tags.includes(tag));
}
