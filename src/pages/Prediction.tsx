import { motion } from 'framer-motion';
import {
  Activity, Calculator, Brain, Info, AlertTriangle, CheckCircle,
  BarChart3, ArrowUp, ArrowDown,
} from 'lucide-react';
import { usePredictionStore } from '@/store/predictionStore';
import { Gauge, RiskThermometer } from '@/components/ui/Gauge';
import { RiskBadge } from '@/components/ui/Badge';

export function Prediction() {
  const { input, result, isPredicting, setInput, runPrediction } = usePredictionStore();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-text-primary">MCI Conversion Prediction</h1>
        <p className="text-sm text-text-secondary mt-1">24-month Alzheimer's conversion risk assessment using multimodal biomarkers</p>
      </motion.div>

      <div className="grid xl:grid-cols-[1fr_400px] gap-6">
        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="medical-card p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <Calculator size={18} className="text-medical-500" />
            <h2 className="card-title">Clinical Biomarkers</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Age</label>
              <input
                type="number"
                value={input.age}
                onChange={(e) => setInput({ age: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Gender</label>
              <select
                value={input.gender}
                onChange={(e) => setInput({ gender: e.target.value as 'Male' | 'Female' })}
                className="input-field"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="label">MMSE Score (0-30)</label>
              <input
                type="number"
                min={0}
                max={30}
                value={input.mmse}
                onChange={(e) => setInput({ mmse: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">CDR (0-3)</label>
              <input
                type="number"
                min={0}
                max={3}
                step={0.5}
                value={input.cdr}
                onChange={(e) => setInput({ cdr: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">APOE4 Status</label>
              <select
                value={input.apoe4}
                onChange={(e) => setInput({ apoe4: e.target.value as any })}
                className="input-field"
              >
                <option value="Negative">Negative</option>
                <option value="Heterozygous">Heterozygous</option>
                <option value="Homozygous">Homozygous</option>
              </select>
            </div>
            <div>
              <label className="label">Hippocampal Volume (cm³)</label>
              <input
                type="number"
                step={0.1}
                value={input.hippocampalVolume}
                onChange={(e) => setInput({ hippocampalVolume: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Entorhinal Volume (cm³)</label>
              <input
                type="number"
                step={0.1}
                value={input.entorhinalVolume}
                onChange={(e) => setInput({ entorhinalVolume: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Ventricular Volume (cm³)</label>
              <input
                type="number"
                step={0.1}
                value={input.ventricularVolume}
                onChange={(e) => setInput({ ventricularVolume: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div>
              <label className="label">Education (years)</label>
              <input
                type="number"
                value={input.educationYears}
                onChange={(e) => setInput({ educationYears: Number(e.target.value) })}
                className="input-field"
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={input.familyHistory}
                  onChange={(e) => setInput({ familyHistory: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-medical-500 focus:ring-medical-400"
                />
                <span className="text-sm font-medium text-text-secondary">Family History</span>
              </label>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={runPrediction}
              disabled={isPredicting}
              className="btn-primary"
            >
              {isPredicting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Computing...
                </>
              ) : (
                <>
                  <Activity size={16} /> Run Prediction
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          {isPredicting ? (
            <div className="medical-card p-8 flex flex-col items-center justify-center min-h-[300px]">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 border-4 border-medical-500 border-t-transparent rounded-full mb-4"
              />
              <p className="text-sm font-semibold text-text-primary">Computing Prediction</p>
              <p className="text-xs text-text-secondary mt-1">Analyzing biomarker relationships...</p>
            </div>
          ) : result ? (
            <>
              {/* Conversion Probability */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="medical-card p-6 text-center"
              >
                <h3 className="card-title mb-4">24-Month Conversion Probability</h3>
                <Gauge
                  value={Math.round(result.conversionProbability * 100)}
                  maxValue={100}
                  label="Conversion Risk"
                  unit="%"
                  threshold={{ low: 25, medium: 50, high: 75 }}
                  size={180}
                />
                <div className="mt-4 flex items-center justify-center gap-2">
                  <RiskBadge category={result.riskCategory} />
                  <span className="text-xs text-text-tertiary">
                    Confidence: {(result.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </motion.div>

              {/* Clinical Recommendation */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="medical-card p-4"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="text-medical-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-text-primary mb-1">Clinical Recommendation</h4>
                    <p className="text-sm text-text-secondary">{result.recommendation}</p>
                  </div>
                </div>
              </motion.div>

              {/* SHAP Feature Importance */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="medical-card p-6"
              >
                <h3 className="card-title mb-4 flex items-center gap-2">
                  <BarChart3 size={16} className="text-medical-500" />
                  SHAP Feature Importance
                </h3>
                <div className="space-y-3">
                  {result.featureImportance
                    .sort((a, b) => b.importance - a.importance)
                    .map((feat, i) => (
                      <motion.div
                        key={feat.feature}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary">{feat.feature}</span>
                            {feat.direction === 'positive' ? (
                              <ArrowUp size={12} className="text-red-500" />
                            ) : (
                              <ArrowDown size={12} className="text-green-500" />
                            )}
                          </div>
                          <span className={`text-xs font-semibold ${feat.direction === 'positive' ? 'text-red-600' : 'text-green-600'
                            }`}>
                            {feat.direction === 'positive' ? '+' : ''}{feat.contribution.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${feat.importance * 100}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            className={`h-full rounded-full ${feat.direction === 'positive' ? 'bg-red-400' : 'bg-green-400'
                              }`}
                          />
                        </div>
                        <p className="text-[11px] text-text-tertiary mt-1">{feat.explanation}</p>
                      </motion.div>
                    ))}
                </div>
              </motion.div>
            </>
          ) : (
            <div className="medical-card p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
              <Brain size={48} className="text-text-tertiary mb-4" />
              <h3 className="text-lg font-bold text-text-primary mb-2">Ready to Predict</h3>
              <p className="text-sm text-text-secondary max-w-xs">
                Enter clinical biomarkers on the left and run the prediction to assess 24-month conversion risk.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
