const DATABASE = {
    rarities: {
        common: { name: 'Comum', color: '#95a5a6', glow: 'rgba(149, 165, 166, 0.4)', hpMult: 1.0 },
        uncommon: { name: 'Incomum', color: '#2ecc71', glow: 'rgba(46, 204, 113, 0.4)', hpMult: 1.15 },
        rare: { name: 'Raro', color: '#3498db', glow: 'rgba(52, 152, 219, 0.4)', hpMult: 1.35 },
        epic: { name: 'Épico', color: '#9b59b6', glow: 'rgba(155, 89, 182, 0.5)', hpMult: 1.80 },
        legendary: { name: 'Lendário', color: '#f1c40f', glow: 'rgba(241, 196, 15, 0.6)', hpMult: 2.50 }
    },

    traits: {
        insatiable: { id: 'insatiable', name: 'Insaciável', desc: 'Regenera 5% de HP após cada dia sem estudo.', icon: 'fa-droplet' },
        resistant: { id: 'resistant', name: 'Resistente', desc: '+20% de HP total.', icon: 'fa-shield', hpBonus: 1.20 },
        proud: { id: 'proud', name: 'Orgulhoso', desc: 'Se derrotado em menos de 3 dias, concede loot adicional.', icon: 'fa-crown' },
        relentless: { id: 'relentless', name: 'Implacável', desc: '+15% de dano exigido nas sessões.', icon: 'fa-skull' },
        colossal: { id: 'colossal', name: 'Colossal', desc: '+40% de XP concedido ao ser destruído.', icon: 'fa-mountain' },
        eternal: { id: 'eternal', name: 'Eterno', desc: 'Imune a qualquer tipo de regeneração.', icon: 'fa-infinity' },
        volatile: { id: 'volatile', name: 'Inconstante', desc: 'Flutuações imprevisíveis no combate.', icon: 'fa-bolt' }
    },

    attributesMeta: {
        poder: { name: 'Poder', icon: '⚔️', desc: 'Aumenta o dano base causado aos Bosses em +1% por ponto.' },
        intelecto: { name: 'Intelecto', icon: '🧠', desc: 'Aumenta o XP ganho em todas as sessões em +1% por ponto.' },
        foco: { name: 'Foco', icon: '⚡', desc: 'Melhora o desempenho de sessões de 50m+ e amplia o dano de acertos críticos.' },
        precisao: { name: 'Precisão', icon: '🎯', desc: 'Aumenta o dano e recompensas em sessões de questões e recuperação ativa.' },
        retencao: { name: 'Retenção', icon: '📖', desc: 'Aumenta a eficiência de revisões, flashcards e velocidade de ganho de Domínio.' },
        resistencia: { name: 'Resistência', icon: '🛡️', desc: 'Reduz penalidades de fadiga ao realizar múltiplas sessões no mesmo dia.' },
        fortuna: { name: 'Fortuna', icon: '🍀', desc: 'Aumenta a chance de obter equipamentos Épicos e Lendários ao derrotar Bosses.' }
    },

    bossPool: {
        common: [
            'O Devorador de Eras', 'O Senhor do Vazio', 'O Arauto das Cinzas', 'A Besta Sem Nome',
            'O Colosso Errante', 'O Guardião Esquecido', 'O Rei das Ruínas', 'O Devorador de Mundos',
            'A Fera do Abismo', 'O Vigia Eterno', 'O Ceifador Silencioso', 'O Titã Adormecido',
            'O Andarilho Negro', 'A Serpente Primordial', 'O Carrasco de Ferro', 'O Senhor das Profundezas',
            'O Monarca Caído', 'O Devorador de Sonhos', 'O Colosso das Sombras', 'O Último Guardião'
        ],
        rare: [
            'O Rei Sem Trono', 'A Morte Que Caminha', 'O Arquiteto do Vazio', 'O Filho do Abismo',
            'O Devorador de Estrelas', 'O Imperador das Cinzas', 'O Deus Esquecido', 'O Senhor do Fim',
            'A Coroa Negra', 'O Arauto do Último Dia', 'O Titã do Eclipse', 'O Monarca do Abismo',
            'A Besta Primordial', 'O Olho Que Tudo Vê', 'O Rei das Mil Faces'
        ],
        epic: [
            'O Monarca do Fim', 'A Alma Devorada', 'O Juiz Abissal', 'O Flagelo Eterno',
            'O Senhor da Ruína Absoluta', 'A Forja das Almas', 'O Soberano das Trevas'
        ],
        legendary: [
            'O Último Rei', 'A Entidade', 'O Vazio', 'O Fim', 'O Inominável',
            'O Eterno', 'O Devorador de Deuses', 'Aquele Que Permanece', 'O Primeiro', 'O Último'
        ]
    },

    bossIcons: [
        'https://api.iconify.design/game-icons/grim-reaper.svg?color=%23e74c3c',
        'https://api.iconify.design/game-icons/horned-skull.svg?color=%23c0392b',
        'https://api.iconify.design/game-icons/beast-eye.svg?color=%239b59b6',
        'https://api.iconify.design/game-icons/evil-comet.svg?color=%23e67e22',
        'https://api.iconify.design/game-icons/abacus.svg?color=%233498db',
        'https://api.iconify.design/game-icons/death-skull.svg?color=%23f1c40f',
        'https://api.iconify.design/game-icons/cultist.svg?color=%231abc9c',
        'https://api.iconify.design/game-icons/drakkar-dragon.svg?color=%23e74c3c'
    ],

    slots: {
        weapon: { name: 'Arma', icon: 'fa-wand-magic-sparkles' },
        grimoire: { name: 'Grimório', icon: 'fa-book-skull' },
        armor: { name: 'Armadura', icon: 'fa-shield-halved' },
        relic: { name: 'Relíquia', icon: 'fa-gem' },
        accessory: { name: 'Acessório', icon: 'fa-stethoscope' },
        ring1: { name: 'Anel 1', icon: 'fa-ring' },
        ring2: { name: 'Anel 2', icon: 'fa-ring' }
    },

    ranks: [
        { level: 1, title: 'Estudante de Medicina', elo: 'Ciclo Básico', icon: 'https://api.iconify.design/game-icons/hood.svg?color=%23d4af37' },
        { level: 5, title: 'Acadêmico Clínico', elo: 'Ciclo Clínico', icon: 'https://api.iconify.design/game-icons/doctor-face.svg?color=%233498db' },
        { level: 12, title: 'Interno de Medicina', elo: 'Internato', icon: 'https://api.iconify.design/game-icons/caduceus.svg?color=%239b59b6' },
        { level: 20, title: 'Médico Residente', elo: 'Residência Médica', icon: 'https://api.iconify.design/game-icons/surgical-mask.svg?color=%23e67e22' },
        { level: 35, title: 'Médico Especialista', elo: 'Corpo Clínico', icon: 'https://api.iconify.design/game-icons/laurel-crown.svg?color=%23f1c40f' },
        { level: 50, title: 'Preceptor / Mestre', elo: 'Lenda Médica', icon: 'https://api.iconify.design/game-icons/crown.svg?color=%23ffffff' }
    ],

    methods: {
        passive_reading: { name: 'Leitura Passiva', damage_per_hour: 500, xp_per_hour: 100 },
        flashcards: { name: 'Flashcards (Anki)', damage_per_hour: 1000, xp_per_hour: 120 },
        questions: { name: 'Resolução de Questões', damage_per_hour: 1500, xp_per_hour: 130 },
        active_combo: { name: 'Combo Ativo / Explicação', damage_per_hour: 2000, xp_per_hour: 150 },
        mock_exam: { name: 'Simulado de Alta Carga', damage_per_hour: 2500, xp_per_hour: 200 }
    },

    trophies: [
        { id: 'first_blood', name: 'Primeira Vitória', desc: 'Derrote seu primeiro Boss Global.', icon: 'fa-skull', check: s => (s.boss.bossesDefeated || 0) >= 1 },
        { id: 'titan_hunter', name: 'Caçador de Titãs', desc: 'Derrote 10 Bosses Globais.', icon: 'fa-shield-halved', check: s => (s.boss.bossesDefeated || 0) >= 10 },
        { id: 'god_slayer', name: 'Matador de Deuses', desc: 'Derrote um Boss de raridade Lendária.', icon: 'fa-crown', check: s => Object.values(s.bestiary || {}).some(b => b.rarity === 'legendary' && b.defeatedCount > 0) },
        { id: 'discipline', name: 'Disciplina Inabalável', desc: 'Alcance uma sequência de 30 dias de foco.', icon: 'fa-fire', check: s => (s.player.consecutiveDays || 1) >= 30 },
        { id: 'centurion', name: 'Centenário Abissal', desc: 'Derrote 100 Bosses em sua jornada.', icon: 'fa-trophy', check: s => (s.boss.bossesDefeated || 0) >= 100 },
        { id: 'erudite', name: 'Erudito Supremo', desc: 'Acumule 100 horas líquidas de estudo.', icon: 'fa-book-open', check: s => {
            const mins = (s.sessions || []).reduce((acc, cur) => acc + (cur.durationMinutes || 0), 0);
            return mins >= 6000;
        }}
    ],

    // ARSENAL MÉDICO FANTÁSTICO: 100% DESVINCULADO DE DISCIPLINAS ESPECÍFICAS
    items: {
        // --- ARMAS ---
        bisturi_anatomista: {
            id: 'bisturi_anatomista',
            name: 'Bisturi do Anatomista',
            slot: 'weapon',
            rarity: 'rare',
            icon: 'https://api.iconify.design/game-icons/scalpel.svg?color=%233498db',
            stats: { poder: 8, foco: 5 },
            effect: 'Sessões contínuas de 50+ minutos causam +10% de Dano adicional.',
            origin: 'Forjado para cortes cirúrgicos de precisão em longos blocos de dissecação.'
        },
        bisturi_cooper: {
            id: 'bisturi_cooper',
            name: 'Bisturi de Cooper',
            slot: 'weapon',
            rarity: 'epic',
            icon: 'https://api.iconify.design/game-icons/broad-dagger.svg?color=%239b59b6',
            stats: { poder: 12, precisao: 8 },
            effect: 'O primeiro golpe de estudo do dia recebe +20% de Dano de impacto.',
            origin: 'Concedido a quem inicia o dia de combate sem hesitação.'
        },
        pinca_hemostatica: {
            id: 'pinca_hemostatica',
            name: 'Pinça Hemostática',
            slot: 'weapon',
            rarity: 'rare',
            icon: 'https://api.iconify.design/game-icons/pincers.svg?color=%233498db',
            stats: { poder: 7, retencao: 5 },
            effect: 'Sessões sequenciais no mesmo dia acumulam +5% de dano progressivo.',
            origin: 'Impede o sangramento de rendimento ao longo do dia.'
        },
        tesoura_mayo: {
            id: 'tesoura_mayo',
            name: 'Tesoura de Mayo',
            slot: 'weapon',
            rarity: 'rare',
            icon: 'https://api.iconify.design/game-icons/scissors.svg?color=%233498db',
            stats: { poder: 5, foco: 5 },
            effect: 'Sessões concluídas sem interrupção causam +12% de Dano extra.',
            origin: 'Corta qualquer distração externa durante o cronômetro.'
        },
        seringa_prata: {
            id: 'seringa_prata',
            name: 'Seringa de Prata',
            slot: 'weapon',
            rarity: 'epic',
            icon: 'https://api.iconify.design/game-icons/syringe.svg?color=%239b59b6',
            stats: { poder: 8, precisao: 5, foco: 5 },
            effect: 'Aumenta significativamente a chance de desferir Golpe Crítico.',
            origin: 'Injeta foco concentrado direto no combate cognitivo.'
        },
        lamina_ultimo_corte: {
            id: 'lamina_ultimo_corte',
            name: 'Lâmina do Último Corte',
            slot: 'weapon',
            rarity: 'legendary',
            icon: 'https://api.iconify.design/game-icons/dripping-blade.svg?color=%23f1c40f',
            stats: { poder: 20, precisao: 12 },
            effect: 'Quando o Boss estiver com < 20% de HP, seus ataques causam +50% de Dano massivo.',
            origin: 'A lâmina final que encerra ciclos de exaustão.'
        },
        lamina_asclepio: {
            id: 'lamina_asclepio',
            name: 'A Lâmina de Asclépio',
            slot: 'weapon',
            rarity: 'legendary',
            icon: 'https://api.iconify.design/game-icons/caduceus.svg?color=%23f1c40f',
            stats: { poder: 22, intelecto: 15, fortuna: 8 },
            effect: 'Cada Boss derrotado consecutivamente amplia o multiplicador de Dano do próximo.',
            origin: 'Forjada pelo pai da medicina para recompensar a persistência contínua.'
        },

        // --- GRIMÓRIOS ---
        grimorio_guyton: {
            id: 'grimorio_guyton',
            name: 'Grimório de Guyton',
            slot: 'grimoire',
            rarity: 'rare',
            icon: 'https://api.iconify.design/game-icons/spell-book.svg?color=%233498db',
            stats: { intelecto: 10, retencao: 6 },
            effect: '+8% de XP permanente obtido em todas as sessões de estudo.',
            origin: 'O tratado fundamental dos mecanismos fisiológicos vitais.'
        },
        codex_katzung: {
            id: 'codex_katzung',
            name: 'Códex de Katzung',
            slot: 'grimoire',
            rarity: 'epic',
            icon: 'https://api.iconify.design/game-icons/book-cover.svg?color=%239b59b6',
            stats: { intelecto: 8, precisao: 10 },
            effect: 'Sessões baseadas no método de Questões concedem +15% de XP adicional.',
            origin: 'Sistematiza o raciocínio diagnóstico e terapêutico.'
        },
        atlas_netter: {
            id: 'atlas_netter',
            name: 'Atlas de Netter',
            slot: 'grimoire',
            rarity: 'rare',
            icon: 'https://api.iconify.design/game-icons/open-book.svg?color=%233498db',
            stats: { retencao: 8, intelecto: 6 },
            effect: 'Aumenta em +15% a eficiência de dano das sessões de revisão.',
            origin: 'Ilustrações arcanas que gravam estruturas na memória fotográfica.'
        },
        grimorio_robbins: {
            id: 'grimorio_robbins',
            name: 'Grimório de Robbins',
            slot: 'grimoire',
            rarity: 'epic',
            icon: 'https://api.iconify.design/game-icons/tome.svg?color=%239b59b6',
            stats: { intelecto: 10, foco: 8 },
            effect: 'Sessões extensas de 90 min (Raid) concedem +25% de XP bônus.',
            origin: 'O peso monumental dos processos patológicos estruturados.'
        },
        grimorio_recuperacao: {
            id: 'grimorio_recuperacao',
            name: 'Grimório da Recuperação',
            slot: 'grimoire',
            rarity: 'epic',
            icon: 'https://api.iconify.design/game-icons/scroll-quill.svg?color=%239b59b6',
            stats: { retencao: 12, precisao: 6 },
            effect: 'Aumenta em +20% a recompensa de atividades de evocação ativa e flashcards.',
            origin: 'Recompensa quem força a mente a resgatar a informação sem consulta.'
        },
        codex_diagnostico: {
            id: 'codex_diagnostico',
            name: 'Códex do Diagnóstico',
            slot: 'grimoire',
            rarity: 'legendary',
            icon: 'https://api.iconify.design/game-icons/white-book.svg?color=%23f1c40f',
            stats: { precisao: 15, intelecto: 15, retencao: 10 },
            effect: 'Corrigir e registrar erros de simulados duplica o ganho de XP daquela sessão.',
            origin: 'A maestria clínica que transforma cada erro em aprendizado consolidado.'
        },

        // --- ARMADURAS ---
        coracao_ferro: {
            id: 'coracao_ferro',
            name: 'Coração de Ferro',
            slot: 'armor',
            rarity: 'rare',
            icon: 'https://api.iconify.design/game-icons/heart-shield.svg?color=%233498db',
            stats: { resistencia: 12, poder: 5 },
            effect: 'Reduz em 20% penalidades de fadiga causadas por longas horas de estudo.',
            origin: 'Um miocárdio blindado contra o esgotamento.'
        },
        manto_persistencia: {
            id: 'manto_persistencia',
            name: 'Manto da Persistência',
            slot: 'armor',
            rarity: 'epic',
            icon: 'https://api.iconify.design/game-icons/cloak-dagger.svg?color=%239b59b6',
            stats: { resistencia: 8, foco: 8 },
            effect: 'Concede +1% de Dano bônus para cada 30 min líquidos estudados no dia.',
            origin: 'Tecido com as horas ininterruptas de vigília e dedicação.'
        },
        calice_disciplina: {
            id: 'calice_disciplina',
            name: 'Armadura da Disciplina',
            slot: 'armor',
            rarity: 'epic',
            icon: 'https://api.iconify.design/game-icons/breastplate.svg?color=%239b59b6',
            stats: { resistencia: 14, intelecto: 6 },
            effect: 'Garante eficiência de 100% mesmo quando a Stamina diária estiver reduzida.',
            origin: 'A couraça inabalável que sobrepuja o cansaço.'
        },

        // --- RELÍQUIAS ---
        ampulheta_foco: {
            id: 'ampulheta_foco',
            name: 'Ampulheta do Foco',
            slot: 'relic',
            rarity: 'rare',
            icon: 'https://api.iconify.design/game-icons/sands-of-time.svg?color=%233498db',
            stats: { foco: 15, retencao: 5 },
            effect: 'Sessões de 50+ minutos recebem +15% de multiplicador de Foco e Dano.',
            origin: 'A areia mágica que flui apenas durante concentração plena.'
        },
        sinapse_dourada: {
            id: 'sinapse_dourada',
            name: 'Sinapse Dourada',
            slot: 'relic',
            rarity: 'epic',
            icon: 'https://api.iconify.design/game-icons/brain.svg?color=%239b59b6',
            stats: { foco: 12, intelecto: 8 },
            effect: 'Amplifica em +20% a eficiência de blocos de foco profundo sem celular.',
            origin: 'O disparo neuroquímico perfeito de um conceito compreendido.'
        },
        medula_eterna: {
            id: 'medula_eterna',
            name: 'Medula Eterna',
            slot: 'relic',
            rarity: 'epic',
            icon: 'https://api.iconify.design/game-icons/drop-weapon.svg?color=%239b59b6',
            stats: { resistencia: 10, retencao: 8 },
            effect: 'Regenera automaticamente 10 pontos de Stamina ao concluir qualquer sessão.',
            origin: 'A fonte hematopoiética inesgotável de vitalidade.'
        },
        cerebro_mnemosyne: {
            id: 'cerebro_mnemosyne',
            name: 'Cérebro de Mnemosyne',
            slot: 'relic',
            rarity: 'legendary',
            icon: 'https://api.iconify.design/game-icons/mind-slice.svg?color=%23f1c40f',
            stats: { retencao: 20, intelecto: 10 },
            effect: 'Uma vez por dia, sua primeira sessão de revisão recebe +50% de eficiência.',
            origin: 'A relíquia da deusa da memória que impede o declínio da curva de esquecimento.'
        },
        olho_hipocrates: {
            id: 'olho_hipocrates',
            name: 'Olho de Hipócrates',
            slot: 'relic',
            rarity: 'legendary',
            icon: 'https://api.iconify.design/game-icons/all-seeing-eye.svg?color=%23f1c40f',
            stats: { precisao: 18, foco: 12, fortuna: 8 },
            effect: 'Garante acerto crítico em todas as sessões baseadas em Questões Clínicas.',
            origin: 'Enxerga o cerne de qualquer enunciado em fração de segundos.'
        },
        ampulheta_mnemosyne: {
            id: 'ampulheta_mnemosyne',
            name: 'A Ampulheta de Mnemosyne',
            slot: 'relic',
            rarity: 'legendary',
            icon: 'https://api.iconify.design/game-icons/hourglass.svg?color=%23f1c40f',
            stats: { foco: 18, poder: 12 },
            effect: 'Quanto maior a duração de uma sessão ininterrupta, exponencialmente maior o dano final.',
            origin: 'Controla a dilatação temporal dos períodos de estudo profundo.'
        },
        orbe_conhecimento: {
            id: 'orbe_conhecimento',
            name: 'Orbe do Conhecimento',
            slot: 'relic',
            rarity: 'legendary',
            icon: 'https://api.iconify.design/game-icons/orb-direction.svg?color=%23f1c40f',
            stats: { intelecto: 12, retencao: 12, poder: 10 },
            effect: 'Concede bônus passivo universal de +10% de Dano, +10% de XP e +10% de Retenção.',
            origin: 'A síntese de todos os saberes biomédicos condensados em uma esfera arcana.'
        },

        // --- ACESSÓRIOS ---
        estetoscopio_laennec: {
            id: 'estetoscopio_laennec',
            name: 'Estetoscópio de Laennec',
            slot: 'accessory',
            rarity: 'legendary',
            icon: 'https://api.iconify.design/game-icons/stethoscope.svg?color=%23f1c40f',
            stats: { precisao: 14, intelecto: 10 },
            effect: 'Sessões de 60+ minutos recebem um multiplicador adicional de +25% de XP.',
            origin: 'O primeiro instrumento a auscultar os segredos ocultos no corpo humano.'
        },
        estetoscopio_clinico: {
            id: 'estetoscopio_clinico',
            name: 'Estetoscópio do Clínico',
            slot: 'accessory',
            rarity: 'rare',
            icon: 'https://api.iconify.design/game-icons/stethoscope.svg?color=%233498db',
            stats: { precisao: 10, poder: 6 },
            effect: '+12% de Dano ao estudar através de Questões e Casos Clínicos.',
            origin: 'O companheiro inseparável do médico em sua rotina diagnóstica.'
        },
        microscopio_patologista: {
            id: 'microscopio_patologista',
            name: 'Microscópio do Patologista',
            slot: 'accessory',
            rarity: 'epic',
            icon: 'https://api.iconify.design/game-icons/microscope.svg?color=%239b59b6',
            stats: { precisao: 12, intelecto: 6 },
            effect: 'Aumenta em +15% as recompensas por blocos de questões resolvidas.',
            origin: 'Permite examinar os mínimos detalhes conceituais.'
        },
        relogio_cirurgiao: {
            id: 'relogio_cirurgiao',
            name: 'Relógio do Cirurgião',
            slot: 'accessory',
            rarity: 'rare',
            icon: 'https://api.iconify.design/game-icons/pocket-watch.svg?color=%233498db',
            stats: { foco: 8, precisao: 6 },
            effect: 'Aumenta em +10% a eficiência de sessões com metas de tempo bem definidas.',
            origin: 'Marca a precisão temporal exigida no bloco cirúrgico.'
        },
        lupa_investigador: {
            id: 'lupa_investigador',
            name: 'Lupa do Investigador',
            slot: 'accessory',
            rarity: 'rare',
            icon: 'https://api.iconify.design/game-icons/magnifying-glass.svg?color=%233498db',
            stats: { precisao: 12, retencao: 4 },
            effect: 'Aumenta em +15% a recompensa de XP ao revisar erros de simulados.',
            origin: 'Projetada para esmiuçar pegadinhas e distratores de provas.'
        },
        coroa_clinico: {
            id: 'coroa_clinico',
            name: 'A Coroa do Clínico',
            slot: 'accessory',
            rarity: 'legendary',
            icon: 'https://api.iconify.design/game-icons/laurel-crown.svg?color=%23f1c40f',
            stats: { poder: 10, intelecto: 10, foco: 10, precisao: 10, retencao: 10, resistencia: 10, fortuna: 10 },
            effect: '+10 em todos os atributos permanentes. Amplia todas as recompensas.',
            origin: 'A láurea suprema reservada aos mestres da arte médica.'
        },

        // --- ANÉIS ---
        anel_concentracao: {
            id: 'anel_concentracao',
            name: 'Anel da Concentração',
            slot: 'ring1',
            rarity: 'rare',
            icon: 'https://api.iconify.design/game-icons/ring.svg?color=%233498db',
            stats: { foco: 10, poder: 4 },
            effect: 'Aumenta o dano causado em blocos contínuos sem pausa.',
            origin: 'Emite uma pulsação sutil que afasta a procrastinação.'
        },
        anel_sinapse: {
            id: 'anel_sinapse',
            name: 'Anel da Sinapse',
            slot: 'ring1',
            rarity: 'epic',
            icon: 'https://api.iconify.design/game-icons/ring.svg?color=%239b59b6',
            stats: { intelecto: 10, foco: 6 },
            effect: '+8% de XP em todas as sessões de estudo.',
            origin: 'Acelera a neurotransmissão durante o aprendizado.'
        },
        marcapasso_ancestral: {
            id: 'marcapasso_ancestral',
            name: 'Anel do Marcapasso Ancestral',
            slot: 'ring2',
            rarity: 'rare',
            icon: 'https://api.iconify.design/game-icons/diamond-ring.svg?color=%233498db',
            stats: { poder: 7, resistencia: 7 },
            effect: 'Multiplicador de Streak diário aumentado em +5%.',
            origin: 'Mantém o ritmo cadenciado dos estudos diários ininterrupto.'
        },
        alianca_academico: {
            id: 'alianca_academico',
            name: 'Aliança do Acadêmico',
            slot: 'ring1',
            rarity: 'common',
            icon: 'https://api.iconify.design/game-icons/ring.svg?color=%2395a5a6',
            stats: { poder: 3, intelecto: 3 },
            effect: 'Equipamento básico de ingresso na jornada médica.',
            origin: 'Forjado nos primeiros semestres de dedicação.'
        },
        camara_neubauer: {
            id: 'camara_neubauer',
            name: 'Anel da Câmara de Neubauer',
            slot: 'ring2',
            rarity: 'rare',
            icon: 'https://api.iconify.design/game-icons/ring.svg?color=%233498db',
            stats: { fortuna: 8, precisao: 4 },
            effect: 'Aumenta a probabilidade de obter equipamentos Raros e Épicos.',
            origin: 'Permite quantificar as recompensas ocultas do destino.'
        },
        chave_memoria: {
            id: 'chave_memoria',
            name: 'Chave da Memória',
            slot: 'ring2',
            rarity: 'epic',
            icon: 'https://api.iconify.design/game-icons/key.svg?color=%239b59b6',
            stats: { retencao: 12, intelecto: 6 },
            effect: 'Aumenta em +20% o XP obtido em blocos de flashcards e revisão espaçada.',
            origin: 'Abre os compartimentos profundos da memória de longo prazo.'
        }
    }
};