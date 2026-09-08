export interface AgentConfig {
  id: string
  name: string
  role: string
  subtitle: string
  desc: string
  avatar: string
  accentColor: 'emerald' | 'rose' | 'violet' | 'amber' | 'cyan' | 'blue'
  badgeColor: string
  apiKeyEnvVar: string
  apiKey: string
  appId: string
  welcomeMessage: string
  suggestedQuestions: string[]
}

export const AGENTS_LIST: AgentConfig[] = [
  {
    id: 'carlos',
    name: 'CARLOS',
    role: 'Director de Operaciones',
    subtitle: 'Ecosistema Studio & MCPs',
    desc: 'Agente que controlará todo el ecosistema de Studio Álvaro Díaz, auditoría y flujos operativos.',
    avatar: 'https://studioalvarodiaz.es/wp-content/uploads/2026/07/Carlos-scaled.jpg',
    accentColor: 'emerald',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    apiKeyEnvVar: 'NEXT_PUBLIC_CARLOS_API_KEY',
    apiKey: process.env.NEXT_PUBLIC_CARLOS_API_KEY || 'app-fIlrxVzyja4bfpRV41YmqI0t',
    appId: process.env.NEXT_PUBLIC_CARLOS_APP_ID || 'ee91a6fb-c1a4-4293-9707-7268f647c4f7',
    welcomeMessage: '👋 ¡Hola Álvaro! Soy Carlos, Director de Operaciones. ¿En qué optimización de procesos, auditoría o gestión del ecosistema trabajamos hoy?',
    suggestedQuestions: [
      '¿Cuál es el estado operativo de los embudos y carritos?',
      'Genera una propuesta de estructura digital para un nuevo cliente',
      'Auditoría y diagnóstico de procesos en FluentCRM y WooCommerce',
    ],
  },
  {
    id: 'wendy',
    name: 'WENDY',
    role: 'Coach y Customer Success',
    subtitle: 'Fidelización & Retención',
    desc: 'Especialista en éxito de clientes, onboarding, satisfacción y coaching estratégico.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    accentColor: 'rose',
    badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    apiKeyEnvVar: 'NEXT_PUBLIC_WENDY_API_KEY',
    apiKey: process.env.NEXT_PUBLIC_WENDY_API_KEY || 'app-oWsZkarmRo0dkHzQz9SGx2am',
    appId: process.env.NEXT_PUBLIC_WENDY_APP_ID || '',
    welcomeMessage: '✨ ¡Hola! Soy Wendy, tu Coach y Customer Success. ¿Cómo podemos mejorar la experiencia, retención o acompañamiento de nuestros clientes hoy?',
    suggestedQuestions: [
      'Diseña un plan de Onboarding de 30 días para clientes VIP',
      'Estrategia para aumentar el LTV y reducir cancelaciones',
      'Estructura una sesión de feedback y satisfacción post-compra',
    ],
  },
  {
    id: 'jessica',
    name: 'JESSICA',
    role: 'Directora Legal',
    subtitle: 'Manejo de Contratos & Acuerdos',
    desc: 'Maneja contratos, acuerdos de confidencialidad, términos legales y compliance comercial.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    accentColor: 'violet',
    badgeColor: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    apiKeyEnvVar: 'NEXT_PUBLIC_JESSICA_API_KEY',
    apiKey: process.env.NEXT_PUBLIC_JESSICA_API_KEY || 'app-kAw0I2qacD1lZ2m3NC8UyFtJ',
    appId: process.env.NEXT_PUBLIC_JESSICA_APP_ID || '',
    welcomeMessage: '⚖️ Saludos Álvaro, soy Jessica, Directora Legal. ¿Qué contrato, cláusula o acuerdo comercial revisamos o redactamos hoy?',
    suggestedQuestions: [
      'Redacta un Acuerdo de Confidencialidad (NDA) para colaboradores',
      'Estructura un Contrato de Prestación de Servicios Digitales',
      'Términos y condiciones para membresía y compras online',
    ],
  },
  {
    id: 'donald',
    name: 'DONALD',
    role: 'Director Creativo y Comercial',
    subtitle: 'Campañas & Cierre de Ventas',
    desc: 'Estratega de copywriting, ofertas irresistibles, lanzamientos y conversión de ventas.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    accentColor: 'amber',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    apiKeyEnvVar: 'NEXT_PUBLIC_DONALD_API_KEY',
    apiKey: process.env.NEXT_PUBLIC_DONALD_API_KEY || 'app-5B5Uv44T6EHxjWmhZmzpYREf',
    appId: process.env.NEXT_PUBLIC_DONALD_APP_ID || '',
    welcomeMessage: '🔥 ¡Qué tal Álvaro! Soy Donald, Director Creativo y Comercial. ¿Qué oferta, copy de ventas o campaña comercial vamos a potenciar hoy?',
    suggestedQuestions: [
      'Crea una secuencia de 5 correos para lanzamiento comercial',
      'Propón 3 ganchos y ángulos de venta para captación de leads',
      'Estructura un guion de ventas de alto valor (High-Ticket)',
    ],
  },
  {
    id: 'elliot',
    name: 'ELLIOT',
    role: 'Programador Asistente',
    subtitle: 'Código, APIs & Webhooks',
    desc: 'Especialista en desarrollo frontend/backend, integración de APIs, scripts y debug técnico.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    accentColor: 'cyan',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    apiKeyEnvVar: 'NEXT_PUBLIC_ELLIOT_API_KEY',
    apiKey: process.env.NEXT_PUBLIC_ELLIOT_API_KEY || 'app-cWQBnZs1f7Owyrqttw5sScFw',
    appId: process.env.NEXT_PUBLIC_ELLIOT_APP_ID || '',
    welcomeMessage: '💻 Hola Álvaro, soy Elliot, Programador Asistente. ¿Qué script, API, webhook o integración técnica resolvemos?',
    suggestedQuestions: [
      'Genera una función de conexión con la API de WooCommerce',
      'Estructura un webhook para procesar eventos en n8n',
      'Revisa y optimiza este fragmento de código TypeScript/React',
    ],
  },
  {
    id: 'bobby',
    name: 'BOBBY',
    role: 'Director Financiero',
    subtitle: 'Métricas, ROI & Presupuestos',
    desc: 'Líder en análisis financiero, proyecciones de flujo de caja, costes y rentabilidad.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    accentColor: 'amber',
    badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    apiKeyEnvVar: 'NEXT_PUBLIC_BOBBY_API_KEY',
    apiKey: process.env.NEXT_PUBLIC_BOBBY_API_KEY || 'app-9lC9i8lsv5ejx2JuQQ85eRwb',
    appId: process.env.NEXT_PUBLIC_BOBBY_APP_ID || '',
    welcomeMessage: '📊 Saludos Álvaro, soy Bobby, Director Financiero. ¿Qué métricas de facturación, márgenes o proyecciones de ROI analizamos hoy?',
    suggestedQuestions: [
      'Calcula el punto de equilibrio (Break-even) para un nuevo servicio',
      'Proyección de ingresos y margen neto para el próximo trimestre',
      'Modelo financiero para pricing recurrente vs pago único',
    ],
  },
  {
    id: 'darius',
    name: 'DARIUS',
    role: 'Director de Tecnología',
    subtitle: 'Arquitectura & Visión Global',
    desc: 'Líder de los proyectos y la arquitectura tecnológica. Visión global del trabajo en equipo y escalabilidad.',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    accentColor: 'blue',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    apiKeyEnvVar: 'NEXT_PUBLIC_DARIUS_API_KEY',
    apiKey: process.env.NEXT_PUBLIC_DARIUS_API_KEY || 'app-C3Xtola5DDvTLoTuwjy3RlDP',
    appId: process.env.NEXT_PUBLIC_DARIUS_APP_ID || '',
    welcomeMessage: '🏛️ Saludos Álvaro. Soy Darius, Director de Tecnología. ¿Qué arquitectura de sistemas, infraestructura o roadmap técnico escalamos hoy?',
    suggestedQuestions: [
      'Diseña la arquitectura técnica de un ecosistema multicliente',
      'Plan de escalabilidad y seguridad para base de datos y VPS',
      'Roadmap tecnológico para automatización completa del negocio',
    ],
  },
]

export const getAgentById = (id?: string): AgentConfig => {
  return AGENTS_LIST.find(a => a.id === id) || AGENTS_LIST[0]
}
