import mongoose from "mongoose";

const AnalyticsSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true },
  testId: { type: Number, required: true },
  weakTopics: [String],
  strongTopics: [String],
  recommendedResources: [String],
  insightDate: { type: Date, default: Date.now },
});

// Auto-increment counter for MongoDB IDs
const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', CounterSchema);

async function getNextSequenceValue(sequenceName: string) {
   const sequenceDocument = await Counter.findOneAndUpdate(
      { _id: sequenceName },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
   );
   return sequenceDocument.seq;
}

export const MongoAnalytics = mongoose.model("Analytics", AnalyticsSchema);

export { getNextSequenceValue };
