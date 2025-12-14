import { getProfileDataManager, updateProfileDataManager} from "../managers/profile.manager.js";

export const getProfileBulkData = async (req, res) => {
  try {
    // Extract userId from JWT (set by auth middleware)
    const userId = req.user._id;

    // Call manager function
    const data = await getProfileDataManager(userId);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Profile data fetched successfully',
      data
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message:  'Failed to fetch profile data'
    });
  }
};

export const updateProfileBulkData = async (req, res) => {
  try {

    const userId = req.user._id;
    let userData = null;

    if (req.body.user) {
      try {
        userData = JSON.parse(req.body.user);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON format for user data',
          error: parseError.message
        });
      }
    }

    const file = req.file;
    if (!userData  && !file) {
      return res.status(400).json({
        success: false,
        message: 'No updates provided. Please provide user data or profile picture'
      });
    }
    const result = await updateProfileDataManager(userId, userData, file);
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      result
    });

  } catch (error) {
    console.error('  Update Profile Bulk Data Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile',
      
    });
  }
};