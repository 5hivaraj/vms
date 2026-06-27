import Admin from '../models/Admin.js';
import Settings from '../models/Settings.js';
import { repairInductionVideoSettings } from '../constants/inductionVideo.js';
import { repairPermitSettings } from '../constants/permitToken.js';
import { repairAssessmentSettings } from '../services/assessmentService.js';

export const ensureDevData = async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@company.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  let admin = await Admin.findOne({ email });
  if (!admin) {
    await Admin.create({ email, password, name: 'Admin' });
    console.log(`Default admin ready: ${email}`);
  } else if (!(await admin.comparePassword(password))) {
    admin.password = password;
    await admin.save();
    console.log(`Default admin password synced: ${email}`);
  }

  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
    console.log('Default settings created');
  } else {
    await repairInductionVideoSettings(settings);
    await repairAssessmentSettings(settings);
    await repairPermitSettings(settings);
  }
};
