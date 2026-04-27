import { Router } from 'express';
import { isAuth, authorizeRoles } from '@/middlewares/auth.middleware.js';
import { 
  getUserProfile, 
  getAdminDashboard, 
  getSharedResource, 
  getUserStatistics 
} from '@/controllers/protected.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Protected
 *   description: Protected endpoints with role-based access control
 */

/**
 * @swagger
 * /api/protected/profile:
 *   get:
 *     summary: Get user profile (authenticated users only)
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     profile:
 *                       type: object
 *       401:
 *         description: Unauthorized - token required
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get('/profile', isAuth, getUserProfile);

/**
 * @swagger
 * /api/protected/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard (admin users only)
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     adminInfo:
 *                       type: object
 *                     dashboard:
 *                       type: object
 *       401:
 *         description: Unauthorized - token required
 *       403:
 *         description: Forbidden - admin access required
 */
router.get('/admin/dashboard', isAuth, authorizeRoles('ADMIN'), getAdminDashboard);

/**
 * @swagger
 * /api/protected/shared:
 *   get:
 *     summary: Get shared resource (users and admins)
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shared resource retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     userInfo:
 *                       type: object
 *                     resource:
 *                       type: object
 *       401:
 *         description: Unauthorized - token required
 */
router.get('/shared', isAuth, authorizeRoles('USER', 'ADMIN'), getSharedResource);

/**
 * @swagger
 * /api/protected/statistics:
 *   get:
 *     summary: Get user statistics (role-based data)
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     statistics:
 *                       type: object
 *                     accessLevel:
 *                       type: string
 *       401:
 *         description: Unauthorized - token required
 */
router.get('/statistics', isAuth, authorizeRoles('USER', 'ADMIN'), getUserStatistics);

/**
 * @swagger
 * /api/protected/mentor-only:
 *   get:
 *     summary: Mentor-only endpoint example
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mentor resource accessed successfully
 *       401:
 *         description: Unauthorized - token required
 *       403:
 *         description: Forbidden - mentor access required
 */
router.get('/mentor-only', isAuth, authorizeRoles('MENTOR'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Mentor-only resource accessed successfully',
    data: {
      user: {
        id: req.user?.id,
        email: req.user?.email,
        role: req.user?.role
      },
      mentorResources: {
        students: ['user@example.com', 'test@example.com'],
        sessions: 12,
        upcomingMeetings: 3,
        mentorTools: ['schedule', 'progress_tracking', 'resource_sharing']
      }
    }
  });
});

/**
 * @swagger
 * /api/protected/user-only:
 *   get:
 *     summary: User-only endpoint (excluding admins)
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User-only resource accessed successfully
 *       401:
 *         description: Unauthorized - token required
 *       403:
 *         description: Forbidden - user access only (no admins)
 */
router.get('/user-only', isAuth, authorizeRoles('USER'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'User-only resource accessed successfully',
    data: {
      user: {
        id: req.user?.id,
        email: req.user?.email,
        role: req.user?.role
      },
      userFeatures: {
        profile: true,
        settings: true,
        documentation: true,
        support: true
      }
    }
  });
});

/**
 * @swagger
 * /api/protected/admin-or-mentor:
 *   get:
 *     summary: Admin or Mentor endpoint
 *     tags: [Protected]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin/Mentor resource accessed successfully
 *       401:
 *         description: Unauthorized - token required
 *       403:
 *         description: Forbidden - admin or mentor access required
 */
router.get('/admin-or-mentor', isAuth, authorizeRoles('ADMIN', 'MENTOR'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin/Mentor resource accessed successfully',
    data: {
      user: {
        id: req.user?.id,
        email: req.user?.email,
        role: req.user?.role
      },
      managementTools: req.user?.role === 'ADMIN' 
        ? ['user_management', 'system_config', 'analytics', 'reports']
        : ['student_management', 'progress_tracking', 'scheduling']
    }
  });
});

export default router;
