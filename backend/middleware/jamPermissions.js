const Jam = require('../models/Jam');

/**
 * Permission levels for jam collaboration
 * - owner: Can do everything (delete jam, manage collaborators, edit, contribute)
 * - producer: Can edit jam settings, add/remove clips, manage mix (cannot delete jam or manage collaborators)
 * - contributor: Can only add clips and comment (cannot edit mix or jam settings)
 * - viewer: Can only view and comment (read-only access to jam content)
 */

/**
 * Middleware to check if user is the jam owner
 */
const ensureOwner = async (req, res, next) => {
  try {
    const jam = await Jam.findById(req.params.jamid || req.params.id);

    if (!jam) {
      return res.status(404).json({ error: 'Jam not found' });
    }

    if (!jam.isOwner(req.user.id)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Only the jam owner can perform this action',
      });
    }

    // Attach jam to request for use in controller
    req.jam = jam;
    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ error: 'Permission check failed' });
  }
};

/**
 * Middleware to check if user can edit jam (owner or producer)
 */
const ensureCanEdit = async (req, res, next) => {
  try {
    const jam = await Jam.findById(req.params.jamid || req.params.id);

    if (!jam) {
      return res.status(404).json({ error: 'Jam not found' });
    }

    if (!jam.canEdit(req.user.id)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You need producer or owner role to edit this jam',
      });
    }

    req.jam = jam;
    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ error: 'Permission check failed' });
  }
};

/**
 * Middleware to check if user can contribute (owner, producer, or contributor)
 */
const ensureCanContribute = async (req, res, next) => {
  try {
    const jam = await Jam.findById(req.params.jamid || req.params.id);

    if (!jam) {
      return res.status(404).json({ error: 'Jam not found' });
    }

    if (!jam.canContribute(req.user.id)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You need contributor, producer, or owner role to add content to this jam',
      });
    }

    req.jam = jam;
    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ error: 'Permission check failed' });
  }
};

/**
 * Middleware to check if user can view jam (any collaborator or public jam)
 */
const ensureCanView = async (req, res, next) => {
  try {
    const jam = await Jam.findById(req.params.jamid || req.params.id);

    if (!jam) {
      return res.status(404).json({ error: 'Jam not found' });
    }

    // Public jams can be viewed by anyone
    if (!jam.isPrivate) {
      req.jam = jam;
      return next();
    }

    // Private jams require view permission
    if (!jam.canView(req.user.id) && !jam.isOwner(req.user.id)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'This jam is private. You need to be a collaborator to view it.',
      });
    }

    req.jam = jam;
    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({ error: 'Permission check failed' });
  }
};

/**
 * Get user's role in a jam
 */
const getUserRole = async (jamId, userId) => {
  try {
    const jam = await Jam.findById(jamId);
    if (!jam) return null;
    return jam.getUserRole(userId);
  } catch (error) {
    console.error('Get role error:', error);
    return null;
  }
};

module.exports = {
  ensureOwner,
  ensureCanEdit,
  ensureCanContribute,
  ensureCanView,
  getUserRole,
};
