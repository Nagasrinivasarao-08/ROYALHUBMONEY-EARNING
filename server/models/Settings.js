
import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  upiId: { type: String, default: '' },
  qrCodeUrl: { type: String, default: '' },
  referralBonusPercentage: { type: Number, default: 5 },
  withdrawalFeePercentage: { type: Number, default: 5 }
});

export default mongoose.model('Settings', SettingsSchema);
