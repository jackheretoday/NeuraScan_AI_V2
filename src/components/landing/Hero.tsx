import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle, Brain, Activity, TrendingUp, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function BrainVisualization() {
  const nodes = [
    { x: 200, y: 100, label: 'Frontal' },
    { x: 120, y: 150, label: 'Temporal' },
    { x: 280, y: 150, label: 'Parietal' },
    { x: 200, y: 200, label: 'Occipital' },
    { x: 160, y: 120, label: 'Hippocampus' },
    { x: 240, y: 120, label: 'Thalamus' },
    { x: 200, y: 160, label: 'Cerebellum' },
  ];

  const connections = [
    [0, 1], [0, 2], [0, 4], [0, 5],
    [1, 3], [1, 4], [2, 3], [2, 5],
    [3, 6], [4, 5], [5, 6],
  ];

  return (
    <div className="relative w-full max-w-[500px] mx-auto">
      <svg viewBox="0 0 400 280" className="w-full h-auto">
        <defs>
          <radialGradient id="brainGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(26, 95, 168, 0.15)" />
            <stop offset="100%" stopColor="rgba(26, 95, 168, 0)" />
          </radialGradient>
        </defs>

        <circle cx="200" cy="150" r="140" fill="url(#brainGlow)" />

        {/* Connections */}
        {connections.map(([i, j], idx) => (
          <motion.line
            key={`conn-${idx}`}
            x1={nodes[i].x}
            y1={nodes[i].y}
            x2={nodes[j].x}
            y2={nodes[j].y}
            stroke="rgba(26, 95, 168, 0.15)"
            strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: idx * 0.1, ease: 'easeInOut' }}
          />
        ))}

        {/* Nodes */}
        {nodes.map((node, idx) => (
          <motion.g key={`node-${idx}`}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="4"
              fill="#1a5fa8"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + idx * 0.15, type: 'spring' }}
            />
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="8"
              fill="rgba(26, 95, 168, 0.1)"
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, delay: idx * 0.2, repeat: Infinity }}
            />
          </motion.g>
        ))}

        {/* Scanning Line */}
        <motion.rect
          x="60"
          y="40"
          width="280"
          height="2"
          fill="rgba(26, 95, 168, 0.3)"
          animate={{ y: [40, 240, 40] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
      </svg>

      {/* Live Metrics */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 grid grid-cols-2 gap-3 w-[90%]">
        {[
          { icon: Brain, value: '12,847', label: 'MRI Scans Analyzed', color: '#1a5fa8' },
          { icon: Activity, value: '8,432', label: 'Risk Assessments', color: '#0d9488' },
          { icon: TrendingUp, value: '6,210', label: 'Patients Monitored', color: '#22c55e' },
          { icon: Shield, value: '94.2%', label: 'Prediction Accuracy', color: '#14b8a6' },
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + i * 0.1 }}
            className="glass-card rounded-xl p-3 flex items-center gap-3"
          >
            <metric.icon size={20} style={{ color: metric.color }} />
            <div>
              <p className="text-lg font-bold text-text-primary">{metric.value}</p>
              <p className="text-[10px] text-text-tertiary">{metric.label}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[90vh] flex items-center bg-gradient-to-b from-medical-950 via-medical-900 to-medical-950 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-medical-800/50 border border-medical-700/50 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs font-medium text-teal-300">FDA-Cleared Clinical Decision Support System</span>
            </motion.div>

            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-tight tracking-tight">
              AI-Powered Neurological Intelligence for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
                Early Detection
              </span>{' '}
              and Progression Prediction
            </h1>

            <p className="text-lg text-medical-200 mt-6 max-w-xl leading-relaxed">
              Transform MRI scans and clinical biomarkers into explainable neurological insights using multimodal artificial intelligence. Built for hospitals, trusted by clinicians.
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-medical-500 hover:bg-medical-400 text-white rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-medical-500/25"
              >
                Start Analysis <ArrowRight size={16} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-sm transition-colors border border-white/10"
              >
                <PlayCircle size={16} />
                Request Demo
              </motion.button>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-6 mt-10 pt-8 border-t border-medical-800">
              {['HIPAA Compliant', 'FDA Cleared', 'CE Marked', 'CDSCO Registered'].map((badge) => (
                <span key={badge} className="text-xs text-medical-400 font-medium">
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right Visualization */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="hidden lg:block"
          >
            <BrainVisualization />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
