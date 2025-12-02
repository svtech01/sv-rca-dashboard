import { toast } from "sonner";

type ToastType = "success" | "error" | "warning" | "info";

export const toastProvider = {
  success(message: string) {
    toast(message, {
      icon: "✔️",
      style: {
        backgroundColor: "#d4edda",
        color: "#09bd33ff",
        border: "1px solid #c3e6cb",
        padding: "12px 16px",
        borderRadius: "8px",
        fontSize: "14px",
      },
    });
  },

  error(message: string) {
    toast(message, {
      icon: "❌",
      style: {
        backgroundColor: "#fdecea",
        color: "#e25616ff",   // your color
        border: "1px solid #f5c6cb",
        padding: "12px 16px",
        borderRadius: "8px",
        fontSize: "14px",
      },
    });
  },

  warning(message: string) {
    toast(message, {
      icon: "⚠️",
      style: {
        backgroundColor: "#fff3cd",
        color: "#a27b06ff",
        border: "1px solid #ffeeba",
        padding: "12px 16px",
        borderRadius: "8px",
        fontSize: "14px",
      },
    });
  },

  info(message: string) {
    toast(message, {
      icon: "ℹ️",
      style: {
        backgroundColor: "#d1ecf1",
        color: "#0589a0ff",
        border: "1px solid #bee5eb",
        padding: "12px 16px",
        borderRadius: "8px",
        fontSize: "14px",
      },
    });
  }
};
