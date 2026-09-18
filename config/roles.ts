export interface RoleMapping {
  roleId: string
  roleName: string
  department: string
  allowedBots: string[]
}

export const WORDPRESS_SITE_URL = process.env.WORDPRESS_SITE_URL || 'https://studioalvarodiaz.es'

export const WP_ROLES_MAP: Record<string, RoleMapping> = {
  administrator: {
    roleId: 'administrator',
    roleName: 'Administrador General',
    department: 'Dirección General',
    allowedBots: ['carlos', 'wendy', 'jessica', 'donald', 'elliot', 'bobby', 'darius', 'denova'],
  },
  um_operaciones: {
    roleId: 'um_operaciones',
    roleName: 'Editor de Operaciones e Infraestructura',
    department: 'Operaciones & Sistemas',
    allowedBots: ['carlos', 'elliot'],
  },
  um_marketing: {
    roleId: 'um_marketing',
    roleName: 'Editor de Marketing y Contenidos',
    department: 'Marketing & Contenidos',
    allowedBots: ['donald', 'elliot'],
  },
  um_comercial: {
    roleId: 'um_comercial',
    roleName: 'Editor Comercial / Ventas',
    department: 'Ventas & Cuentas',
    allowedBots: ['donald', 'wendy'],
  },
  um_legal: {
    roleId: 'um_legal',
    roleName: 'Asesor Legal / Compliance',
    department: 'Legal & Contratos',
    allowedBots: ['jessica'],
  },
  um_financiero: {
    roleId: 'um_financiero',
    roleName: 'Editor Financiero y Facturación',
    department: 'Finanzas & Facturación',
    allowedBots: ['bobby', 'jessica'],
  },
  um_coordinacion: {
    roleId: 'um_coordinacion',
    roleName: 'Editor de Coordinación / Project Manager',
    department: 'Gestión de Proyectos',
    allowedBots: ['carlos', 'donald', 'darius'],
  },
}

export interface AuthenticatedUser {
  id: string | number
  email: string
  username: string
  name: string
  role: string
  roles: string[]
  allowed_bots: string[]
  avatar?: string
}

export const getAllowedBotsForRoles = (roles: string[]): string[] => {
  if (!roles || roles.length === 0) {
    return ['carlos']
  }
  if (roles.includes('administrator')) {
    return WP_ROLES_MAP.administrator.allowedBots
  }

  const allowedSet = new Set<string>()
  roles.forEach((r) => {
    const config = WP_ROLES_MAP[r]
    if (config) {
      config.allowedBots.forEach(botId => allowedSet.add(botId))
    }
  })

  if (allowedSet.size === 0) {
    return ['carlos']
  }

  return Array.from(allowedSet)
}

export const getRoleDisplayName = (roleId?: string): string => {
  if (!roleId) {
    return 'Usuario Studio'
  }
  return WP_ROLES_MAP[roleId]?.roleName || roleId.replace(/^um_/, '').toUpperCase()
}
