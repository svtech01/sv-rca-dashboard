import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export default function LoadingSection() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      >
        <Loader2 className="w-10 h-10 text-blue-500" />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        className="text-3xl font-semibold text-gray-700"
      >
        Loading dashboard data...
      </motion.h2>
      <p className="text-gray-500 text-lg">
        Fetching datasets and calculating metrics. Please wait ⏳
      </p>
    </div>
  );
}
