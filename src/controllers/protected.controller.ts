import { Request, Response } from 'express';
import { asyncHandler } from '@/middlewares/error.middleware.js';

/**
 * Get user profile - accessible by authenticated users only
 */
export const getUserProfile = asyncHandler(async (req: Request, res: Response) => {
  // User information is available from req.user (attached by auth middleware)
  const user = req.user;
  
  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: {
      id: user?.id,
      email: user?.email,
      role: user?.role,
      profile: {
        name: `${user?.email?.split('@')[0]}`,
        memberSince: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        permissions: getRolePermissions(user?.role || 'USER')
      }
    }
  });
});

/**
 * Get admin dashboard - accessible by admin users only
 */
export const getAdminDashboard = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  
  // Mock admin dashboard data
  const dashboardData = {
    totalUsers: 150,
    activeUsers: 89,
    newRegistrations: 12,
    systemHealth: 'Good',
    recentActivity: [
      { action: 'User Registration', user: 'newuser@example.com', time: '2 hours ago' },
      { action: 'Password Reset', user: 'user@example.com', time: '5 hours ago' },
      { action: 'Role Update', user: 'mentor@example.com', time: '1 day ago' }
    ],
    systemStats: {
      uptime: '99.9%',
      responseTime: '120ms',
      errorRate: '0.1%'
    }
  };

  res.status(200).json({
    success: true,
    message: 'Admin dashboard data retrieved successfully',
    data: {
      adminInfo: {
        id: user?.id,
        email: user?.email,
        role: user?.role
      },
      dashboard: dashboardData
    }
  });
});

/**
 * Get shared resource - accessible by both users and admins
 */
export const getSharedResource = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  
  // Mock shared resource data
  const resourceData = {
    resourceType: 'Public Documentation',
    version: '2.1.0',
    lastUpdated: new Date().toISOString(),
    content: {
      title: 'API Documentation',
      sections: [
        'Authentication Guide',
        'Endpoint Reference',
        'Error Handling',
        'Best Practices'
      ]
    },
    accessLevel: user?.role === 'ADMIN' ? 'full' : 'limited',
    features: user?.role === 'ADMIN' 
      ? ['view', 'edit', 'delete', 'manage']
      : ['view', 'comment']
  };

  res.status(200).json({
    success: true,
    message: 'Shared resource retrieved successfully',
    data: {
      userInfo: {
        id: user?.id,
        email: user?.email,
        role: user?.role
      },
      resource: resourceData
    }
  });
});

/**
 * Get user statistics - accessible by users and admins (different data based on role)
 */
export const getUserStatistics = asyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  
  let stats;
  
  if (user?.role === 'ADMIN') {
    // Admin gets comprehensive statistics
    stats = {
      overview: {
        totalUsers: 150,
        activeSessions: 89,
        pendingApprovals: 3
      },
      userBreakdown: {
        admins: 2,
        mentors: 8,
        users: 140
      },
      systemMetrics: {
        apiCalls: 15420,
        avgResponseTime: '120ms',
        errorRate: '0.1%'
      }
    };
  } else {
    // Regular users get their own statistics
    stats = {
      personal: {
        loginCount: 45,
        lastLogin: new Date().toISOString(),
        accountAge: '3 months'
      },
      activity: {
        apiCalls: 234,
        lastActivity: new Date().toISOString(),
        featuresUsed: ['profile', 'documentation', 'settings']
      }
    };
  }

  res.status(200).json({
    success: true,
    message: 'Statistics retrieved successfully',
    data: {
      user: {
        id: user?.id,
        email: user?.email,
        role: user?.role
      },
      statistics: stats,
      accessLevel: user?.role === 'ADMIN' ? 'admin' : 'user'
    }
  });
});

/**
 * Helper function to get role permissions
 */
function getRolePermissions(role: string): string[] {
  switch (role) {
    case 'ADMIN':
      return ['read', 'write', 'delete', 'manage_users', 'system_config'];
    case 'MENTOR':
      return ['read', 'write', 'mentor_users', 'view_analytics'];
    case 'USER':
      return ['read', 'write_profile', 'view_documentation'];
    default:
      return ['read'];
  }
}
