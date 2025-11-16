const JamVersion = require('../models/JamVersion');
const Jam = require('../models/Jam');
const { logActivity } = require('./jamActivity');

module.exports = {
  /**
   * Create a new version snapshot of a jam
   * POST /api/jams/:jamId/versions
   */
  createVersion: async (req, res) => {
    try {
      const { versionName, description, tags, isPinned } = req.body;
      const jamId = req.params.jamId;

      // Get the jam
      const jam = await Jam.findById(jamId)
        .populate('audioElements')
        .populate('collaborators.user');

      if (!jam) {
        return res.status(404).json({ error: 'Jam not found' });
      }

      // Check if user has edit permissions
      if (!jam.canEdit(req.user.id)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only owners and producers can save versions',
        });
      }

      // Get next version number
      const versionNumber = await JamVersion.getNextVersionNumber(jamId);

      // Create version snapshot
      const version = await JamVersion.create({
        jam: jamId,
        versionNumber,
        versionName: versionName || `Version ${versionNumber}`,
        description: description || '',
        createdBy: req.user.id,
        snapshot: {
          title: jam.title,
          description: jam.description,
          genre: jam.genre,
          image: jam.image,
          isPrivate: jam.isPrivate,
          audioElements: jam.audioElements.map((clip) => clip._id),
          collaborators: jam.collaborators.map((c) => ({
            user: c.user._id || c.user,
            role: c.role,
            addedAt: c.addedAt,
            addedBy: c.addedBy,
          })),
          clipCount: jam.audioElements.length,
          collaboratorCount: jam.collaborators.length,
        },
        tags: tags || [],
        isPinned: isPinned || false,
      });

      // Log activity
      await logActivity({
        jamId,
        userId: req.user.id,
        actionType: 'jam_updated',
        description: `${req.user.userName} saved version ${versionNumber}: "${version.versionName}"`,
        metadata: {
          versionNumber,
          versionName: version.versionName,
          clipCount: jam.audioElements.length,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Version saved successfully',
        version,
      });
    } catch (error) {
      console.error('Error creating version:', error);
      res.status(500).json({ error: 'Failed to save version' });
    }
  },

  /**
   * Get all versions for a jam
   * GET /api/jams/:jamId/versions
   */
  getJamVersions: async (req, res) => {
    try {
      const jamId = req.params.jamId;
      const limit = parseInt(req.query.limit) || 50;
      const skip = parseInt(req.query.skip) || 0;

      // Check if jam exists
      const jam = await Jam.findById(jamId);
      if (!jam) {
        return res.status(404).json({ error: 'Jam not found' });
      }

      // Check if user can view the jam
      if (jam.isPrivate && !jam.canView(req.user?.id) && !jam.isOwner(req.user?.id)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to view this jam',
        });
      }

      const versions = await JamVersion.find({ jam: jamId })
        .populate('createdBy', 'userName image')
        .sort({ versionNumber: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      const totalCount = await JamVersion.countDocuments({ jam: jamId });

      res.json({
        success: true,
        versions,
        pagination: {
          total: totalCount,
          limit,
          skip,
          hasMore: skip + versions.length < totalCount,
        },
      });
    } catch (error) {
      console.error('Error fetching versions:', error);
      res.status(500).json({ error: 'Failed to fetch versions' });
    }
  },

  /**
   * Get a specific version
   * GET /api/jams/:jamId/versions/:versionNumber
   */
  getVersion: async (req, res) => {
    try {
      const { jamId, versionNumber } = req.params;

      const version = await JamVersion.findOne({
        jam: jamId,
        versionNumber: parseInt(versionNumber),
      })
        .populate('createdBy', 'userName image')
        .populate('snapshot.audioElements')
        .populate('snapshot.collaborators.user', 'userName image')
        .lean();

      if (!version) {
        return res.status(404).json({ error: 'Version not found' });
      }

      // Check if user can view the jam
      const jam = await Jam.findById(jamId);
      if (jam.isPrivate && !jam.canView(req.user?.id) && !jam.isOwner(req.user?.id)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You do not have permission to view this jam',
        });
      }

      res.json({
        success: true,
        version,
      });
    } catch (error) {
      console.error('Error fetching version:', error);
      res.status(500).json({ error: 'Failed to fetch version' });
    }
  },

  /**
   * Restore a jam to a specific version
   * POST /api/jams/:jamId/versions/:versionNumber/restore
   */
  restoreVersion: async (req, res) => {
    try {
      const { jamId, versionNumber } = req.params;
      const { createBackup } = req.body; // Option to create a backup before restoring

      const version = await JamVersion.findOne({
        jam: jamId,
        versionNumber: parseInt(versionNumber),
      }).populate('snapshot.audioElements');

      if (!version) {
        return res.status(404).json({ error: 'Version not found' });
      }

      const jam = await Jam.findById(jamId).populate('audioElements');

      if (!jam) {
        return res.status(404).json({ error: 'Jam not found' });
      }

      // Check if user has edit permissions
      if (!jam.canEdit(req.user.id)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only owners and producers can restore versions',
        });
      }

      // Optionally create a backup of current state before restoring
      if (createBackup) {
        const backupVersionNumber = await JamVersion.getNextVersionNumber(jamId);
        await JamVersion.create({
          jam: jamId,
          versionNumber: backupVersionNumber,
          versionName: `Backup before restore to v${versionNumber}`,
          description: 'Automatic backup created before version restore',
          createdBy: req.user.id,
          snapshot: {
            title: jam.title,
            description: jam.description,
            genre: jam.genre,
            image: jam.image,
            isPrivate: jam.isPrivate,
            audioElements: jam.audioElements.map((clip) => clip._id),
            collaborators: jam.collaborators,
            clipCount: jam.audioElements.length,
            collaboratorCount: jam.collaborators.length,
          },
          tags: ['backup', 'auto'],
        });
      }

      // Restore jam to version snapshot
      await Jam.findByIdAndUpdate(jamId, {
        title: version.snapshot.title,
        description: version.snapshot.description,
        genre: version.snapshot.genre,
        // Note: We don't restore image to avoid overwriting
        isPrivate: version.snapshot.isPrivate,
        audioElements: version.snapshot.audioElements,
        collaborators: version.snapshot.collaborators,
      });

      // Log activity
      await logActivity({
        jamId,
        userId: req.user.id,
        actionType: 'jam_updated',
        description: `${req.user.userName} restored jam to version ${versionNumber}: "${version.versionName}"`,
        metadata: {
          versionNumber,
          versionName: version.versionName,
          previousClipCount: jam.audioElements.length,
          restoredClipCount: version.snapshot.clipCount,
        },
      });

      res.json({
        success: true,
        message: 'Version restored successfully',
        restoredVersion: versionNumber,
      });
    } catch (error) {
      console.error('Error restoring version:', error);
      res.status(500).json({ error: 'Failed to restore version' });
    }
  },

  /**
   * Delete a version
   * DELETE /api/jams/:jamId/versions/:versionNumber
   */
  deleteVersion: async (req, res) => {
    try {
      const { jamId, versionNumber } = req.params;

      const version = await JamVersion.findOne({
        jam: jamId,
        versionNumber: parseInt(versionNumber),
      });

      if (!version) {
        return res.status(404).json({ error: 'Version not found' });
      }

      const jam = await Jam.findById(jamId);
      if (!jam) {
        return res.status(404).json({ error: 'Jam not found' });
      }

      // Only owner or the person who created the version can delete it
      if (!jam.isOwner(req.user.id) && version.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only the jam owner or version creator can delete this version',
        });
      }

      await version.deleteOne();

      res.json({
        success: true,
        message: 'Version deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting version:', error);
      res.status(500).json({ error: 'Failed to delete version' });
    }
  },

  /**
   * Update version metadata (name, description, tags, pinned status)
   * PATCH /api/jams/:jamId/versions/:versionNumber
   */
  updateVersion: async (req, res) => {
    try {
      const { jamId, versionNumber } = req.params;
      const { versionName, description, tags, isPinned } = req.body;

      const version = await JamVersion.findOne({
        jam: jamId,
        versionNumber: parseInt(versionNumber),
      });

      if (!version) {
        return res.status(404).json({ error: 'Version not found' });
      }

      const jam = await Jam.findById(jamId);
      if (!jam) {
        return res.status(404).json({ error: 'Jam not found' });
      }

      // Only owner or the person who created the version can update it
      if (!jam.isOwner(req.user.id) && version.createdBy.toString() !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Only the jam owner or version creator can update this version',
        });
      }

      // Update fields
      if (versionName !== undefined) version.versionName = versionName;
      if (description !== undefined) version.description = description;
      if (tags !== undefined) version.tags = tags;
      if (isPinned !== undefined) version.isPinned = isPinned;

      await version.save();

      res.json({
        success: true,
        message: 'Version updated successfully',
        version,
      });
    } catch (error) {
      console.error('Error updating version:', error);
      res.status(500).json({ error: 'Failed to update version' });
    }
  },

  /**
   * Compare two versions
   * GET /api/jams/:jamId/versions/compare?v1=1&v2=2
   */
  compareVersions: async (req, res) => {
    try {
      const { jamId } = req.params;
      const v1 = parseInt(req.query.v1);
      const v2 = parseInt(req.query.v2);

      if (!v1 || !v2) {
        return res.status(400).json({
          error: 'Invalid parameters',
          message: 'Please provide v1 and v2 query parameters',
        });
      }

      const [version1, version2] = await Promise.all([
        JamVersion.findOne({ jam: jamId, versionNumber: v1 })
          .populate('snapshot.audioElements')
          .populate('createdBy', 'userName image'),
        JamVersion.findOne({ jam: jamId, versionNumber: v2 })
          .populate('snapshot.audioElements')
          .populate('createdBy', 'userName image'),
      ]);

      if (!version1 || !version2) {
        return res.status(404).json({ error: 'One or both versions not found' });
      }

      // Calculate differences
      const v1ClipIds = new Set(version1.snapshot.audioElements.map((c) => c._id.toString()));
      const v2ClipIds = new Set(version2.snapshot.audioElements.map((c) => c._id.toString()));

      const addedClips = version2.snapshot.audioElements.filter(
        (c) => !v1ClipIds.has(c._id.toString())
      );
      const removedClips = version1.snapshot.audioElements.filter(
        (c) => !v2ClipIds.has(c._id.toString())
      );

      const differences = {
        title: {
          changed: version1.snapshot.title !== version2.snapshot.title,
          v1: version1.snapshot.title,
          v2: version2.snapshot.title,
        },
        description: {
          changed: version1.snapshot.description !== version2.snapshot.description,
          v1: version1.snapshot.description,
          v2: version2.snapshot.description,
        },
        genre: {
          changed: version1.snapshot.genre !== version2.snapshot.genre,
          v1: version1.snapshot.genre,
          v2: version2.snapshot.genre,
        },
        isPrivate: {
          changed: version1.snapshot.isPrivate !== version2.snapshot.isPrivate,
          v1: version1.snapshot.isPrivate,
          v2: version2.snapshot.isPrivate,
        },
        clips: {
          added: addedClips,
          removed: removedClips,
          addedCount: addedClips.length,
          removedCount: removedClips.length,
        },
        collaborators: {
          v1Count: version1.snapshot.collaboratorCount,
          v2Count: version2.snapshot.collaboratorCount,
          changed: version1.snapshot.collaboratorCount !== version2.snapshot.collaboratorCount,
        },
      };

      res.json({
        success: true,
        version1: {
          versionNumber: version1.versionNumber,
          versionName: version1.versionName,
          createdAt: version1.createdAt,
          createdBy: version1.createdBy,
        },
        version2: {
          versionNumber: version2.versionNumber,
          versionName: version2.versionName,
          createdAt: version2.createdAt,
          createdBy: version2.createdBy,
        },
        differences,
      });
    } catch (error) {
      console.error('Error comparing versions:', error);
      res.status(500).json({ error: 'Failed to compare versions' });
    }
  },
};
